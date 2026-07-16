import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { onSnapshot } from 'firebase/firestore';
import type { EntityId, Loan } from './loans.types';
import { loansCol, persistLoan, removeLoan, patchLoan, patchInstallments } from './loans.storage';

type LoansContextValue = {
  loans: Loan[];
  loading: boolean;
  addLoan: (loan: Loan) => Promise<void>;
  deleteLoan: (loanId: EntityId) => Promise<void>;
  updateLoan: (loanId: EntityId, patch: Partial<Loan>) => Promise<void>;
  updateInstallment: (
    loanId: EntityId,
    installmentId: EntityId,
    patch: Partial<Loan['installments'][number]>,
  ) => Promise<void>;
};

const LoansContext = createContext<LoansContextValue | null>(null);

export function LoansProvider({ children }: { children: React.ReactNode }) {
  const [loans, setLoansState] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  // Ref so closures inside useMemo always see the latest loans without re-memoizing
  const loansRef = useRef<Loan[]>([]);
  loansRef.current = loans;

  useEffect(() => {
    const unsub = onSnapshot(loansCol, (snapshot) => {
      const data = snapshot.docs.map((d) => d.data() as Loan);
      data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setLoansState(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<LoansContextValue>(
    () => ({
      loans,
      loading,
      addLoan: (loan) => persistLoan(loan),
      deleteLoan: (loanId) => removeLoan(loanId),
      updateLoan: (loanId, patch) => patchLoan(loanId, patch),
      updateInstallment: (loanId, installmentId, patch) => {
        const loan = loansRef.current.find((l) => l.id === loanId);
        if (!loan) return Promise.resolve();
        const installments = loan.installments.map((it) =>
          it.id === installmentId ? { ...it, ...patch } : it,
        );
        return patchInstallments(loanId, installments);
      },
    }),
    [loans, loading],
  );

  return <LoansContext.Provider value={value}>{children}</LoansContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoans() {
  const ctx = useContext(LoansContext);
  if (!ctx) throw new Error('useLoans deve ser usado dentro de LoansProvider');
  return ctx;
}
