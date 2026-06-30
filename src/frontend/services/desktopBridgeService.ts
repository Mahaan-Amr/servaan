type DesktopInvoke = <T>(command: string, args?: Record<string, unknown>) => Promise<T>;

declare global {
  interface Window {
    __TAURI__?: {
      core?: {
        invoke?: DesktopInvoke;
      };
      invoke?: DesktopInvoke;
    };
    __TAURI_INTERNALS__?: unknown;
  }
}

const SECRET_PREFIX = 'servaan:';

function getGlobalTauriInvoke(): DesktopInvoke | null {
  if (typeof window === 'undefined') return null;

  return window.__TAURI__?.core?.invoke || window.__TAURI__?.invoke || null;
}

async function getImportedTauriInvoke(): Promise<DesktopInvoke | null> {
  try {
    const api = await import('@tauri-apps/api/core');
    return api.invoke as DesktopInvoke;
  } catch {
    return null;
  }
}

async function getDesktopInvoke(): Promise<DesktopInvoke | null> {
  return getGlobalTauriInvoke() || getImportedTauriInvoke();
}

export function isDesktopApp(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
}

export async function invokeDesktopCommand<T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> {
  const invoke = await getDesktopInvoke();
  if (!invoke) return null;
  return invoke<T>(command, args);
}

export async function listenDesktopEvent<T>(
  eventName: string,
  handler: (payload: T) => void
): Promise<(() => void) | null> {
  if (!isDesktopApp()) return null;

  try {
    const { listen } = await import('@tauri-apps/api/event');
    return listen<T>(eventName, (event) => {
      handler(event.payload);
    });
  } catch {
    return null;
  }
}

export async function getDesktopAppVersion(): Promise<string | null> {
  return invokeDesktopCommand<string>('get_app_version');
}

export async function storeDesktopSecret(key: string, value: string): Promise<boolean> {
  if (!isDesktopApp()) return false;
  await invokeDesktopCommand<void>('store_secret', {
    key: `${SECRET_PREFIX}${key}`,
    value
  });
  return true;
}

export async function getDesktopSecret(key: string): Promise<string | null> {
  if (!isDesktopApp()) return null;
  return invokeDesktopCommand<string | null>('get_secret', {
    key: `${SECRET_PREFIX}${key}`
  });
}

export async function deleteDesktopSecret(key: string): Promise<boolean> {
  if (!isDesktopApp()) return false;
  await invokeDesktopCommand<void>('delete_secret', {
    key: `${SECRET_PREFIX}${key}`
  });
  return true;
}

export async function printDesktopReceiptText(
  receiptText: string,
  printerName?: string
): Promise<boolean> {
  if (!isDesktopApp()) return false;
  await invokeDesktopCommand<void>('print_receipt_text', {
    receiptText,
    printerName: printerName || null
  });
  return true;
}

export interface DesktopStoredRecord<T = unknown> {
  key: string;
  value: T;
}

export async function setDesktopStoreValue<T>(store: string, key: string, value: T): Promise<boolean> {
  if (!isDesktopApp()) return false;
  await invokeDesktopCommand<void>('sqlite_set_value', {
    store,
    key,
    value: sanitizeForDesktopInvoke(value)
  });
  return true;
}

export async function getDesktopStoreValue<T>(store: string, key: string): Promise<T | null> {
  if (!isDesktopApp()) return null;
  return invokeDesktopCommand<T | null>('sqlite_get_value', {
    store,
    key
  });
}

export async function listDesktopStoreValues<T>(store: string): Promise<DesktopStoredRecord<T>[]> {
  if (!isDesktopApp()) return [];
  return (await invokeDesktopCommand<DesktopStoredRecord<T>[]>('sqlite_list_values', {
    store
  })) || [];
}

export async function deleteDesktopStoreValue(store: string, key: string): Promise<boolean> {
  if (!isDesktopApp()) return false;
  await invokeDesktopCommand<void>('sqlite_delete_value', {
    store,
    key
  });
  return true;
}

export async function clearDesktopStore(store: string): Promise<boolean> {
  if (!isDesktopApp()) return false;
  await invokeDesktopCommand<void>('sqlite_clear_store', {
    store
  });
  return true;
}

export function sanitizeForDesktopInvoke<T>(value: T): T {
  if (value === undefined) return null as T;
  if (value === null) return value;
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForDesktopInvoke(item)) as T;
  }

  if (typeof value === 'object') {
    const output: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
      if (item !== undefined) {
        output[key] = sanitizeForDesktopInvoke(item);
      }
    });
    return output as T;
  }

  return value;
}
