import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../features/auth/auth.context';
import { LoansProvider } from '../features/loans/loans.context';
import { LoansListPage } from '../features/loans/pages/LoansListPage';
import { NewLoanPage } from '../features/loans/pages/NewLoanPage';
import { LoanDetailsPage } from '../features/loans/pages/LoanDetailsPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { Footer } from '../shared/ui/Footer';

function AuthenticatedApp({ uid }: { uid: string }) {
  const { user, signOut } = useAuth();

  return (
    <LoansProvider uid={uid}>
      <div className='flex min-h-screen flex-col'>
        <div className='flex justify-end px-6 pt-3'>
          <button
            onClick={signOut}
            className='flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors'
            title='Sair'
          >
            {user?.email}
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>
        <Routes>
          <Route path='/' element={<LoansListPage />} />
          <Route path='/novo' element={<NewLoanPage />} />
          <Route path='/loan/:loanId' element={<LoanDetailsPage />} />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
        <Footer />
      </div>
    </LoansProvider>
  );
}

export function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center text-slate-400'>
        Carregando...
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route
          path='/login'
          element={user ? <Navigate to='/' replace /> : <LoginPage />}
        />
        <Route
          path='*'
          element={user ? <AuthenticatedApp uid={user.uid} /> : <Navigate to='/login' replace />}
        />
      </Routes>
    </HashRouter>
  );
}
