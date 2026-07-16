# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Links

- **Repository**: https://github.com/arturguimaraes/emprest-simples
- **Live app**: https://arturguimaraes.github.io/emprest-simples/

## About

**Emprest Simples** is a Brazilian Portuguese web app for tracking personal loans (financiamentos/empréstimos). Data is persisted in **Firebase Firestore** — no backend, no localStorage.

## Commands

```bash
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run lint      # ESLint
npm run preview   # Serve production build locally
```

No test runner is configured.

## Architecture

**Stack**: React 19, TypeScript, Tailwind CSS v4, Vite, React Router v7, Firebase Firestore.

**State & persistence**: A single React Context (`loans.context.tsx`) drives all state. It subscribes to the Firestore `loans` collection via `onSnapshot` on mount — state is always a live mirror of Firestore. Write operations (add, update, delete) go directly to Firestore; the `onSnapshot` callback updates React state in response. The context is provided at the root in `main.tsx`.

**Firestore structure**: One collection `loans`, one document per loan (document ID = `loan.id`). Installments are stored as an embedded array inside the loan document. No subcollections.

**Routing**: Uses `HashRouter` — intentional for static hosting. Routes: `/` → `LoansListPage`, `/novo` → `NewLoanPage`, `/loan/:loanId` → `LoanDetailsPage`.

**Money handling**: All monetary amounts are stored and computed as **integer cents** (`number` in TypeScript). Use `toCents` / `fromCents` / `formatMoney` from `loans.utils.ts`. Never store or pass floats as domain money values.

**Feature layout** (`src/features/loans/`):

| File | Responsibility |
|---|---|
| `loans.types.ts` | `Loan` and `Installment` TypeScript types |
| `loans.context.tsx` | Context, `useLoans` hook, Firestore subscription |
| `loans.storage.ts` | Firestore CRUD helpers (`persistLoan`, `removeLoan`, `patchLoan`, `patchInstallments`) |
| `loans.selectors.ts` | `calcLoanSummary` — derives financial summary from a loan |
| `loans.utils.ts` | `createInstallments`, `cryptoId`, date helpers, money formatters |

See [src/features/loans/CLAUDE.md](src/features/loans/CLAUDE.md) for the loan data model and business logic.

**Shared UI** (`src/shared/ui/`): `Button`, `Input` (supports `required` → bold label + red asterisk, `computed` → read-only grey style), `Card`/`CardHeader`/`CardContent`, `Footer`.

## Keeping documentation current

Update this file whenever a change would affect how a future Claude instance understands the project:

- New npm scripts or changes to existing ones
- New features, pages, or major modules added to `src/`
- Changes to the state management pattern or Firestore schema
- New shared UI components added to `src/shared/ui/`
- Changes to routing or deployment behaviour

Only document things that are non-obvious or require reading multiple files to understand.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`), which automatically bumps the npm patch version (committing with `[skip ci]` to avoid loops), builds, and deploys to GitHub Pages.
