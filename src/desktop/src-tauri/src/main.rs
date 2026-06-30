use std::fs;
use std::net::{TcpListener, TcpStream};
use std::process::{Child, Command, Stdio};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};
use std::thread;
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

mod desktop_storage;

use semver::{Version, VersionReq};
use serde::{Deserialize, Serialize};
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};

use desktop_storage::{DesktopStorage, StoredRecord};

const KEYRING_SERVICE: &str = "servaan-desktop";
const CREATE_NO_WINDOW: u32 = 0x08000000;
const HEALTH_EVENT_NAME: &str = "servaan-sidecar-status";
const COMPATIBLE_SIDECAR_VERSION_RANGE: &str = ">=0.1.0, <0.2.0";
const HEALTH_CHECK_INTERVAL: Duration = Duration::from_secs(2);
const HEALTH_BACKOFF_MAX: Duration = Duration::from_secs(10);
const STARTUP_TIMEOUT: Duration = Duration::from_secs(45);

#[derive(Debug, Deserialize)]
struct SidecarHealthResponse {
    service: String,
    status: String,
    version: String,
    timestamp: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct SidecarStatusEvent {
    healthy: bool,
    state: String,
    detail: String,
    port: u16,
    url: String,
    version: Option<String>,
    restart_attempts: u8,
    sequence: u64,
}

#[cfg_attr(debug_assertions, allow(dead_code))]
fn pick_private_port() -> Result<u16, String> {
    TcpListener::bind(("127.0.0.1", 0))
        .and_then(|listener| listener.local_addr())
        .map(|addr| addr.port())
        .map_err(|error| error.to_string())
}

#[cfg_attr(not(debug_assertions), allow(dead_code))]
fn port_is_open(port: u16) -> bool {
    TcpStream::connect(("127.0.0.1", port)).is_ok()
}

#[cfg(debug_assertions)]
fn spawn_local_dev_stack(port: u16) -> Result<Option<Child>, String> {
    if port_is_open(port) {
        return Ok(None);
    }

    let repo_root = find_repo_root().ok_or_else(|| "Unable to locate Servaan repository root.".to_string())?;

    let mut command = Command::new("npm");
    command
        .args(["run", "dev:main"])
        .current_dir(repo_root)
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(target_os = "windows")]
    {
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command.spawn().map(Some).map_err(|error| error.to_string())
}

#[cfg(not(debug_assertions))]
fn spawn_packaged_sidecar(runtime_dir: &std::path::Path, port: u16) -> Result<Child, String> {
    let node_path = runtime_dir.join("node.exe");
    let server_path = runtime_dir.join("server.js");

    if !node_path.exists() {
        return Err(format!("Missing bundled Node runtime: {}", node_path.display()));
    }

    if !server_path.exists() {
        return Err(format!("Missing bundled Next.js server: {}", server_path.display()));
    }

    let mut command = Command::new(node_path);
    command
        .arg(server_path)
        .current_dir(runtime_dir)
        .env("PORT", port.to_string())
        .env("HOSTNAME", "127.0.0.1")
        .env("NODE_ENV", "production")
        .env("NEXT_PUBLIC_API_URL", "https://api.servaan.com/api")
        .stdin(Stdio::null())
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(target_os = "windows")]
    {
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command.spawn().map_err(|error| error.to_string())
}

fn sidecar_url(port: u16) -> String {
    format!("http://127.0.0.1:{port}/native")
}

fn health_url(port: u16) -> String {
    format!("http://127.0.0.1:{port}/api/health")
}

fn probe_sidecar_health(port: u16) -> Result<(bool, Option<String>, String), String> {
    let url = health_url(port);
    let agent = ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(1))
        .timeout_read(Duration::from_secs(1))
        .build();

    let response = agent.get(&url).call().map_err(|error| error.to_string())?;
    let health = response
        .into_json::<SidecarHealthResponse>()
        .map_err(|error| error.to_string())?;

    if health.service != "servaan-desktop-sidecar" {
        return Ok((
            false,
            Some(health.version.clone()),
            format!("Unexpected health service: {}", health.service),
        ));
    }

    if health.status != "healthy" {
        return Ok((
            false,
            Some(health.version.clone()),
            format!("Health endpoint reported status: {}", health.status),
        ));
    }

    let req = VersionReq::parse(COMPATIBLE_SIDECAR_VERSION_RANGE).map_err(|error| error.to_string())?;
    let version = health.version.clone();
    let parsed_version = Version::parse(&version).map_err(|error| error.to_string())?;
    if !req.matches(&parsed_version) {
        return Ok((
            false,
            Some(version.clone()),
            format!(
                "Incompatible sidecar version {} outside {}",
                version,
                COMPATIBLE_SIDECAR_VERSION_RANGE
            ),
        ));
    }

    Ok((
        true,
        Some(version.clone()),
        format!("Healthy sidecar response at {}", health.timestamp.unwrap_or_else(|| "unknown".to_string())),
    ))
}

fn build_sidecar_status_event(
    port: u16,
    healthy: bool,
    state: &str,
    detail: String,
    version: Option<String>,
    restart_attempts: u8,
    sequence: u64,
) -> SidecarStatusEvent {
    SidecarStatusEvent {
        healthy,
        state: state.to_string(),
        detail,
        port,
        url: sidecar_url(port),
        version,
        restart_attempts,
        sequence,
    }
}

fn emit_sidecar_status(
    app: &AppHandle,
    port: u16,
    healthy: bool,
    state: &str,
    detail: String,
    version: Option<String>,
    restart_attempts: u8,
    sequence: u64,
) {
    let _ = app.emit(
        HEALTH_EVENT_NAME,
        build_sidecar_status_event(port, healthy, state, detail, version, restart_attempts, sequence),
    );
}

fn spawn_runtime_process(port: u16, runtime_dir: Option<&std::path::Path>) -> Result<Option<Child>, String> {
    #[cfg(debug_assertions)]
    {
        let _ = runtime_dir;
        spawn_local_dev_stack(port)
    }

    #[cfg(not(debug_assertions))]
    {
        let runtime_dir = runtime_dir.ok_or_else(|| "Missing runtime directory for packaged desktop build.".to_string())?;
        spawn_packaged_sidecar(runtime_dir, port).map(Some)
    }
}

fn restart_runtime_process(
    port: u16,
    runtime_dir: Option<&std::path::Path>,
    child: &mut Option<Child>,
) -> Result<bool, String> {
    if let Some(existing) = child.as_mut() {
        let _ = existing.kill();
        let _ = existing.wait();
    }

    *child = spawn_runtime_process(port, runtime_dir)?;
    Ok(child.is_some())
}

fn wait_for_runtime_ready(
    app: &AppHandle,
    port: u16,
    runtime_dir: Option<&std::path::Path>,
    child: &mut Option<Child>,
    restart_budget: &Arc<AtomicUsize>,
) -> Result<(), String> {
    let deadline = Instant::now() + STARTUP_TIMEOUT;
    let mut backoff = HEALTH_CHECK_INTERVAL;
    let mut sequence = 0u64;

    loop {
        sequence += 1;

        if let Some(existing) = child.as_mut() {
            if let Ok(Some(status)) = existing.try_wait() {
                let can_restart = restart_budget
                    .fetch_update(Ordering::SeqCst, Ordering::SeqCst, |current| current.checked_sub(1))
                    .is_ok();

                if can_restart {
                    emit_sidecar_status(
                        app,
                        port,
                        false,
                        "restarting",
                        format!("Runtime exited with status: {status}. Restarting once."),
                        None,
                        1,
                        sequence,
                    );

                    if restart_runtime_process(port, runtime_dir, child)? {
                        backoff = HEALTH_CHECK_INTERVAL;
                        continue;
                    }
                }

                emit_sidecar_status(
                    app,
                    port,
                    false,
                    "degraded",
                    format!("Runtime exited with status: {status}. Cached shell will remain once loaded."),
                    None,
                    1,
                    sequence,
                );
            }
        }

        match probe_sidecar_health(port) {
            Ok((healthy, version, detail)) if healthy => {
                emit_sidecar_status(app, port, true, "healthy", detail, version, 0, sequence);
                return Ok(());
            }
            Ok((_, version, detail)) => {
                let can_restart = child.is_some()
                    && restart_budget
                        .fetch_update(Ordering::SeqCst, Ordering::SeqCst, |current| current.checked_sub(1))
                        .is_ok();

                if can_restart {
                    emit_sidecar_status(
                        app,
                        port,
                        false,
                        "restarting",
                        format!("{detail}. Restarting once."),
                        version.clone(),
                        1,
                        sequence,
                    );

                    if restart_runtime_process(port, runtime_dir, child)? {
                        backoff = HEALTH_CHECK_INTERVAL;
                        if Instant::now() < deadline {
                            thread::sleep(HEALTH_CHECK_INTERVAL);
                            continue;
                        }
                    }
                }

                emit_sidecar_status(
                    app,
                    port,
                    false,
                    "degraded",
                    format!("{detail}. Cached shell will remain once loaded."),
                    version,
                    1,
                    sequence,
                );
            }
            Err(error) => {
                let can_restart = child.is_some()
                    && restart_budget
                        .fetch_update(Ordering::SeqCst, Ordering::SeqCst, |current| current.checked_sub(1))
                        .is_ok();

                if can_restart {
                    emit_sidecar_status(
                        app,
                        port,
                        false,
                        "restarting",
                        format!("{error}. Restarting once."),
                        None,
                        1,
                        sequence,
                    );

                    if restart_runtime_process(port, runtime_dir, child)? {
                        backoff = HEALTH_CHECK_INTERVAL;
                        if Instant::now() < deadline {
                            thread::sleep(HEALTH_CHECK_INTERVAL);
                            continue;
                        }
                    }
                }

                emit_sidecar_status(
                    app,
                    port,
                    false,
                    "degraded",
                    format!("{error}. Cached shell will remain once loaded."),
                    None,
                    1,
                    sequence,
                );
            }
        }

        if Instant::now() >= deadline {
            return Err(format!(
                "Runtime on port {port} did not become healthy before launch timeout."
            ));
        }

        thread::sleep(backoff);
        backoff = std::cmp::min(backoff * 2, HEALTH_BACKOFF_MAX);
    }
}

fn monitor_runtime(
    app: AppHandle,
    port: u16,
    runtime_dir: Option<std::path::PathBuf>,
    mut child: Option<Child>,
    restart_budget: Arc<AtomicUsize>,
) {
    let mut backoff = HEALTH_CHECK_INTERVAL;
    let mut sequence = 1000u64;

    loop {
        sequence += 1;

        if let Some(existing) = child.as_mut() {
            if let Ok(Some(status)) = existing.try_wait() {
                let can_restart = restart_budget
                    .fetch_update(Ordering::SeqCst, Ordering::SeqCst, |current| current.checked_sub(1))
                    .is_ok();

                if can_restart {
                    emit_sidecar_status(
                        &app,
                        port,
                        false,
                        "restarting",
                        format!("Runtime exited with status: {status}. Restarting once."),
                        None,
                        1,
                        sequence,
                    );

                    if restart_runtime_process(port, runtime_dir.as_deref(), &mut child).is_ok() && child.is_some() {
                        backoff = HEALTH_CHECK_INTERVAL;
                        thread::sleep(HEALTH_CHECK_INTERVAL);
                        continue;
                    }
                }

                emit_sidecar_status(
                    &app,
                    port,
                    false,
                    "degraded",
                    format!("Runtime exited with status: {status}. Cached shell stays visible."),
                    None,
                    1,
                    sequence,
                );
            }
        }

        match probe_sidecar_health(port) {
            Ok((healthy, version, detail)) if healthy => {
                emit_sidecar_status(&app, port, true, "healthy", detail, version, 0, sequence);
                thread::sleep(HEALTH_CHECK_INTERVAL);
                continue;
            }
            Ok((_, version, detail)) => {
                emit_sidecar_status(&app, port, false, "degraded", detail, version, 1, sequence);
            }
            Err(error) => {
                emit_sidecar_status(&app, port, false, "degraded", error, None, 1, sequence);
            }
        }

        thread::sleep(backoff);
        backoff = std::cmp::min(backoff * 2, HEALTH_BACKOFF_MAX);
    }
}

fn create_main_window(app: &AppHandle, port: u16) -> Result<(), String> {
    let target_url = url::Url::parse(&sidecar_url(port)).map_err(|error| error.to_string())?;

    WebviewWindowBuilder::new(app, "main", WebviewUrl::External(target_url))
        .title("Servaan Desktop")
        .inner_size(1280.0, 820.0)
        .min_inner_size(1024.0, 700.0)
        .resizable(true)
        .visible(true)
        .build()
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[cfg_attr(not(debug_assertions), allow(dead_code))]
fn find_repo_root() -> Option<std::path::PathBuf> {
    let mut current = std::env::current_exe().ok()?.parent()?.to_path_buf();
    loop {
        let package_json = current.join("package.json");
        let frontend_package = current.join("src").join("frontend").join("package.json");
        if package_json.exists() && frontend_package.exists() {
            return Some(current);
        }

        if !current.pop() {
            return None;
        }
    }
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

#[tauri::command]
fn store_secret(key: String, value: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|error| error.to_string())?;
    entry.set_password(&value).map_err(|error| error.to_string())
}

#[tauri::command]
fn get_secret(key: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|error| error.to_string())?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn delete_secret(key: String) -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, &key).map_err(|error| error.to_string())?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
fn print_receipt_text(receipt_text: String, printer_name: Option<String>) -> Result<(), String> {
    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|error| error.to_string())?
        .as_millis();
    let file_path = std::env::temp_dir().join(format!("servaan-receipt-{timestamp}.txt"));

    fs::write(&file_path, receipt_text).map_err(|error| error.to_string())?;

    #[cfg(target_os = "windows")]
    {
        let mut command = Command::new("cmd");
        command.arg("/C").arg("print");

        if let Some(printer) = printer_name.filter(|value| !value.trim().is_empty()) {
            command.arg(format!("/D:{printer}"));
        }

        let status = command
            .arg(&file_path)
            .status()
            .map_err(|error| error.to_string())?;

        if status.success() {
            Ok(())
        } else {
            Err(format!("Windows print command failed with status: {status}"))
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let _ = printer_name;
        Err("Local receipt printing is currently implemented for Windows only.".to_string())
    }
}

#[tauri::command]
fn sqlite_set_value(
    storage: State<'_, DesktopStorage>,
    store: String,
    key: String,
    value: serde_json::Value,
) -> Result<(), String> {
    storage.set_value(&store, &key, &value)
}

#[tauri::command]
fn sqlite_get_value(
    storage: State<'_, DesktopStorage>,
    store: String,
    key: String,
) -> Result<Option<serde_json::Value>, String> {
    storage.get_value(&store, &key)
}

#[tauri::command]
fn sqlite_list_values(storage: State<'_, DesktopStorage>, store: String) -> Result<Vec<StoredRecord>, String> {
    storage.list_values(&store)
}

#[tauri::command]
fn sqlite_delete_value(
    storage: State<'_, DesktopStorage>,
    store: String,
    key: String,
) -> Result<(), String> {
    storage.delete_value(&store, &key)
}

#[tauri::command]
fn sqlite_clear_store(storage: State<'_, DesktopStorage>, store: String) -> Result<(), String> {
    storage.clear_store(&store)
}

fn initialize_desktop_storage(app: &tauri::App) -> Result<DesktopStorage, String> {
    let base_dir = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;
    let db_path = base_dir.join("servaan-local-cache.sqlite");
    DesktopStorage::initialize(db_path)
}

#[cfg(not(debug_assertions))]
fn resolve_packaged_runtime_dir(app: &tauri::App) -> Result<std::path::PathBuf, String> {
    let resource_dir = app.path().resource_dir().map_err(|error| error.to_string())?;
    let mut candidates = vec![
        resource_dir.join("runtime"),
        resource_dir.join("resources").join("runtime"),
    ];

    if let Ok(exe_path) = std::env::current_exe() {
        if let Some(exe_dir) = exe_path.parent() {
            candidates.push(exe_dir.join("runtime"));
            candidates.push(exe_dir.join("resources").join("runtime"));
        }
    }

    candidates
        .into_iter()
        .find(|candidate| candidate.join("node.exe").exists() && candidate.join("server.js").exists())
        .ok_or_else(|| {
            format!(
                "Unable to locate packaged desktop runtime under {}",
                resource_dir.display()
            )
        })
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let desktop_storage = initialize_desktop_storage(app)?;
            app.manage(desktop_storage);

            let restart_budget = Arc::new(AtomicUsize::new(1));

            #[cfg(debug_assertions)]
            let runtime_port = 3000;

            #[cfg(not(debug_assertions))]
            let runtime_port = pick_private_port().map_err(|error| std::io::Error::other(error))?;

            #[cfg(debug_assertions)]
            let runtime_dir: Option<std::path::PathBuf> = None;

            #[cfg(not(debug_assertions))]
            let runtime_dir = Some(resolve_packaged_runtime_dir(app).map_err(|error| std::io::Error::other(error))?);

            #[cfg(debug_assertions)]
            let mut child = spawn_local_dev_stack(runtime_port).map_err(|error| std::io::Error::other(error))?;

            #[cfg(not(debug_assertions))]
            let mut child = Some(spawn_packaged_sidecar(runtime_dir.as_ref().unwrap(), runtime_port).map_err(|error| {
                std::io::Error::other(format!("Failed to start packaged desktop sidecar: {error}"))
            })?);

            wait_for_runtime_ready(app.handle(), runtime_port, runtime_dir.as_deref(), &mut child, &restart_budget)
                .map_err(|error| std::io::Error::other(error))?;

            create_main_window(app.handle(), runtime_port).map_err(|error| std::io::Error::other(error))?;

            let monitor_app = app.handle().clone();
            let monitor_runtime_dir = runtime_dir.clone();
            let monitor_budget = restart_budget.clone();
            thread::spawn(move || {
                monitor_runtime(
                    monitor_app,
                    runtime_port,
                    monitor_runtime_dir,
                    child,
                    monitor_budget,
                );
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_app_version,
            store_secret,
            get_secret,
            delete_secret,
            print_receipt_text,
            sqlite_set_value,
            sqlite_get_value,
            sqlite_list_values,
            sqlite_delete_value,
            sqlite_clear_store
        ])
        .run(tauri::generate_context!())
        .expect("error while running Servaan desktop app");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sidecar_status_event_contract_stays_stable() {
        let payload = build_sidecar_status_event(
            41234,
            false,
            "restarting",
            "Runtime exited. Restarting once.".to_string(),
            Some("0.1.3".to_string()),
            1,
            42,
        );

        let value = serde_json::to_value(payload).expect("sidecar status payload should serialize");

        assert_eq!(value["healthy"], false);
        assert_eq!(value["state"], "restarting");
        assert_eq!(value["detail"], "Runtime exited. Restarting once.");
        assert_eq!(value["port"], 41234);
        assert_eq!(value["url"], "http://127.0.0.1:41234/native");
        assert_eq!(value["version"], "0.1.3");
        assert_eq!(value["restart_attempts"], 1);
        assert_eq!(value["sequence"], 42);
    }
}
