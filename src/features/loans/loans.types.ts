export type EntityId = string;

export type ISODateString = string; // yyyy-mm-dd

export type Installment = {
  id: EntityId;
  number: number; // 1..N
  dueDate: ISODateString;
  expectedAmountCents: number;

  paid: boolean;
  paidAmountCents?: number;
  paidDate?: ISODateString;
};

export type Loan = {
  id: EntityId;
  name: string;

  principalAmountCents: number; // valor emprestado
  totalToPayCents: number; // total previsto originalmente

  interestRateMonthlyPct?: number; // opcional
  cetAnnualPct?: number; // opcional

  installmentsCount: number;
  firstDueDate: ISODateString;

  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime

  installments: Installment[];
};
