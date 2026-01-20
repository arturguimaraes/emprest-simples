import { Link } from 'react-router-dom';
import type { Loan } from '../loans.types';
import { formatMoney } from '../loans.utils';
import { calcLoanSummary } from '../loans.selectors';

export function LoanCard({ loan }: { loan: Loan }) {
  const summary = calcLoanSummary(loan);

  const progressPct =
    loan.installmentsCount > 0
      ? Math.round((summary.paidInstallmentsCount / loan.installmentsCount) * 100)
      : 0;

  return (
    <Link
      to={`/emprestimo/${loan.id}`}
      className='block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300'
    >
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h3 className='text-lg font-semibold'>{loan.name}</h3>
          <p className='text-sm text-slate-600'>
            Total previsto: <span className='font-medium'>{formatMoney(loan.totalToPayCents)}</span>
          </p>
          <p className='text-sm text-slate-600'>
            Pago: <span className='font-medium'>{formatMoney(summary.paidSoFarCents)}</span>
          </p>
        </div>

        <div className='text-right'>
          <div className='text-sm font-semibold'>{progressPct}%</div>
          <div className='text-xs text-slate-500'>
            {summary.paidInstallmentsCount}/{loan.installmentsCount} pagas
          </div>
        </div>
      </div>

      <div className='mt-3 h-2 w-full rounded-full bg-slate-100'>
        <div className='h-2 rounded-full bg-slate-900' style={{ width: `${progressPct}%` }} />
      </div>
    </Link>
  );
}
