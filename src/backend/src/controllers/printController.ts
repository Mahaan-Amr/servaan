import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { PrintService, formatPlainReceipt, PrinterConfig } from '../services/printService';
import { prisma } from '../services/dbService';

export class PrintController {
  /**
   * POST /api/ordering/print/receipt
   * Body: { orderId: string, printer: { protocol: 'RAW9100', host: string, port?: number, widthChars?: number } }
   */
  static async printReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const tenantId = req.user?.tenantId;
      if (!tenantId) throw new AppError('Authentication required', 401);

      const { orderId, printer } = req.body as { orderId?: string; printer?: Partial<PrinterConfig> };
      if (!orderId) throw new AppError('orderId is required', 400);
      if (!printer?.protocol || !printer?.host) throw new AppError('printer protocol and host required', 400);

      const order = await prisma.order.findFirst({
        where: { id: orderId, tenantId },
        include: {
          items: { include: { item: true, menuItem: true } },
          table: true,
          customer: true,
        },
      });

      if (!order) throw new AppError('Order not found', 404);

      // Build a simple plain-text receipt for first version
      const width = printer.widthChars ?? 42;
      const lines: string[] = [];
      lines.push(center('رسید سفارش', width));
      lines.push(center(order.orderNumber || order.id, width));
      lines.push('-'.repeat(width));
      lines.push(`تاریخ: ${new Date(order.orderDate || new Date()).toLocaleString('fa-IR')}`);
      lines.push(`نوع: ${order.orderType}`);
      if (order.table) lines.push(`میز: ${order.table.tableNumber}${order.table.tableName ? ' - ' + order.table.tableName : ''}`);
      lines.push('-'.repeat(width));
      lines.push('عنوان             تعداد    قیمت     جمع');

      for (const oi of order.items) {
        const name = (oi.menuItem?.displayName || oi.item?.name || 'آیتم') as string;
        const qty = oi.quantity;
        const unit = Number(oi.unitPrice || (oi.totalPrice ? Number(oi.totalPrice) / Math.max(qty, 1) : 0));
        const total = Number(oi.totalPrice);
        const row = `${truncate(name, 14).padEnd(16)}${String(qty).padStart(4)}  ${format(unit).padStart(8)}  ${format(total).padStart(8)}`;
        lines.push(row);
      }

      lines.push('-'.repeat(width));
      lines.push(`جمع کل: ${format(Number(order.totalAmount || 0))}`);
      lines.push(center('با تشکر از خرید شما', width));

      const payload = formatPlainReceipt(lines, width);

      const cfg: PrinterConfig = {
        protocol: printer.protocol as any,
        host: printer.host!,
        port: printer.port,
        widthChars: width,
      };

      await PrintService.printViaProtocol(payload, cfg);

      res.json({ success: true, message: 'Receipt sent to printer' });
    } catch (error) {
      next(error);
    }
  }
}

function format(n: number): string {
  return new Intl.NumberFormat('fa-IR').format(Math.round(n));
}

function truncate(s: string, len: number): string {
  return s.length > len ? s.slice(0, len - 1) + '…' : s;
}

function center(text: string, width: number): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return ' '.repeat(pad) + text;
}


