import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import type { Loan } from './loans.types';

const COL = 'loans';

export const loansCol = collection(db, COL);

function loanDocRef(loanId: string) {
  return doc(db, COL, loanId);
}

// Firestore doesn't accept `undefined` field values — strip them via JSON round-trip
function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export async function persistLoan(loan: Loan): Promise<void> {
  await setDoc(loanDocRef(loan.id), clean(loan));
}

export async function removeLoan(loanId: string): Promise<void> {
  await deleteDoc(loanDocRef(loanId));
}

export async function patchLoan(loanId: string, patch: Partial<Loan>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(loanDocRef(loanId), clean(patch) as any);
}

export async function patchInstallments(
  loanId: string,
  installments: Loan['installments'],
): Promise<void> {
  await updateDoc(loanDocRef(loanId), { installments: clean(installments) });
}

