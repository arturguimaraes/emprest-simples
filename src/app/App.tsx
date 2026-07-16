import { HashRouter, Routes, Route } from 'react-router-dom';
import { LoansListPage } from '../features/loans/pages/LoansListPage';
import { NewLoanPage } from '../features/loans/pages/NewLoanPage';
import { LoanDetailsPage } from '../features/loans/pages/LoanDetailsPage';
import { Footer } from '../shared/ui/Footer';

export function App() {
  return (
    <HashRouter>
      <div className='flex min-h-screen flex-col'>
        <Routes>
          <Route path='/' element={<LoansListPage />} />
          <Route path='/novo' element={<NewLoanPage />} />
          <Route path='/loan/:loanId' element={<LoanDetailsPage />} />
        </Routes>
        <Footer />
      </div>
    </HashRouter>
  );
}
