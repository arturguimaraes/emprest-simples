import type { Loan } from './loans.types';

export function calcLoanSummary(loan: Loan) {
  const paidInstallments = loan.installments.filter((i) => i.paid);
  const openInstallments = loan.installments.filter((i) => !i.paid);

  const paidSoFarCents = paidInstallments.reduce((acc, i) => acc + (i.paidAmountCents ?? 0), 0);

  const remainingExpectedCents = openInstallments.reduce(
    (acc, i) => acc + i.expectedAmountCents,
    0,
  );

  const projectedTotalCents = paidSoFarCents + remainingExpectedCents;
  const savingsCents = loan.totalToPayCents - projectedTotalCents;

  return {
    paidInstallmentsCount: paidInstallments.length,
    openInstallmentsCount: openInstallments.length,
    paidSoFarCents,
    remainingExpectedCents,
    projectedTotalCents,
    savingsCents,
  };
}
