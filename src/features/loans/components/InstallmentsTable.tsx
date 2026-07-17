import type { Loan } from '../loans.types';
import { formatMoney, fromCents, toCents, todayISODate } from '../loans.utils';
import { Input } from '@/shared/ui/Input';

type EditProps = {
  readOnly?: false;
  loan: Loan;
  onTogglePaid: (installmentId: string, paid: boolean) => void;
  onUpdatePaidAmount: (installmentId: string, amountCents: number) => void;
  onUpdatePaidDate: (installmentId: string, dateISO: string) => void;
  showTotals?: boolean;
  highlightId?: string;
};

type ReadOnlyProps = {
  readOnly: true;
  loan: Loan;
  onTogglePaid?: never;
  onUpdatePaidAmount?: never;
  onUpdatePaidDate?: never;
  showTotals?: boolean;
  highlightId?: string;
};

type Props = EditProps | ReadOnlyProps;

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function discountBadge(expectedCents: number, paidCents: number) {
  if (expectedCents === 0) return null;
  const diffCents = expectedCents - paidCents;
  const pct = (diffCents / expectedCents) * 100;
  if (Math.abs(pct) < 0.01) return null;
  if (pct > 0)
    return (
      <span className='font-medium text-green-600'>
        −{formatMoney(diffCents)} ({pct.toFixed(1)}% desc.)
      </span>
    );
  return (
    <span className='font-medium text-red-500'>
      +{formatMoney(Math.abs(diffCents))} ({Math.abs(pct).toFixed(1)}% acrésc.)
    </span>
  );
}

export function InstallmentsTable({
  loan,
  readOnly,
  onTogglePaid,
  onUpdatePaidAmount,
  onUpdatePaidDate,
  showTotals,
  highlightId,
}: Props) {
  const today = todayISODate();
  const showPaidColumns = loan.installments.some((i) => i.paid);

  const totalExpectedCents = loan.installments.reduce((s, i) => s + i.expectedAmountCents, 0);
  const totalPaidCents = loan.installments
    .filter((i) => i.paid)
    .reduce((s, i) => s + (i.paidAmountCents ?? i.expectedAmountCents), 0);
  const totalAdjustmentCents = loan.installments
    .filter((i) => i.paid && i.paidAmountCents != null)
    .reduce((s, i) => s + (i.expectedAmountCents - (i.paidAmountCents ?? i.expectedAmountCents)), 0);

  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
      <table className='w-full text-left text-sm'>
        <thead className='bg-slate-50 text-slate-700'>
          <tr>
            <th className='px-4 py-3'>#</th>
            <th className='px-4 py-3'>Vencimento</th>
            <th className='px-4 py-3'>Previsto</th>
            {!readOnly && <th className='px-4 py-3'>Pago?</th>}
            {(!readOnly || showPaidColumns) && <th className='px-4 py-3'>Valor pago</th>}
            {(!readOnly || showPaidColumns) && <th className='px-4 py-3'>Data pag.</th>}
            {(!readOnly || showPaidColumns) && <th className='px-4 py-3'>Ajuste</th>}
          </tr>
        </thead>

        <tbody>
          {loan.installments.map((it) => {
            const badge =
              it.paid && it.paidAmountCents != null
                ? discountBadge(it.expectedAmountCents, it.paidAmountCents)
                : null;

            const isHighlighted = it.id === highlightId;
            const isOverdue = !it.paid && it.dueDate < today;

            const rowCls = isHighlighted
              ? 'border-t border-slate-100 bg-blue-50'
              : isOverdue
                ? 'border-t border-slate-100 bg-red-50'
                : 'border-t border-slate-100';

            return (
              <tr key={it.id} className={rowCls}>
                <td className='px-4 py-3 font-medium'>{it.number}</td>
                <td className={`px-4 py-3 ${isOverdue ? 'font-medium text-red-600' : isHighlighted ? 'font-medium text-blue-700' : ''}`}>
                  {readOnly ? fmtDate(it.dueDate) : it.dueDate}
                  {isOverdue && (
                    <span className='ml-2 text-xs font-normal text-red-400'>
                      em atraso
                    </span>
                  )}
                  {isHighlighted && !isOverdue && (
                    <span className='ml-2 text-xs font-normal text-blue-400'>
                      próxima
                    </span>
                  )}
                </td>
                <td className='px-4 py-3'>{formatMoney(it.expectedAmountCents)}</td>

                {!readOnly && (
                  <td className='px-4 py-3'>
                    <input
                      type='checkbox'
                      checked={it.paid}
                      onChange={(e) => onTogglePaid(it.id, e.target.checked)}
                      className='h-4 w-4 accent-slate-900'
                    />
                  </td>
                )}

                {(!readOnly || showPaidColumns) && (
                  <td className='px-4 py-3'>
                    {it.paid ? (
                      readOnly ? (
                        <span>{formatMoney(it.paidAmountCents ?? it.expectedAmountCents)}</span>
                      ) : (
                        <Input
                          type='number'
                          min={0}
                          step={0.01}
                          value={fromCents(it.paidAmountCents ?? it.expectedAmountCents)}
                          onChange={(e) => onUpdatePaidAmount(it.id, toCents(Number(e.target.value)))}
                        />
                      )
                    ) : (
                      <span className='text-slate-400'>—</span>
                    )}
                  </td>
                )}

                {(!readOnly || showPaidColumns) && (
                  <td className='px-4 py-3'>
                    {it.paid ? (
                      readOnly ? (
                        <span>{fmtDate(it.paidDate ?? '')}</span>
                      ) : (
                        <Input
                          type='date'
                          value={it.paidDate ?? todayISODate()}
                          onChange={(e) => onUpdatePaidDate(it.id, e.target.value)}
                        />
                      )
                    ) : (
                      <span className='text-slate-400'>—</span>
                    )}
                  </td>
                )}

                {(!readOnly || showPaidColumns) && (
                  <td className='px-4 py-3'>
                    {badge ?? <span className='text-slate-400'>—</span>}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>

        {showTotals && (
          <tfoot>
            <tr className='border-t-2 border-slate-200 bg-slate-50 text-sm font-semibold'>
              <td className='px-4 py-3 text-slate-500' colSpan={2}>Total</td>
              <td className='px-4 py-3'>{formatMoney(totalExpectedCents)}</td>
              {!readOnly && <td />}
              {(!readOnly || showPaidColumns) && (
                <td className='px-4 py-3'>
                  {totalPaidCents > 0 ? formatMoney(totalPaidCents) : <span className='text-slate-400'>—</span>}
                </td>
              )}
              {(!readOnly || showPaidColumns) && <td />}
              {(!readOnly || showPaidColumns) && (
                <td className='px-4 py-3'>
                  {totalAdjustmentCents !== 0 ? (
                    <span className={totalAdjustmentCents > 0 ? 'text-green-600' : 'text-red-500'}>
                      {totalAdjustmentCents > 0 ? '−' : '+'}{formatMoney(Math.abs(totalAdjustmentCents))}
                    </span>
                  ) : (
                    <span className='text-slate-400'>—</span>
                  )}
                </td>
              )}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
