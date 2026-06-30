import {
  getDesktopStoreValue,
  isDesktopApp,
  setDesktopStoreValue
} from './desktopBridgeService';

const STORE = 'local_read_models';
export const LOCAL_READ_MODEL_REFRESHED = 'servaan:local-read-model-refreshed';

export type LocalReadModelKey =
  | 'inventory.current'
  | 'inventory.entries'
  | 'inventory.lowStock'
  | 'inventory.stats'
  | 'inventory.totalQuantity'
  | 'inventory.items'
  | 'inventory.suppliers'
  | 'inventory.settings'
  | 'sales.menu'
  | 'sales.tables'
  | 'sales.settings';

export interface LocalReadModel<T> {
  key: LocalReadModelKey;
  value: T;
  updatedAt: string;
}

export interface LocalReadModelMeta {
  key: LocalReadModelKey;
  updatedAt: string;
}

export interface ReadLocalFirstOptions {
  refresh?: boolean;
}

export function canUseDesktopReadModels(): boolean {
  return isDesktopApp();
}

export async function getLocalReadModel<T>(key: LocalReadModelKey): Promise<LocalReadModel<T> | null> {
  if (!canUseDesktopReadModels()) return null;
  return getDesktopStoreValue<LocalReadModel<T>>(STORE, key);
}

export async function getLocalReadModelMeta(key: LocalReadModelKey): Promise<LocalReadModelMeta | null> {
  const model = await getLocalReadModel<unknown>(key);
  if (!model) return null;
  return { key: model.key, updatedAt: model.updatedAt };
}

export async function hasLocalReadModel(key: LocalReadModelKey): Promise<boolean> {
  return Boolean(await getLocalReadModel<unknown>(key));
}

export async function setLocalReadModel<T>(key: LocalReadModelKey, value: T): Promise<void> {
  if (!canUseDesktopReadModels()) return;
  const existing = await getLocalReadModel<T>(key);
  const changed = JSON.stringify(existing?.value ?? null) !== JSON.stringify(value);

  await setDesktopStoreValue(STORE, key, {
    key,
    value,
    updatedAt: new Date().toISOString()
  });

  if (changed && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCAL_READ_MODEL_REFRESHED, { detail: { key } }));
  }
}

export async function readLocalFirst<T>(
  key: LocalReadModelKey,
  fetchFresh: () => Promise<T>,
  options: ReadLocalFirstOptions = {}
): Promise<T> {
  if (!canUseDesktopReadModels()) {
    return fetchFresh();
  }

  const cached = await getLocalReadModel<T>(key);
  if (cached) {
    if (options.refresh !== false) {
      fetchFresh()
        .then((fresh) => setLocalReadModel(key, fresh))
        .catch((error) => {
          console.warn(`Local read model refresh failed for ${key}:`, error);
        });
    }
    return cached.value;
  }

  const fresh = await fetchFresh();
  await setLocalReadModel(key, fresh);
  return fresh;
}
