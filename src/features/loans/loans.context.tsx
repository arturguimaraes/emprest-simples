import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import type { EntityId, Loan } from './loans.types';
import { loadLoans, saveLoans } from './loans.storage';

type State = {
  loans: Loan[];
};

type Action =
  | { type: 'ADD_LOAN'; payload: Loan }
  | { type: 'DELETE_LOAN'; payload: { loanId: EntityId } }
  | { type: 'UPDATE_LOAN'; payload: { loanId: EntityId; patch: Partial<Loan> } }
  | {
      type: 'UPDATE_INSTALLMENT';
      payload: {
        loanId: EntityId;
        installmentId: EntityId;
        patch: Partial<Loan['installments'][number]>;
      };
    };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD_LOAN': {
      return { loans: [action.payload, ...state.loans] };
    }

    case 'DELETE_LOAN': {
      const { loanId } = action.payload;
      return { loans: state.loans.filter((l) => l.id !== loanId) };
    }

    case 'UPDATE_LOAN': {
      const { loanId, patch } = action.payload;
      return {
        loans: state.loans.map((l) => (l.id === loanId ? { ...l, ...patch } : l)),
      };
    }

    case 'UPDATE_INSTALLMENT': {
      const { loanId, installmentId, patch } = action.payload;
      return {
        loans: state.loans.map((l) => {
          if (l.id !== loanId) return l;
          return {
            ...l,
            installments: l.installments.map((it) =>
              it.id === installmentId ? { ...it, ...patch } : it,
            ),
          };
        }),
      };
    }

    default:
      return state;
  }
}

type LoansContextValue = {
  loans: Loan[];

  addLoan: (loan: Loan) => void;
  deleteLoan: (loanId: EntityId) => void;
  updateLoan: (loanId: EntityId, patch: Partial<Loan>) => void;
  updateInstallment: (
    loanId: EntityId,
    installmentId: EntityId,
    patch: Partial<Loan['installments'][number]>,
  ) => void;
};

const LoansContext = createContext<LoansContextValue | null>(null);

export function LoansProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    loans: loadLoans(),
  }));

  useEffect(() => {
    saveLoans(state.loans);
  }, [state.loans]);

  const value = useMemo<LoansContextValue>(() => {
    return {
      loans: state.loans,

      addLoan: (loan) => dispatch({ type: 'ADD_LOAN', payload: loan }),
      deleteLoan: (loanId) => dispatch({ type: 'DELETE_LOAN', payload: { loanId } }),
      updateLoan: (loanId, patch) => dispatch({ type: 'UPDATE_LOAN', payload: { loanId, patch } }),
      updateInstallment: (loanId, installmentId, patch) =>
        dispatch({
          type: 'UPDATE_INSTALLMENT',
          payload: { loanId, installmentId, patch },
        }),
    };
  }, [state.loans]);

  return <LoansContext.Provider value={value}>{children}</LoansContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLoans() {
  const ctx = useContext(LoansContext);
  if (!ctx) throw new Error('useLoans deve ser usado dentro de LoansProvider');
  return ctx;
}
