import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useLoans } from '../loans.context';
import { LoanCard } from '../components/LoanCard';
import { Button } from '../../../shared/ui/Button';
export function LoansListPage() {
  const { loans, loading } = useLoans();

  return (
    <div className='mx-auto max-w-3xl p-6'>
      <header className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>Emprest Simples</h1>
          <p className='text-slate-600'>Seus empréstimos e financiamentos em um só lugar.</p>
        </div>

        <Link to='/novo'>
          <Button><FontAwesomeIcon icon={faPlus} className='mr-2' />Novo empréstimo</Button>
        </Link>
      </header>

      <div className='mt-6 grid gap-3'>
        {loading ? (
          <div className='rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-400'>
            Carregando...
          </div>
        ) : loans.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-600'>
            Nenhum empréstimo ainda. Clique em <b>Novo empréstimo</b> para começar.
          </div>
        ) : (
          loans.map((loan) => <LoanCard key={loan.id} loan={loan} />)
        )}
      </div>
    </div>
  );
}
