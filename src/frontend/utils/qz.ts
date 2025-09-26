/* QZ Tray helper (best-effort).
 * Loads qz-tray script and prints an image silently if QZ Tray is installed and trusted.
 */

type QZTray = {
  websocket: { isActive: () => boolean; connect: () => Promise<void> };
  printers: { find: () => Promise<string[]> };
  configs: { create: (printer: string | null, opts?: Record<string, unknown>) => unknown };
  print: (config: unknown, data: Array<{ type: string; data: string }>) => Promise<void>;
  security?: {
    setCertificatePromise: (fn: () => Promise<string>) => void;
    setSignaturePromise: (fn: (toSign: string) => Promise<string>) => void;
  };
};

declare global {
  interface Window {
    qz?: QZTray;
  }
}

const QZ_CDN = 'https://cdn.jsdelivr.net/npm/qz-tray@2.2.5/qz-tray.js';

export async function ensureQzLoaded(): Promise<QZTray | null> {
  if (typeof window === 'undefined') return null;
  if (window.qz) return window.qz;

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = QZ_CDN;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load qz-tray script'));
    document.head.appendChild(script);
  });

  return window.qz || null;
}

export async function connectQz(): Promise<boolean> {
  const qz = await ensureQzLoaded();
  if (!qz) return false;

  // Minimal unsecured promise for dev. For production, we should use a real certificate/signing.
  if (qz.security) {
    qz.security.setCertificatePromise(() => Promise.resolve('-----BEGIN CERTIFICATE-----\nMIIC...DEV...CERT...\n-----END CERTIFICATE-----'));
    qz.security.setSignaturePromise((toSign: string) => {
      // In secure setups, sign on server. For now return toSign to allow prompts in dev.
      return Promise.resolve(toSign);
    });
  }

  if (!qz.websocket.isActive()) {
    try {
      await qz.websocket.connect();
    } catch {
      return false;
    }
  }
  return true;
}

export function configureQzSecurity(options: {
  getCertificate: () => Promise<string>;
  sign: (toSign: string) => Promise<string>;
}): void {
  if (typeof window === 'undefined' || !window.qz) return;
  const qz = window.qz;
  if (!qz.security) return;
  qz.security.setCertificatePromise(options.getCertificate);
  qz.security.setSignaturePromise(options.sign);
}

export async function listPrinters(): Promise<string[]> {
  const qz = await ensureQzLoaded();
  if (!qz) return [];
  if (!qz.websocket.isActive()) {
    const ok = await connectQz();
    if (!ok) return [];
  }
  try {
    const printers = await qz.printers.find();
    return Array.isArray(printers) ? printers : [];
  } catch {
    return [];
  }
}

export async function printImageDataUrl(dataUrl: string, printerName?: string): Promise<boolean> {
  const qz = await ensureQzLoaded();
  if (!qz) return false;
  if (!qz.websocket.isActive()) {
    const ok = await connectQz();
    if (!ok) return false;
  }
  try {
    const cfg = qz.configs.create(printerName || null, { scaleContent: true });
    const data = [{ type: 'image', data: dataUrl }];
    await qz.print(cfg, data);
    return true;
  } catch {
    return false;
  }
}


