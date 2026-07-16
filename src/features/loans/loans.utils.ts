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

  // split into cents with remainder absorbed by the last installment
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

/**
 * Solves for the monthly interest rate given PV (present value), PMT (payment),
 * and n (number of periods) using the bisection method on the Price annuity formula.
 * Returns the rate as a fraction (e.g. 0.015 for 1.5% p.m.), or null if not solvable.
 */
export function solveMonthlyRate(pv: number, pmt: number, n: number): number | null {
  if (pv <= 0 || pmt <= 0 || n <= 0) return null;
  if (pmt * n <= pv) return null; // total payments ≤ principal — no positive rate exists

  // f(r) = pmt * (1 - (1+r)^-n) / r — decreasing from pmt*n (at r→0) toward 0 (at r→∞)
  // We want f(r) = pv, so bisect between lo and hi
  let lo = 1e-10;
  let hi = 10; // 1000% monthly is an absurd upper bound

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const val = pmt * (1 - Math.pow(1 + mid, -n)) / mid;
    if (val > pv) lo = mid;
    else hi = mid;
  }

  const rate = (lo + hi) / 2;
  return rate > 0 ? rate : null;
}

/** Converts a monthly rate (fraction) to CET annual percentage. */
export function cetFromMonthlyRate(monthlyRate: number): number {
  return (Math.pow(1 + monthlyRate, 12) - 1) * 100;
}

export function cryptoId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // fallback
  return `id_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}
