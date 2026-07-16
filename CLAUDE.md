# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Links

- **Repository**: https://github.com/arturguimaraes/emprest-simples
- **Live app**: https://arturguimaraes.github.io/emprest-simples/

## About

**Emprest Simples** is a Brazilian Portuguese, offline-first web app for tracking personal loans (financiamentos/empréstimos). It runs entirely in the browser — there is no backend.

## Commands

```bash
npm run dev       # Dev server at http://localhost:5173
npm run build     # Production build → dist/
npm run lint      # ESLint
npm run preview   # Serve production build locally
```

No test runner is configured.

## Architecture

**Stack**: React 19, TypeScript, Tailwind CSS v4, Vite, React Router v7.

**State & persistence**: A single React Context + `useReducer` (`loans.context.tsx`) manages all loan state. On every state change, the entire loans array is serialized to `localStorage` under key `emprest-simples:v1`. State is loaded from storage on initial render via the reducer initializer. The context is provided at the root in `main.tsx`.

**Routing**: Uses `HashRouter` — this is intentional for GitHub Pages static hosting. Routes: `/` → `LoansListPage`, `/novo` → `NewLoanPage`, `/emprestimo/:loanId` → `LoanDetailsPage`.

**Money handling**: All monetary amounts are stored and computed as **integer cents** (`number` in TypeScript). Use `toCents` / `fromCents` / `formatMoney` from `loans.utils.ts` when converting. Never store or pass floats as domain money values.

**Feature layout** (`src/features/loans/`):

| File | Responsibility |
|---|---|
| `loans.types.ts` | `Loan` and `Installment` types |
| `loans.context.tsx` | Context, reducer, `useLoans` hook |
| `loans.storage.ts` | `loadLoans` / `saveLoans` (LocalStorage) |
| `loans.selectors.ts` | `calcLoanSummary` — derives financial summary from a loan |
| `loans.utils.ts` | `createInstallments`, `cryptoId`, date helpers, money formatters |
| `loans.backup.ts` | Export (download JSON), import (parse + normalize + merge by ID) |

**Shared UI** (`src/shared/ui/`): Generic `Button`, `Input`, `Card`/`CardHeader`/`CardContent`, and `Footer` components used across pages.

**Build-time constants** injected via Vite `define` and usable as globals: `__APP_VERSION__`, `__COMMIT_SHA__`, `__BUILD_DATE__`.

## Keeping documentation current

Update this file whenever a change would affect how a future Claude instance understands the project:

- New npm scripts or changes to existing ones
- New features, pages, or major modules added to `src/`
- Changes to the state management pattern or storage schema
- New shared UI components added to `src/shared/ui/`
- Changes to routing or deployment behaviour

For large or self-contained features, create a `CLAUDE.md` inside the feature folder (e.g. `src/features/loans/CLAUDE.md`) instead of expanding this file. Link to it from here with a line like `- [src/features/loans/CLAUDE.md](src/features/loans/CLAUDE.md) — loan state, backup/import logic`.

Only document things that are non-obvious or require reading multiple files to understand. Skip things derivable from reading the code directly.

## Deployment

Pushing to `main` triggers the GitHub Actions workflow (`.github/workflows/deploy.yml`), which automatically bumps the npm patch version (committing with `[skip ci]` to avoid loops), builds, and deploys to GitHub Pages.
