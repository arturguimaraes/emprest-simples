# Loans Feature

## Data Model

### `Loan`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID, also used as Firestore document ID |
| `name` | `string` | User-defined label |
| `principalAmountCents` | `number` | Full amount borrowed (in cents) |
| `downPaymentAmountCents` | `number?` | Optional down payment paid upfront (in cents) |
| `totalToPayCents` | `number` | Total paid **through installments** — does NOT include `downPaymentAmountCents` |
| `installmentsCount` | `number` | Number of monthly installments |
| `firstDueDate` | `string` | `yyyy-mm-dd`, due date of installment #1 |
| `interestRateMonthlyPct` | `number?` | Monthly interest rate % (informational only) |
| `cetAnnualPct` | `number?` | Annual CET % (informational only) |
| `createdAt` | `string` | ISO datetime |
| `updatedAt` | `string` | ISO datetime |
| `installments` | `Installment[]` | Generated on creation, stored embedded in the document |

### `Installment`

| Field | Type | Description |
|---|---|---|
| `id` | `string` | UUID |
| `number` | `number` | 1-based sequence |
| `dueDate` | `string` | `yyyy-mm-dd` — monthly from `firstDueDate` |
| `expectedAmountCents` | `number` | Amount expected for this installment |
| `paid` | `boolean` | Whether the installment was paid |
| `paidAmountCents` | `number?` | Actual amount paid (set when `paid = true`) |
| `paidDate` | `string?` | `yyyy-mm-dd` — date payment was made |

### Key relationships

```
total cost to borrower = downPaymentAmountCents + totalToPayCents
totalToPayCents        = sum(installment.expectedAmountCents)   ← enforced on creation
installment.dueDate    = firstDueDate + (number - 1) months
```

Installments are generated once on creation by `createInstallments()` in `loans.utils.ts`. The last installment absorbs any rounding remainder so the sum matches `totalToPayCents` exactly.

## Loan Creation — Calc Modes

The new loan form (`NewLoanPage.tsx`) has three modes for deriving the installment breakdown. The user picks one; the other fields are auto-computed (shown as read-only with a "(calculado)" label):

| Mode | User enters | Auto-computed |
|---|---|---|
| **`perInstallment`** — "Valor por parcela" | `installmentsCount` + `installmentAmount` | `totalToPayCents = count × amount` |
| **`byPrincipal`** — "Valor emprestado" | `principal` + `downPayment` + `installmentsCount` | `totalToPayCents = principal − downPayment`; `installmentAmount = totalToPayCents / count` |
| **`total`** — "Total a pagar" | `installmentsCount` + `totalToPay` | `installmentAmount = totalToPay / count` |

Mode `byPrincipal` assumes no extra interest — the full financed amount (`principal − downPayment`) is split equally. For interest-bearing loans the user should use mode `byTotal` or `perInstallment` to enter the real amounts.

`interestRateMonthlyPct` and `cetAnnualPct` are always optional and informational — they are stored but not used in any computation.

## Firestore Schema

Collection: `loans`
Document ID: `loan.id`
Fields: all `Loan` fields flat; `installments` is an embedded array.

Firestore does not accept `undefined` values — the storage layer (`loans.storage.ts`) strips them via `JSON.parse(JSON.stringify(...))` before every write.

## Context Actions

All actions in `useLoans()` are async (return `Promise<void>`):

| Action | Firestore op |
|---|---|
| `addLoan(loan)` | `setDoc` |
| `deleteLoan(loanId)` | `deleteDoc` |
| `updateLoan(loanId, patch)` | `updateDoc` with flat patch |
| `updateInstallment(loanId, installmentId, patch)` | reads current installments from context state, merges, then `updateDoc({ installments })` |

Mutations can be called fire-and-forget — Firestore's local cache reflects the change immediately (before server confirmation), so UI stays responsive.
