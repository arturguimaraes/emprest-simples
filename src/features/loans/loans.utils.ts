import type { ISODateString, Installment } from './loans.types';

export const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export function toCents(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function fromCents(cents: number): number {
  return (cents ?? 0) / 100;
}

export function formatMoney(cents: number): string {
  return brl.format(fromCents(cents));
}

export function todayISODate(): ISODateString {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function addMonthsISO(dateISO: ISODateString, add: number): ISODateString {
  const [y, m, d] = dateISO.split('-').map(Number);
  const base = new Date(y, m - 1, d);
  base.setMonth(base.getMonth() + add);

  const yyyy = base.getFullYear();
  const mm = String(base.getMonth() + 1).padStart(2, '0');
  const dd = String(base.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function createInstallments(params: {
  installmentsCount: number;
  firstDueDate: ISODateString;
  totalToPayCents: number;
}): Installment[] {
  const { installmentsCount, firstDueDate, totalToPayCents } = params;

  if (installmentsCount <= 0) return [];

  // divisão em centavos com ajuste no último para bater exatamente
  const base = Math.floor(totalToPayCents / installmentsCount);
  const remainder = totalToPayCents - base * installmentsCount;

  return Array.from({ length: installmentsCount }, (_, idx) => {
    const number = idx + 1;
    const expected = number === installmentsCount ? base + remainder : base;

    return {
      id: cryptoId(),
      number,
      dueDate: addMonthsISO(firstDueDate, idx),
      expectedAmountCents: expected,
      paid: false,
    };
  });
}

export function cryptoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // fallback
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
