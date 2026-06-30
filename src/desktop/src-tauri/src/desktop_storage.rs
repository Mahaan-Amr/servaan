use aes_gcm::aead::{Aead, AeadCore, KeyInit, OsRng};
use aes_gcm::{Aes256Gcm, Nonce};
use base64::{engine::general_purpose::STANDARD, Engine as _};
use rand::RngCore;
use rusqlite::{params, Connection, OptionalExtension};
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::PathBuf;

const STORAGE_KEY_SERVICE: &str = "servaan-desktop";
const STORAGE_KEY_NAME: &str = "sqlite-master-key";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StoredRecord {
    pub key: String,
    pub value: Value,
}

#[derive(Clone)]
pub struct DesktopStorage {
    db_path: PathBuf,
    key: [u8; 32],
}

impl DesktopStorage {
    pub fn initialize(db_path: PathBuf) -> Result<Self, String> {
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent).map_err(|error| error.to_string())?;
        }

        let key = Self::load_or_create_key()?;
        let storage = Self { db_path, key };
        storage.init_schema()?;
        Ok(storage)
    }

    fn load_or_create_key() -> Result<[u8; 32], String> {
        let entry = keyring::Entry::new(STORAGE_KEY_SERVICE, STORAGE_KEY_NAME).map_err(|error| error.to_string())?;

        if let Ok(stored) = entry.get_password() {
            let decoded = STANDARD.decode(stored).map_err(|error| error.to_string())?;
            let bytes: [u8; 32] = decoded
                .try_into()
                .map_err(|_| "SQLite encryption key must be 32 bytes.".to_string())?;
            return Ok(bytes);
        }

        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        entry
            .set_password(&STANDARD.encode(key))
            .map_err(|error| error.to_string())?;
        Ok(key)
    }

    fn open_connection(&self) -> Result<Connection, String> {
        let connection = Connection::open(&self.db_path).map_err(|error| error.to_string())?;
        connection
            .pragma_update(None, "journal_mode", "WAL")
            .map_err(|error| error.to_string())?;
        connection
            .busy_timeout(std::time::Duration::from_secs(3))
            .map_err(|error| error.to_string())?;
        Ok(connection)
    }

    fn init_schema(&self) -> Result<(), String> {
        let connection = self.open_connection()?;
        connection
            .execute_batch(
                r#"
                CREATE TABLE IF NOT EXISTS kv_store (
                    store_name TEXT NOT NULL,
                    item_key TEXT NOT NULL,
                    encrypted_value TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    PRIMARY KEY(store_name, item_key)
                );
                CREATE INDEX IF NOT EXISTS idx_kv_store_name ON kv_store(store_name);
                "#,
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    }

    pub fn set_value<T: Serialize>(&self, store: &str, key: &str, value: &T) -> Result<(), String> {
        let payload = serde_json::to_string(value).map_err(|error| error.to_string())?;
        let encrypted = self.encrypt(&payload)?;
        let connection = self.open_connection()?;
        connection
            .execute(
                r#"
                INSERT INTO kv_store (store_name, item_key, encrypted_value, updated_at)
                VALUES (?1, ?2, ?3, ?4)
                ON CONFLICT(store_name, item_key) DO UPDATE SET
                  encrypted_value = excluded.encrypted_value,
                  updated_at = excluded.updated_at
                "#,
                params![store, key, encrypted, timestamp_now()],
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    }

    pub fn get_value<T: DeserializeOwned>(&self, store: &str, key: &str) -> Result<Option<T>, String> {
        let connection = self.open_connection()?;
        let encrypted = connection
            .query_row(
                "SELECT encrypted_value FROM kv_store WHERE store_name = ?1 AND item_key = ?2",
                params![store, key],
                |row| row.get::<_, String>(0),
            )
            .optional()
            .map_err(|error| error.to_string())?;

        match encrypted {
            Some(value) => {
                let decrypted = self.decrypt(&value)?;
                let parsed = serde_json::from_str(&decrypted).map_err(|error| error.to_string())?;
                Ok(Some(parsed))
            }
            None => Ok(None),
        }
    }

    pub fn delete_value(&self, store: &str, key: &str) -> Result<(), String> {
        let connection = self.open_connection()?;
        connection
            .execute(
                "DELETE FROM kv_store WHERE store_name = ?1 AND item_key = ?2",
                params![store, key],
            )
            .map_err(|error| error.to_string())?;
        Ok(())
    }

    pub fn clear_store(&self, store: &str) -> Result<(), String> {
        let connection = self.open_connection()?;
        connection
            .execute("DELETE FROM kv_store WHERE store_name = ?1", params![store])
            .map_err(|error| error.to_string())?;
        Ok(())
    }

    pub fn list_values(&self, store: &str) -> Result<Vec<StoredRecord>, String> {
        let connection = self.open_connection()?;
        let mut statement = connection
            .prepare(
                "SELECT item_key, encrypted_value FROM kv_store WHERE store_name = ?1 ORDER BY updated_at ASC",
            )
            .map_err(|error| error.to_string())?;

        let rows = statement
            .query_map(params![store], |row| {
                let key: String = row.get(0)?;
                let encrypted: String = row.get(1)?;
                Ok((key, encrypted))
            })
            .map_err(|error| error.to_string())?;

        let mut results = Vec::new();
        for row in rows {
            let (key, encrypted) = row.map_err(|error| error.to_string())?;
            let decrypted = self.decrypt(&encrypted)?;
            let value = serde_json::from_str::<Value>(&decrypted).map_err(|error| error.to_string())?;
            results.push(StoredRecord { key, value });
        }

        Ok(results)
    }

    fn encrypt(&self, plaintext: &str) -> Result<String, String> {
        let cipher = Aes256Gcm::new_from_slice(&self.key).map_err(|error| error.to_string())?;
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let ciphertext = cipher
            .encrypt(&nonce, plaintext.as_bytes())
            .map_err(|error| error.to_string())?;

        let mut combined = nonce.to_vec();
        combined.extend(ciphertext);
        Ok(format!("v1:{}", STANDARD.encode(combined)))
    }

    fn decrypt(&self, value: &str) -> Result<String, String> {
        let payload = value
            .strip_prefix("v1:")
            .ok_or_else(|| "Unsupported encrypted payload version.".to_string())?;
        let decoded = STANDARD.decode(payload).map_err(|error| error.to_string())?;
        if decoded.len() < 12 {
            return Err("Encrypted payload is too short.".to_string());
        }

        let (nonce_bytes, ciphertext) = decoded.split_at(12);
        let cipher = Aes256Gcm::new_from_slice(&self.key).map_err(|error| error.to_string())?;
        let nonce = Nonce::from_slice(nonce_bytes);
        let plaintext = cipher.decrypt(nonce, ciphertext).map_err(|error| error.to_string())?;
        String::from_utf8(plaintext).map_err(|error| error.to_string())
    }
}

fn timestamp_now() -> String {
    chrono_like_now()
}

fn chrono_like_now() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|duration| duration.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string());
    now
}
