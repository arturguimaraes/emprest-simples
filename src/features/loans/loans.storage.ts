import type { Loan } from './loans.types';

const STORAGE_KEY = 'emprest-simples:v1';

type StorageShapeV1 = {
  version: 1;
  loans: Loan[];
};

export function loadLoans(): Loan[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as StorageShapeV1;

    if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.loans)) {
      return [];
    }

    return parsed.loans;
  } catch {
    return [];
  }
}

export function saveLoans(loans: Loan[]): void {
  const payload: StorageShapeV1 = {
    version: 1,
    loans,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
