const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export function createOfflineNumber(sequence: number, scope?: string): string {
  const suffix = toPersianDigits(sequence);
  return scope ? `آفلاین ${scope}-${suffix}` : `آفلاین-${suffix}`;
}

export function createOfflineReceiptNumber(sequence: number): string {
  return `رسید آفلاین-${toPersianDigits(sequence)}`;
}

export function createOfflineInventoryDocumentNumber(sequence: number): string {
  return `سند آفلاین-${toPersianDigits(sequence)}`;
}
