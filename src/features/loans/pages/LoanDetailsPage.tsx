import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLoans } from '../loans.context';
import { Button } from '../../../shared/ui/Button';
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card';
import { InstallmentsTable } from '../components/InstallmentsTable';
import { calcLoanSummary } from '../loans.selectors';
import { formatMoney, todayISODate } from '../loans.utils';

export function LoanDetailsPage() {
  const nav = useNavigate();
  const { loanId } = useParams<{ loanId: string }>();
  const { loans, deleteLoan, updateInstallment, updateLoan, replaceAllInstallments } = useLoans();

  const loan = loans.find((l) => l.id === loanId);

  if (!loan) {
    return (
      <div className='mx-auto max-w-3xl p-6'>
        <p className='text-slate-600'>Empréstimo não encontrado.</p>
        <Link to='/'>
          <Button className='mt-4'>Voltar</Button>
        </Link>
      </div>
    );
  }

  const summary = calcLoanSummary(loan);

  function touchUpdatedAt() {
    updateLoan(loan!.id, { updatedAt: new Date().toISOString() });
  }

  function onTogglePaid(installmentId: string, paid: boolean) {
    const it = loan!.installments.find((i) => i.id === installmentId);
    if (!it) return;

    if (paid) {
      // default inteligente
      updateInstallment(loan!.id, installmentId, {
        paid: true,
        paidAmountCents: it.expectedAmountCents,
        paidDate: todayISODate(),
      });
    } else {
      updateInstallment(loan!.id, installmentId, {
        paid: false,
        paidAmountCents: undefined,
        paidDate: undefined,
      });
    }

    touchUpdatedAt();
  }

  function onUpdatePaidAmount(installmentId: string, amountCents: number) {
    updateInstallment(loan!.id, installmentId, { paidAmountCents: amountCents });
    touchUpdatedAt();
  }

  function onUpdatePaidDate(installmentId: string, dateISO: string) {
    updateInstallment(loan!.id, installmentId, { paidDate: dateISO });
    touchUpdatedAt();
  }

  function onToggleAllPaid() {
    const allPaid = loan!.installments.every((i) => i.paid);
    const today = todayISODate();
    const updated = loan!.installments.map((it) =>
      allPaid
        ? { ...it, paid: false, paidAmountCents: undefined, paidDate: undefined }
        : it.paid
          ? it
          : { ...it, paid: true, paidAmountCents: it.expectedAmountCents, paidDate: today },
    );
    replaceAllInstallments(loan!.id, updated);
    touchUpdatedAt();
  }

  function onDeleteLoan() {
    deleteLoan(loan!.id);
    nav('/');
  }

  return (
    <div className='mx-auto max-w-5xl p-6'>
      <header className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold'>{loan.name}</h1>
          <p className='text-slate-600'>
            Valor emprestado: <b>{formatMoney(loan.principalAmountCents)}</b>
            {loan.downPaymentAmountCents ? (
              <> • Entrada: <b>{formatMoney(loan.downPaymentAmountCents)}</b></>
            ) : null}
            {' '}• Total nas parcelas: <b>{formatMoney(loan.totalToPayCents)}</b>
            {' '}• Custo total: <b>{formatMoney((loan.downPaymentAmountCents ?? 0) + loan.totalToPayCents)}</b>
            {' '}• Parcelas: <b>{loan.installmentsCount}</b>
            {loan.interestRateMonthlyPct != null ? (
              <> • Juros: <b>{loan.interestRateMonthlyPct.toFixed(2)}% a.m.</b></>
            ) : null}
            {loan.cetAnnualPct != null ? (
              <> • CET: <b>{loan.cetAnnualPct.toFixed(2)}% a.a.</b></>
            ) : null}
          </p>
          <p className='mt-1 text-xs text-slate-400'>
            Criado em {new Date(loan.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='ghost' onClick={() => nav('/')}>
            Voltar
          </Button>
          <Button variant='danger' onClick={onDeleteLoan}>
            Excluir
          </Button>
        </div>
      </header>

      <div className='mt-6 grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader>
            <div className='text-sm text-slate-600'>Pago até agora</div>
            <div className='text-xl font-bold'>{formatMoney(summary.paidSoFarCents)}</div>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-slate-600'>
              {summary.paidInstallmentsCount}/{loan.installmentsCount} parcelas pagas
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='text-sm text-slate-600'>Falta pagar (estimado)</div>
            <div className='text-xl font-bold'>{formatMoney(summary.remainingExpectedCents)}</div>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-slate-600'>
              {summary.openInstallmentsCount} parcelas em aberto
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='text-sm text-slate-600'>Economia acumulada</div>
            <div className='text-xl font-bold'>{formatMoney(summary.savingsCents)}</div>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-slate-600'>Total contratado − projeção atual</div>
          </CardContent>
        </Card>
      </div>

      <div className='mt-6'>
        {(() => {
          const pct = loan.installmentsCount > 0
            ? (summary.paidInstallmentsCount / loan.installmentsCount) * 100
            : 0;
          const barColor =
            pct >= 100 ? 'bg-green-500' : pct > 50 ? 'bg-blue-500' : 'bg-yellow-400';
          return (
            <div className='mb-6'>
              <div className='mb-1 flex justify-between text-xs text-slate-500'>
                <span>{summary.paidInstallmentsCount} de {loan.installmentsCount} parcelas pagas</span>
                <span>{pct.toFixed(0)}%</span>
              </div>
              <div className='h-2.5 w-full overflow-hidden rounded-full bg-slate-100'>
                <div
                  className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

        <div className='mb-3 flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Parcelas</h2>
          <Button variant='ghost' onClick={onToggleAllPaid}>
            {loan.installments.every((i) => i.paid) ? 'Desmarcar todas' : 'Marcar todas como pagas'}
          </Button>
        </div>

        <InstallmentsTable
          loan={loan}
          onTogglePaid={onTogglePaid}
          onUpdatePaidAmount={onUpdatePaidAmount}
          onUpdatePaidDate={onUpdatePaidDate}
        />
      </div>
    </div>
  );
}
