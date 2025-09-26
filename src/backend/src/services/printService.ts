import net from 'net';
import { AppError } from '../utils/AppError';

export type PrinterProtocol = 'RAW9100' | 'IPP' | 'LPR';

export interface PrinterConfig {
  protocol: PrinterProtocol;
  host: string;
  port?: number; // default 9100 for RAW
  queue?: string; // for LPR
  widthChars?: number; // optional formatting hint
  codepage?: string; // optional codepage
}

export class PrintService {
  /**
   * Send raw ESC/POS or plain text over TCP (port 9100)
   */
  static async printRaw9100(payload: Buffer | string, config: PrinterConfig): Promise<void> {
    const host = config.host;
    const port = config.port ?? 9100;

    await new Promise<void>((resolve, reject) => {
      const socket = new net.Socket();
      socket.setTimeout(10000);
      socket.on('error', (err) => {
        socket.destroy();
        reject(new AppError(`RAW9100 print error: ${err.message}`, 500, err));
      });
      socket.on('timeout', () => {
        socket.destroy();
        reject(new AppError('RAW9100 print timeout', 504));
      });
      socket.connect(port, host, () => {
        const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, 'utf8');
        socket.write(data, (err) => {
          if (err) {
            socket.destroy();
            reject(new AppError(`RAW9100 write failed: ${err.message}`, 500, err));
            return;
          }
          // Send cut command (ESC/POS) softly; printer may ignore if unsupported
          try {
            socket.write(Buffer.from([0x1d, 0x56, 0x41, 0x10]));
          } catch (_) {
            // ignore
          }
          socket.end();
        });
      });
      socket.on('close', () => resolve());
    });
  }

  /**
   * Placeholder for IPP/LPR support. Implementing here later if needed.
   */
  static async printViaProtocol(payload: Buffer | string, config: PrinterConfig): Promise<void> {
    if (config.protocol === 'RAW9100') {
      return this.printRaw9100(payload, config);
    }
    // Future: implement IPP and LPR transports
    throw new AppError(`Protocol ${config.protocol} not yet supported`, 400);
  }
}

export function formatPlainReceipt(lines: string[], width = 42): string {
  // Ensure each line fits the width
  const normalized = lines.flatMap((line) => wrapLine(line, width));
  return normalized.join('\n') + '\n';
}

function wrapLine(text: string, width: number): string[] {
  if (!text) return [''];
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    chunks.push(text.slice(start, start + width));
    start += width;
  }
  return chunks;
}


