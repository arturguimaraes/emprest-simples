import { HashRouter, Routes, Route } from 'react-router-dom';
import { LoansListPage } from '../features/loans/pages/LoansListPage';
import { NewLoanPage } from '../features/loans/pages/NewLoanPage';
import { LoanDetailsPage } from '../features/loans/pages/LoanDetailsPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path='/' element={<LoansListPage />} />
        <Route path='/novo' element={<NewLoanPage />} />
        <Route path='/emprestimo/:loanId' element={<LoanDetailsPage />} />
      </Routes>
    </HashRouter>
  );
}
