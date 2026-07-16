import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card';
import { useLoans } from '../loans.context';
import type { Loan } from '../loans.types';
import { createInstallments, cryptoId, todayISODate, toCents } from '../loans.utils';

// How the user wants to derive the installment breakdown
type CalcMode = 'perInstallment' | 'byPrincipal' | 'byTotal';

const CALC_MODES: { value: CalcMode; label: string }[] = [
  { value: 'perInstallment', label: 'Valor por parcela' },
  { value: 'byPrincipal', label: 'Valor emprestado' },
  { value: 'byTotal', label: 'Total a pagar' },
];

export function NewLoanPage() {
  const nav = useNavigate();
  const { addLoan } = useLoans();

  // Base fields
  const [name, setName] = useState('Meu empréstimo');
  const [principal, setPrincipal] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [installmentsCount, setInstallmentsCount] = useState<number>(12);
  const [firstDueDate, setFirstDueDate] = useState<string>(todayISODate());
  const [interestRateMonthlyPct, setInterestRateMonthlyPct] = useState<number>(0);
  const [cetAnnualPct, setCetAnnualPct] = useState<number>(0);

  // Calc mode + mode-specific inputs
  const [calcMode, setCalcMode] = useState<CalcMode>('byTotal');
  const [installmentAmount, setInstallmentAmount] = useState<number>(0); // editable in 'perInstallment' mode
  const [totalToPay, setTotalToPay] = useState<number>(0);              // editable in 'byTotal' mode

  // Resolved values used for submission
  const resolvedTotalToPay = useMemo(() => {
    if (calcMode === 'perInstallment') return installmentsCount > 0 ? installmentsCount * installmentAmount : 0;
    if (calcMode === 'byPrincipal') return Math.max(0, principal - downPayment);
    return totalToPay;
  }, [calcMode, installmentsCount, installmentAmount, principal, downPayment, totalToPay]);

  const resolvedInstallmentAmount = useMemo(() => {
    if (installmentsCount <= 0 || resolvedTotalToPay <= 0) return 0;
    return resolvedTotalToPay / installmentsCount;
  }, [resolvedTotalToPay, installmentsCount]);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      principal > 0 &&
      installmentsCount > 0 &&
      firstDueDate.length === 10 &&
      resolvedTotalToPay > 0
    );
  }, [name, principal, installmentsCount, firstDueDate, resolvedTotalToPay]);

  function onSubmit() {
    if (!canSubmit) return;

    const now = new Date().toISOString();
    const totalToPayCents = toCents(resolvedTotalToPay);

    const loan: Loan = {
      id: cryptoId(),
      name: name.trim(),
      principalAmountCents: toCents(principal),
      downPaymentAmountCents: downPayment > 0 ? toCents(downPayment) : undefined,
      totalToPayCents,
      interestRateMonthlyPct: interestRateMonthlyPct > 0 ? interestRateMonthlyPct : undefined,
      cetAnnualPct: cetAnnualPct > 0 ? cetAnnualPct : undefined,
      installmentsCount,
      firstDueDate,
      createdAt: now,
      updatedAt: now,
      installments: createInstallments({ installmentsCount, firstDueDate, totalToPayCents }),
    };

    addLoan(loan);
    nav(`/loan/${loan.id}`);
  }

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

            {/* Principal + Down payment */}
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
                type='number'
                min={0}
                step={0.01}
                value={downPayment || ''}
                placeholder='0,00 (opcional)'
                onChange={(e) => setDownPayment(Number(e.target.value))}
              />
            </div>

            {/* Calc mode selector */}
            <div>
              <div className='mb-2 text-sm font-medium text-slate-700'>Calcular parcelas por</div>
              <div className='flex gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1'>
                {CALC_MODES.map((m) => (
                  <button
                    key={m.value}
                    type='button'
                    onClick={() => setCalcMode(m.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      calcMode === m.value
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Calc fields: always 3-col grid — count | installmentAmount | totalToPay */}
            <div className='grid gap-4 md:grid-cols-3'>
              <Input
                label='Quantidade de parcelas'
                required
                type='number'
                min={1}
                value={installmentsCount}
                onChange={(e) => setInstallmentsCount(Number(e.target.value))}
              />

              {/* Middle cell: installment amount */}
              {calcMode === 'perInstallment' ? (
                <Input
                  label='Valor por parcela (R$)'
                  required
                  type='number'
                  min={0}
                  step={0.01}
                  value={installmentAmount || ''}
                  placeholder='0,00'
                  onChange={(e) => setInstallmentAmount(Number(e.target.value))}
                />
              ) : (
                <Input
                  label='Valor por parcela (R$)'
                  computed
                  type='number'
                  value={resolvedInstallmentAmount > 0 ? resolvedInstallmentAmount.toFixed(2) : ''}
                />
              )}

              {/* Right cell: Total a pagar */}
              {calcMode === 'byTotal' ? (
                <Input
                  label='Total a pagar (R$)'
                  required
                  type='number'
                  min={0}
                  step={0.01}
                  value={totalToPay || ''}
                  placeholder='0,00'
                  onChange={(e) => setTotalToPay(Number(e.target.value))}
                />
              ) : (
                <Input
                  label='Total a pagar (R$)'
                  computed
                  type='number'
                  value={resolvedTotalToPay > 0 ? resolvedTotalToPay.toFixed(2) : ''}
                />
              )}
            </div>

            {/* Optional rates */}
            <div className='grid gap-4 md:grid-cols-2'>
              <Input
                label='Juros (a.m.) % (opcional)'
                type='number'
                min={0}
                step={0.01}
                value={interestRateMonthlyPct || ''}
                onChange={(e) => setInterestRateMonthlyPct(Number(e.target.value))}
              />

              <Input
                label='CET (a.a.) % (opcional)'
                type='number'
                min={0}
                step={0.01}
                value={cetAnnualPct || ''}
                onChange={(e) => setCetAnnualPct(Number(e.target.value))}
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
