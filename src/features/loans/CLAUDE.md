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

## Loan Creation — Form Logic

The new loan form (`NewLoanPage.tsx`) has no mode selector. All fields are always visible.

### Required fields (user must fill)

| Field | State var | Notes |
|---|---|---|
| Nome | `name` | Free text |
| 1º vencimento | `firstDueDate` | Date picker, defaults to today |
| Valor emprestado | `principal` | Full loan principal (R$) |
| Entrada | `downPayment` | Down payment; default 0, but required (blocks submit if `financed ≤ 0`) |
| Quantidade de parcelas | `installmentsCount` | Integer ≥ 1 |

`financed = max(0, principal − downPayment)` — the amount actually financed.

### Interdependent pair — last edited wins

One of the two fields below drives computation of the other. The state var `primaryField: 'installmentAmount' | 'interestRate'` tracks which was last edited.

| Field | When primary | When secondary |
|---|---|---|
| Valor por parcela (R$) | User-typed raw value | Price formula: `PMT = PV·i / (1−(1+i)^−n)` |
| Juros (a.m.) % | User-typed raw value | Bisection solver on Price formula (`solveMonthlyRate`) |

Display rule: primary field shows the raw number the user typed; secondary field shows the computed value formatted to 2 decimal places (or blank when undetermined).

### Always auto-computed (read-only, `computed` prop)

| Field | Formula |
|---|---|
| Total a pagar (R$) | `downPayment + installmentsCount × installmentAmount` |
| CET (a.a.) % | `((1 + monthlyRate)^12 − 1) × 100` via `cetFromMonthlyRate()` |

`totalToPayCents` **stored on the loan** = installments total only (excludes down payment). Down payment is stored separately in `downPaymentAmountCents`.

### Submit guard (`canSubmit`)

```
name non-empty AND principal > 0 AND financed > 0 AND
installmentsCount > 0 AND firstDueDate valid AND resolved.installment > 0
```

`interestRateMonthlyPct` and `cetAnnualPct` are always optional and informational — they are stored but not used in any post-creation computation.

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
