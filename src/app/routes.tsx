import { createBrowserRouter } from 'react-router-dom';
import { LoansListPage } from '../features/loans/pages/LoansListPage';
import { NewLoanPage } from '../features/loans/pages/NewLoanPage';
import { LoanDetailsPage } from '../features/loans/pages/LoanDetailsPage';

export const router = createBrowserRouter([
  { path: '/', element: <LoansListPage /> },
  { path: '/novo', element: <NewLoanPage /> },
  { path: '/emprestimo/:loanId', element: <LoanDetailsPage /> },
]);
