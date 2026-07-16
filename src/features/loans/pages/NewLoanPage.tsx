import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card';
import { useLoans } from '../loans.context';
import type { Loan } from '../loans.types';
import {
  createInstallments,
  cryptoId,
  todayISODate,
  toCents,
  solveMonthlyRate,
  cetFromMonthlyRate,
} from '../loans.utils';

// Which of the two interdependent fields was last edited by the user
type PrimaryField = 'installmentAmount' | 'interestRate';

export function NewLoanPage() {
  const nav = useNavigate();
  const { addLoan } = useLoans();

  const [name, setName] = useState('Meu empréstimo');
  const [firstDueDate, setFirstDueDate] = useState(todayISODate());
  const [principal, setPrincipal] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [installmentsCount, setInstallmentsCount] = useState(12);

  // Mutually dependent: last one changed drives computation of the other
  const [primaryField, setPrimaryField] = useState<PrimaryField>('installmentAmount');
  const [installmentAmountRaw, setInstallmentAmountRaw] = useState(0);
  const [interestRateRaw, setInterestRateRaw] = useState(0);

  const financed = Math.max(0, principal - downPayment);

  const resolved = useMemo(() => {
    let installment: number;
    let interestPct: number;

    if (primaryField === 'interestRate' && interestRateRaw > 0) {
      interestPct = interestRateRaw;
      if (financed > 0 && installmentsCount > 0) {
        const i = interestPct / 100;
        installment = (financed * i) / (1 - Math.pow(1 + i, -installmentsCount));
      } else {
        installment = 0;
      }
    } else {
      installment = installmentAmountRaw;
      if (installment > 0 && financed > 0 && installmentsCount > 0) {
        const rate = solveMonthlyRate(financed, installment, installmentsCount);
        interestPct = rate != null ? rate * 100 : 0;
      } else {
        interestPct = 0;
      }
    }

    const totalToPay = downPayment + installmentsCount * installment;
    const monthlyRate = interestPct > 0 ? interestPct / 100 : null;
    const cet = monthlyRate != null ? cetFromMonthlyRate(monthlyRate) : null;

    return { installment, interestPct, totalToPay, cet };
  }, [primaryField, installmentAmountRaw, interestRateRaw, financed, installmentsCount, downPayment]);

  const canSubmit =
    name.trim().length > 0 &&
    principal > 0 &&
    financed > 0 &&
    installmentsCount > 0 &&
    firstDueDate.length === 10 &&
    resolved.installment > 0;

  function onSubmit() {
    if (!canSubmit) return;

    const now = new Date().toISOString();
    const installmentsTotalCents = toCents(resolved.installment * installmentsCount);

    const loan: Loan = {
      id: cryptoId(),
      name: name.trim(),
      principalAmountCents: toCents(principal),
      downPaymentAmountCents: downPayment > 0 ? toCents(downPayment) : undefined,
      totalToPayCents: installmentsTotalCents,
      interestRateMonthlyPct: resolved.interestPct > 0 ? resolved.interestPct : undefined,
      cetAnnualPct: resolved.cet ?? undefined,
      installmentsCount,
      firstDueDate,
      createdAt: now,
      updatedAt: now,
      installments: createInstallments({
        installmentsCount,
        firstDueDate,
        totalToPayCents: installmentsTotalCents,
      }),
    };

    addLoan(loan);
    nav(`/loan/${loan.id}`);
  }

  // Display value for installment field:
  // — when it's the primary: show the raw value the user typed
  // — when it's computed from interest rate: show the derived value
  const installmentDisplayValue =
    primaryField === 'installmentAmount'
      ? installmentAmountRaw || ''
      : resolved.installment > 0
        ? resolved.installment.toFixed(2)
        : '';

  // Display value for interest rate field (vice versa)
  const interestDisplayValue =
    primaryField === 'interestRate'
      ? interestRateRaw || ''
      : resolved.interestPct > 0
        ? resolved.interestPct.toFixed(2)
        : '';

  return (
    <div className='mx-auto max-w-5xl p-6'>
      <header className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold'>Novo empréstimo</h1>
          <p className='text-slate-600'>Cadastre e acompanhe parcela por parcela.</p>
        </div>
        <Button variant='ghost' onClick={() => nav('/')}>
          Voltar
        </Button>
      </header>

      <Card>
        <CardHeader>
          <div className='font-semibold'>Dados do empréstimo</div>
        </CardHeader>

        <CardContent>
          <div className='grid gap-6'>
            {/* Nome + vencimento */}
            <div className='grid gap-4 md:grid-cols-2'>
              <Input
                label='Nome'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='Ex: Nubank - Parcelado'
              />
              <Input
                label='1º vencimento'
                required
                type='date'
                value={firstDueDate}
                onChange={(e) => setFirstDueDate(e.target.value)}
              />
            </div>

            {/* Loan amount + down payment */}
            <div className='grid gap-4 md:grid-cols-2'>
              <Input
                label='Valor emprestado (R$)'
                required
                type='number'
                min={0}
                step={0.01}
                value={principal || ''}
                placeholder='0,00'
                onChange={(e) => setPrincipal(Number(e.target.value))}
              />
              <Input
                label='Entrada (R$)'
                required
                type='number'
                min={0}
                step={0.01}
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
              />
            </div>

            {/* Installments count */}
            <Input
              label='Quantidade de parcelas'
              required
              type='number'
              min={1}
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(Number(e.target.value))}
            />

            {/* Interdependent pair — last edited drives the other */}
            <div className='grid gap-4 md:grid-cols-2'>
              <Input
                label='Valor por parcela (R$)'
                required
                type='number'
                min={0}
                step={0.01}
                value={installmentDisplayValue}
                placeholder='0,00'
                onChange={(e) => {
                  setInstallmentAmountRaw(Number(e.target.value));
                  setPrimaryField('installmentAmount');
                }}
              />
              <Input
                label='Juros (a.m.) %'
                required
                type='number'
                min={0}
                step={0.01}
                value={interestDisplayValue}
                placeholder='0,00'
                onChange={(e) => {
                  setInterestRateRaw(Number(e.target.value));
                  setPrimaryField('interestRate');
                }}
              />
            </div>
            <p className='text-xs text-slate-400 -mt-4'>
              Informe o valor da parcela ou a taxa de juros — o outro campo será calculado automaticamente.
            </p>

            {/* Always-computed outputs */}
            <div className='grid gap-4 md:grid-cols-2'>
              <Input
                label='Total a pagar (R$)'
                computed
                type='number'
                value={resolved.totalToPay > 0 ? resolved.totalToPay.toFixed(2) : ''}
              />
              <Input
                label='CET (a.a.) %'
                computed
                type='number'
                value={resolved.cet != null ? resolved.cet.toFixed(2) : ''}
              />
            </div>
          </div>

          <div className='mt-6 flex items-center justify-end gap-3'>
            <Button variant='ghost' onClick={() => nav('/')}>
              Cancelar
            </Button>
            <Button disabled={!canSubmit} onClick={onSubmit}>
              Criar empréstimo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
