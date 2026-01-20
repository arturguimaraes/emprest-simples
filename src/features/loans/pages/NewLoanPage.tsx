import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card';
import { useLoans } from '../loans.context';
import type { Loan } from '../loans.types';
import { createInstallments, cryptoId, todayISODate, toCents } from '../loans.utils';

export function NewLoanPage() {
  const nav = useNavigate();
  const { addLoan } = useLoans();

  const [name, setName] = useState('Meu empréstimo');
  const [principal, setPrincipal] = useState<number>(10000);
  const [totalToPay, setTotalToPay] = useState<number>(12000);
  const [installmentsCount, setInstallmentsCount] = useState<number>(12);
  const [firstDueDate, setFirstDueDate] = useState<string>(todayISODate());

  const [interestRateMonthlyPct, setInterestRateMonthlyPct] = useState<number>(0);
  const [cetAnnualPct, setCetAnnualPct] = useState<number>(0);

  const canSubmit = useMemo(() => {
    return (
      name.trim().length > 0 &&
      principal > 0 &&
      totalToPay > 0 &&
      installmentsCount > 0 &&
      firstDueDate.length === 10
    );
  }, [name, principal, totalToPay, installmentsCount, firstDueDate]);

  function onSubmit() {
    if (!canSubmit) return;

    const now = new Date().toISOString();

    const loan: Loan = {
      id: cryptoId(),
      name: name.trim(),

      principalAmountCents: toCents(principal),
      totalToPayCents: toCents(totalToPay),

      interestRateMonthlyPct: interestRateMonthlyPct > 0 ? interestRateMonthlyPct : undefined,
      cetAnnualPct: cetAnnualPct > 0 ? cetAnnualPct : undefined,

      installmentsCount,
      firstDueDate,

      createdAt: now,
      updatedAt: now,

      installments: createInstallments({
        installmentsCount,
        firstDueDate,
        totalToPayCents: toCents(totalToPay),
      }),
    };

    addLoan(loan);
    nav(`/emprestimo/${loan.id}`);
  }

  return (
    <div className='mx-auto max-w-3xl p-6'>
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
          <div className='grid gap-4 md:grid-cols-2'>
            <Input
              label='Nome'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Ex: Nubank - Parcelado'
            />

            <Input
              label='Quantidade de parcelas'
              type='number'
              min={1}
              value={installmentsCount}
              onChange={(e) => setInstallmentsCount(Number(e.target.value))}
            />

            <Input
              label='Valor emprestado (R$)'
              type='number'
              min={0}
              step={0.01}
              value={principal}
              onChange={(e) => setPrincipal(Number(e.target.value))}
            />

            <Input
              label='Total a pagar (R$)'
              type='number'
              min={0}
              step={0.01}
              value={totalToPay}
              onChange={(e) => setTotalToPay(Number(e.target.value))}
            />

            <Input
              label='1º vencimento'
              type='date'
              value={firstDueDate}
              onChange={(e) => setFirstDueDate(e.target.value)}
            />

            <div className='grid gap-4 md:grid-cols-2'>
              <Input
                label='Juros (a.m.) % (opcional)'
                type='number'
                min={0}
                step={0.01}
                value={interestRateMonthlyPct}
                onChange={(e) => setInterestRateMonthlyPct(Number(e.target.value))}
              />
              <Input
                label='CET (a.a.) % (opcional)'
                type='number'
                min={0}
                step={0.01}
                value={cetAnnualPct}
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
