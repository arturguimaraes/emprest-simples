import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import type { Loan } from '../loans.types';
import { formatMoney } from '../loans.utils';
import { calcLoanSummary } from '../loans.selectors';

export function LoanCard({ loan }: { loan: Loan }) {
  const summary = calcLoanSummary(loan);

  const progressPct =
    loan.installmentsCount > 0
      ? Math.round((summary.paidInstallmentsCount / loan.installmentsCount) * 100)
      : 0;

  const totalCents = (loan.downPaymentAmountCents ?? 0) + loan.totalToPayCents;

  return (
    <Link
      to={`/loan/${loan.id}`}
      className='block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300'
    >
      <div className='flex items-start justify-between gap-4'>
        <div className='min-w-0'>
          <h3 className='text-lg font-semibold'>{loan.name}</h3>
          <p className='text-sm text-slate-600'>
            Total: <span className='font-medium'>{formatMoney(totalCents)}</span>
            {' · '}Pago: <span className='font-medium'>{formatMoney(summary.paidSoFarCents)}</span>
            {' · '}Falta: <span className='font-medium'>{formatMoney(summary.remainingExpectedCents)}</span>
          </p>
          {summary.savingsCents > 0 && (
            <p className='text-sm font-medium text-green-600'>
              Economia: {formatMoney(summary.savingsCents)}
            </p>
          )}
        </div>

        <div className='shrink-0 flex items-center gap-3'>
          <div className='text-right'>
            <div className='text-sm font-semibold'>{progressPct}%</div>
            <div className='text-xs text-slate-500'>
              {summary.paidInstallmentsCount}/{loan.installmentsCount} pagas
            </div>
          </div>
          <FontAwesomeIcon icon={faChevronRight} className='text-slate-300' size='sm' />
        </div>
      </div>

      <div className='mt-3 h-2 w-full rounded-full bg-slate-100'>
        <div
          className={`h-2 rounded-full transition-all duration-300 ${progressPct >= 100 ? 'bg-green-500' : progressPct > 50 ? 'bg-blue-500' : 'bg-yellow-400'}`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </Link>
  );
}
