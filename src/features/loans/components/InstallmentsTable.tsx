import type { Loan } from '../loans.types';
import { formatMoney, fromCents, toCents, todayISODate } from '../loans.utils';
import { Input } from '../../../shared/ui/Input';

type Props = {
  loan: Loan;
  onTogglePaid: (installmentId: string, paid: boolean) => void;
  onUpdatePaidAmount: (installmentId: string, amountCents: number) => void;
  onUpdatePaidDate: (installmentId: string, dateISO: string) => void;
};

function discountLabel(expectedCents: number, paidCents: number): { text: string; color: string } | null {
  if (expectedCents === 0) return null;
  const pct = ((expectedCents - paidCents) / expectedCents) * 100;
  if (Math.abs(pct) < 0.01) return null;
  if (pct > 0) return { text: `${pct.toFixed(1)}% desc.`, color: 'text-green-600' };
  return { text: `${Math.abs(pct).toFixed(1)}% acrésc.`, color: 'text-red-500' };
}

export function InstallmentsTable({
  loan,
  onTogglePaid,
  onUpdatePaidAmount,
  onUpdatePaidDate,
}: Props) {
  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white'>
      <table className='w-full text-left text-sm'>
        <thead className='bg-slate-50 text-slate-700'>
          <tr>
            <th className='px-4 py-3'>#</th>
            <th className='px-4 py-3'>Vencimento</th>
            <th className='px-4 py-3'>Previsto</th>
            <th className='px-4 py-3'>Pago?</th>
            <th className='px-4 py-3'>Valor pago</th>
            <th className='px-4 py-3'>Data pagamento</th>
            <th className='px-4 py-3'>Ajuste</th>
          </tr>
        </thead>

        <tbody>
          {loan.installments.map((it) => {
            const discount =
              it.paid && it.paidAmountCents != null
                ? discountLabel(it.expectedAmountCents, it.paidAmountCents)
                : null;

            return (
              <tr key={it.id} className='border-t border-slate-100'>
                <td className='px-4 py-3 font-medium'>{it.number}</td>
                <td className='px-4 py-3'>{it.dueDate}</td>
                <td className='px-4 py-3'>{formatMoney(it.expectedAmountCents)}</td>

                <td className='px-4 py-3'>
                  <input
                    type='checkbox'
                    checked={it.paid}
                    onChange={(e) => onTogglePaid(it.id, e.target.checked)}
                    className='h-4 w-4 accent-slate-900'
                  />
                </td>

                <td className='px-4 py-3'>
                  {it.paid ? (
                    <Input
                      type='number'
                      min={0}
                      step={0.01}
                      value={fromCents(it.paidAmountCents ?? it.expectedAmountCents)}
                      onChange={(e) => onUpdatePaidAmount(it.id, toCents(Number(e.target.value)))}
                    />
                  ) : (
                    <span className='text-slate-400'>—</span>
                  )}
                </td>

                <td className='px-4 py-3'>
                  {it.paid ? (
                    <Input
                      type='date'
                      value={it.paidDate ?? todayISODate()}
                      onChange={(e) => onUpdatePaidDate(it.id, e.target.value)}
                    />
                  ) : (
                    <span className='text-slate-400'>—</span>
                  )}
                </td>

                <td className='px-4 py-3'>
                  {discount ? (
                    <span className={`font-medium ${discount.color}`}>{discount.text}</span>
                  ) : (
                    <span className='text-slate-400'>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
