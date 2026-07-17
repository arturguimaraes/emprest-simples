import { collection, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import type { Loan } from './loans.types';

function loansPath(uid: string) {
  return `users/${uid}/loans`;
}

export function loansColFor(uid: string) {
  return collection(db, loansPath(uid));
}

function loanDocRef(uid: string, loanId: string) {
  return doc(db, loansPath(uid), loanId);
}

// Firestore doesn't accept `undefined` field values — strip them via JSON round-trip
function clean<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

export async function persistLoan(uid: string, loan: Loan): Promise<void> {
  await setDoc(loanDocRef(uid, loan.id), clean(loan));
}

export async function removeLoan(uid: string, loanId: string): Promise<void> {
  await deleteDoc(loanDocRef(uid, loanId));
}

export async function patchLoan(uid: string, loanId: string, patch: Partial<Loan>): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateDoc(loanDocRef(uid, loanId), clean(patch) as any);
}

export async function patchInstallments(
  uid: string,
  loanId: string,
  installments: Loan['installments'],
): Promise<void> {
  await updateDoc(loanDocRef(uid, loanId), { installments: clean(installments) });
}
