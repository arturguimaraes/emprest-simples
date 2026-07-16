import type { Loan } from './loans.types';

export function calcLoanSummary(loan: Loan) {
  const paidInstallments = loan.installments.filter((i) => i.paid);
  const openInstallments = loan.installments.filter((i) => !i.paid);

  const paidInstallmentsCents = paidInstallments.reduce(
    (acc, i) => acc + (i.paidAmountCents ?? 0),
    0,
  );
  const paidSoFarCents = (loan.downPaymentAmountCents ?? 0) + paidInstallmentsCents;

  const remainingExpectedCents = openInstallments.reduce(
    (acc, i) => acc + i.expectedAmountCents,
    0,
  );

  // Savings are purely on installments — down payment is fixed and excluded from both sides
  const projectedTotalCents = paidInstallmentsCents + remainingExpectedCents;
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
