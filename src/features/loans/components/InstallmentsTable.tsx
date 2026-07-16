import type { Loan } from '../loans.types';
import { formatMoney, fromCents, toCents, todayISODate } from '../loans.utils';
import { Input } from '../../../shared/ui/Input';

type EditProps = {
  readOnly?: false;
  loan: Loan;
  onTogglePaid: (installmentId: string, paid: boolean) => void;
  onUpdatePaidAmount: (installmentId: string, amountCents: number) => void;
  onUpdatePaidDate: (installmentId: string, dateISO: string) => void;
};

type ReadOnlyProps = {
  readOnly: true;
  loan: Loan;
  onTogglePaid?: never;
  onUpdatePaidAmount?: never;
  onUpdatePaidDate?: never;
};

type Props = EditProps | ReadOnlyProps;

function discountBadge(expectedCents: number, paidCents: number) {
  if (expectedCents === 0) return null;
  const diffCents = expectedCents - paidCents;
  const pct = (diffCents / expectedCents) * 100;
  if (Math.abs(pct) < 0.01) return null;
  if (pct > 0)
    return (
      <span className='font-medium text-green-600'>
        {formatMoney(diffCents)} ({pct.toFixed(1)}% desc.)
      </span>
    );
  return (
    <span className='font-medium text-red-500'>
      {formatMoney(Math.abs(diffCents))} ({Math.abs(pct).toFixed(1)}% acrésc.)
    </span>
  );
}

export function InstallmentsTable({ loan, readOnly, onTogglePaid, onUpdatePaidAmount, onUpdatePaidDate }: Props) {
  const showPaidColumns = loan.installments.some((i) => i.paid);

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

            return (
              <tr key={it.id} className='border-t border-slate-100'>
                <td className='px-4 py-3 font-medium'>{it.number}</td>
                <td className='px-4 py-3'>{it.dueDate}</td>
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
                        <span>{it.paidDate ?? '—'}</span>
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
      </table>
    </div>
  );
}
