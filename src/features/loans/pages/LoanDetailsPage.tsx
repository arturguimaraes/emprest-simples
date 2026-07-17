import React, { useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCalendarDay, faCircleCheck, faClock, faPencil, faPiggyBank, faTrash, faPen, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useLoans } from '../loans.context';
import { Button } from '../../../shared/ui/Button';
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card';
import { InstallmentsTable } from '../components/InstallmentsTable';
import { calcLoanSummary } from '../loans.selectors';
import { formatMoney, todayISODate } from '../loans.utils';
import type { Installment } from '../loans.types';

export function LoanDetailsPage() {
  const nav = useNavigate();
  const { loanId } = useParams<{ loanId: string }>();
  const { loans, deleteLoan, updateLoan, replaceAllInstallments } = useLoans();
  const renameInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [draftInstallments, setDraftInstallments] = useState<Installment[]>([]);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  const [isRenaming, setIsRenaming] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Rename so `loan` below is always Loan (not Loan | undefined) — closures stay safe
  const maybeLoan = loans.find((l) => l.id === loanId);

  if (!maybeLoan) {
    return (
      <div className='mx-auto max-w-3xl p-6'>
        <p className='text-slate-600'>Empréstimo não encontrado.</p>
        <Link to='/'>
          <Button className='mt-4'>Voltar</Button>
        </Link>
      </div>
    );
  }

  const loan = maybeLoan;

  const displayedInstallments = isEditing ? draftInstallments : loan.installments;
  const summary = calcLoanSummary({ ...loan, installments: displayedInstallments });

  const isDirty =
    isEditing &&
    JSON.stringify(draftInstallments) !== JSON.stringify(loan.installments);

  const nextInstallment = loan.installments
    .filter((i) => !i.paid)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  const totalCents = (loan.downPaymentAmountCents ?? 0) + loan.totalToPayCents;

  const progressPct =
    loan.installmentsCount > 0
      ? (summary.paidInstallmentsCount / loan.installmentsCount) * 100
      : 0;
  const barColor =
    progressPct >= 100 ? 'bg-green-500' : progressPct > 50 ? 'bg-blue-500' : 'bg-yellow-400';

  const paidPct = totalCents > 0 ? (summary.paidSoFarCents / totalCents) * 100 : 0;
  const remainingPct = totalCents > 0 ? (summary.remainingExpectedCents / totalCents) * 100 : 0;
  const economyPct =
    loan.totalToPayCents > 0 ? (summary.savingsCents / loan.totalToPayCents) * 100 : 0;

  // Paid installments sorted by paid date (then by number as tiebreaker)
  const paidInstallments = loan.installments
    .filter((i) => i.paid)
    .sort((a, b) => {
      const dateCmp = (a.paidDate ?? a.dueDate).localeCompare(b.paidDate ?? b.dueDate);
      return dateCmp !== 0 ? dateCmp : a.number - b.number;
    });

  const unpaidInstallments = loan.installments
    .filter((i) => !i.paid)
    .sort((a, b) => a.number - b.number);

  // --- navigation guards ---

  function requestNav(target: string) {
    if (isDirty) {
      setPendingNav(target);
      setShowDiscardConfirm(true);
    } else {
      setIsEditing(false);
      nav(target);
    }
  }

  function requestCancelEdit() {
    if (isDirty) {
      setPendingNav(null);
      setShowDiscardConfirm(true);
    } else {
      setIsEditing(false);
    }
  }

  function confirmDiscard() {
    setShowDiscardConfirm(false);
    setIsEditing(false);
    if (pendingNav) {
      nav(pendingNav);
      setPendingNav(null);
    }
  }

  // --- edit mode ---

  function enterEditMode() {
    setDraftInstallments(loan.installments.map((i) => ({ ...i })));
    setIsEditing(true);
  }

  function onTogglePaid(installmentId: string, paid: boolean) {
    const today = todayISODate();
    setDraftInstallments((prev) =>
      prev.map((it) =>
        it.id !== installmentId
          ? it
          : paid
            ? { ...it, paid: true, paidAmountCents: it.expectedAmountCents, paidDate: today }
            : { ...it, paid: false, paidAmountCents: undefined, paidDate: undefined },
      ),
    );
  }

  function onUpdatePaidAmount(installmentId: string, amountCents: number) {
    setDraftInstallments((prev) =>
      prev.map((it) => (it.id !== installmentId ? it : { ...it, paidAmountCents: amountCents })),
    );
  }

  function onUpdatePaidDate(installmentId: string, dateISO: string) {
    setDraftInstallments((prev) =>
      prev.map((it) => (it.id !== installmentId ? it : { ...it, paidDate: dateISO })),
    );
  }

  function onToggleAllPaid() {
    const allPaid = draftInstallments.every((i) => i.paid);
    const today = todayISODate();
    setDraftInstallments((prev) =>
      prev.map((it) =>
        allPaid
          ? { ...it, paid: false, paidAmountCents: undefined, paidDate: undefined }
          : it.paid
            ? it
            : { ...it, paid: true, paidAmountCents: it.expectedAmountCents, paidDate: today },
      ),
    );
  }

  // --- save ---

  type DiffChange =
    | { type: 'paid';           number: number; expectedAmountCents: number; paidAmountCents: number; paidDate: string }
    | { type: 'unpaid';         number: number; expectedAmountCents: number }
    | { type: 'amount-changed'; number: number; expectedAmountCents: number; oldCents: number; newCents: number }
    | { type: 'date-changed';   number: number; oldDate: string; newDate: string };

  type DiffResult = {
    changes: DiffChange[];
    newlyPaidCents: number;
    totalDiscountCents: number;
    totalPaidAfterSaveCents: number;
  };

  function fmtDate(iso: string) {
    if (!iso) return '—';
    return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }

  function computeDiff(): DiffResult {
    const changes: DiffChange[] = [];

    for (const draft of draftInstallments) {
      const original = loan.installments.find((i) => i.id === draft.id);
      if (!original) continue;

      if (draft.paid !== original.paid) {
        if (draft.paid) {
          changes.push({
            type: 'paid',
            number: draft.number,
            expectedAmountCents: draft.expectedAmountCents,
            paidAmountCents: draft.paidAmountCents ?? draft.expectedAmountCents,
            paidDate: draft.paidDate ?? '',
          });
        } else {
          changes.push({ type: 'unpaid', number: draft.number, expectedAmountCents: draft.expectedAmountCents });
        }
      } else if (draft.paid) {
        if (draft.paidAmountCents !== original.paidAmountCents) {
          changes.push({
            type: 'amount-changed',
            number: draft.number,
            expectedAmountCents: draft.expectedAmountCents,
            oldCents: original.paidAmountCents ?? 0,
            newCents: draft.paidAmountCents ?? 0,
          });
        }
        if (draft.paidDate !== original.paidDate) {
          changes.push({
            type: 'date-changed',
            number: draft.number,
            oldDate: original.paidDate ?? '',
            newDate: draft.paidDate ?? '',
          });
        }
      }
    }

    const newlyPaid = changes.filter((c): c is Extract<DiffChange, { type: 'paid' }> => c.type === 'paid');
    const newlyPaidCents = newlyPaid.reduce((s, c) => s + c.paidAmountCents, 0);
    const totalDiscountCents = newlyPaid.reduce((s, c) => s + (c.expectedAmountCents - c.paidAmountCents), 0);
    const totalPaidAfterSaveCents =
      (loan.downPaymentAmountCents ?? 0) +
      draftInstallments.filter((i) => i.paid).reduce((s, i) => s + (i.paidAmountCents ?? 0), 0);

    return { changes, newlyPaidCents, totalDiscountCents, totalPaidAfterSaveCents };
  }

  async function confirmSave() {
    await replaceAllInstallments(loan.id, draftInstallments);
    await updateLoan(loan.id, { updatedAt: new Date().toISOString() });
    setShowSaveConfirm(false);
    setIsEditing(false);
  }

  function onDeleteLoan() {
    deleteLoan(loan.id);
    nav('/');
  }

  function startRename() {
    setDraftName(loan.name);
    setIsRenaming(true);
  }

  async function confirmRename() {
    const trimmed = draftName.trim();
    if (trimmed && trimmed !== loan.name) {
      await updateLoan(loan.id, { name: trimmed, updatedAt: new Date().toISOString() });
    }
    setIsRenaming(false);
  }

  function cancelRename() {
    setIsRenaming(false);
  }

  function onRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') confirmRename();
    if (e.key === 'Escape') cancelRename();
  }

  const diffResult = showSaveConfirm ? computeDiff() : null;

  return (
    <div className='mx-auto max-w-5xl p-6'>
      {/* Header */}
      <header className='flex items-start justify-between gap-4'>
        <div>
          {isRenaming ? (
            <div className='flex items-center gap-2'>
              <input
                ref={renameInputRef}
                autoFocus
                className='text-2xl font-bold border-b-2 border-blue-500 bg-transparent outline-none w-full'
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                onKeyDown={onRenameKeyDown}
                onBlur={confirmRename}
              />
            </div>
          ) : (
            <div className='flex items-center gap-2 group'>
              <h1 className='text-2xl font-bold'>{loan.name}</h1>
              <button
                onClick={startRename}
                className='opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-slate-600'
                title='Renomear'
              >
                <FontAwesomeIcon icon={faPencil} size='sm' />
              </button>
            </div>
          )}
          <p className='text-slate-600'>
            Valor emprestado: <b>{formatMoney(loan.principalAmountCents)}</b>
            {loan.downPaymentAmountCents ? (
              <> • Entrada: <b>{formatMoney(loan.downPaymentAmountCents)}</b></>
            ) : null}
            {' '}• Total nas parcelas: <b>{formatMoney(loan.totalToPayCents)}</b>
            {' '}• Custo total: <b>{formatMoney(totalCents)}</b>
            {' '}• Parcelas: <b>{loan.installmentsCount}</b>
            {loan.interestRateMonthlyPct != null ? (
              <> • Juros: <b>{loan.interestRateMonthlyPct.toFixed(2)}% a.m.</b></>
            ) : null}
            {loan.cetAnnualPct != null ? (
              <> • CET: <b>{loan.cetAnnualPct.toFixed(2)}% a.a.</b></>
            ) : null}
          </p>
          <p className='mt-1 text-xs text-slate-400'>
            Criado em{' '}
            {new Date(loan.createdAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>

        <div className='flex shrink-0 items-center gap-2'>
          <Button variant='ghost' onClick={() => requestNav('/')}>
            <FontAwesomeIcon icon={faArrowLeft} className='mr-2' />Voltar
          </Button>
          {!isEditing && (
            <Button variant='danger' onClick={() => setShowDeleteConfirm(true)}>
              <FontAwesomeIcon icon={faTrash} className='mr-2' />Excluir
            </Button>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className='mt-6'>
        <div className='mb-1 flex justify-between text-xs text-slate-500'>
          <span>
            {summary.paidInstallmentsCount} de {loan.installmentsCount} parcelas pagas
          </span>
          <span>{progressPct.toFixed(0)}%</span>
        </div>
        <div className='h-2.5 w-full overflow-hidden rounded-full bg-slate-100'>
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* VIEW mode */}
      {!isEditing && (
        <>
          {/* Summary cards */}
          <div className='mt-6 grid grid-cols-2 gap-4 md:grid-cols-4'>
            <Card className='bg-green-50 border-green-200'>
              <CardHeader>
                <div className='text-sm text-green-700'><FontAwesomeIcon icon={faCircleCheck} className='mr-1.5 text-green-500' />Pago até agora</div>
                <div className='text-xl font-bold'>{formatMoney(summary.paidSoFarCents)}</div>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-slate-600'>{paidPct.toFixed(1)}% do custo total</div>
                <div className='mt-0.5 text-xs text-slate-400'>
                  {summary.paidInstallmentsCount}/{loan.installmentsCount} parcelas
                  {loan.downPaymentAmountCents ? ' + entrada' : ''}
                </div>
              </CardContent>
            </Card>

            <Card className='bg-yellow-50 border-yellow-200'>
              <CardHeader>
                <div className='text-sm text-yellow-700'><FontAwesomeIcon icon={faClock} className='mr-1.5 text-yellow-500' />Parcelas em aberto</div>
                <div className='text-xl font-bold'>{formatMoney(summary.remainingExpectedCents)}</div>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-slate-600'>{remainingPct.toFixed(1)}% do custo total</div>
                <div className='mt-0.5 text-xs text-slate-400'>
                  {summary.openInstallmentsCount} parcelas restantes
                </div>
              </CardContent>
            </Card>

            <Card className='bg-blue-50 border-blue-200'>
              <CardHeader>
                <div className='text-sm text-blue-700'><FontAwesomeIcon icon={faCalendarDay} className='mr-1.5 text-blue-500' />Próximo vencimento</div>
                <div className='text-xl font-bold'>
                  {nextInstallment
                    ? new Date(nextInstallment.dueDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-slate-600'>
                  {nextInstallment
                    ? `Parcela ${nextInstallment.number} — ${formatMoney(nextInstallment.expectedAmountCents)}`
                    : 'Todas as parcelas pagas'}
                </div>
              </CardContent>
            </Card>

            <Card className='bg-purple-50 border-purple-200'>
              <CardHeader>
                <div className='text-sm text-purple-700'><FontAwesomeIcon icon={faPiggyBank} className='mr-1.5 text-purple-500' />Economia acumulada</div>
                <div
                  className={`text-xl font-bold ${summary.savingsCents > 0 ? 'text-green-600' : summary.savingsCents < 0 ? 'text-red-500' : ''}`}
                >
                  {formatMoney(summary.savingsCents)}
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-sm text-slate-600'>
                  {summary.savingsCents > 0
                    ? `${economyPct.toFixed(1)}% do total contratado`
                    : summary.savingsCents < 0
                      ? 'Acréscimo em relação ao previsto'
                      : 'Sem economia registrada'}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='mt-4 flex justify-end'>
            <Button onClick={enterEditMode}><FontAwesomeIcon icon={faPen} className='mr-2' />Editar parcelas</Button>
          </div>

          {/* Paid installments */}
          {paidInstallments.length > 0 && (
            <div className='mt-8'>
              <h2 className='mb-3 text-lg font-semibold'>Parcelas pagas</h2>
              <InstallmentsTable
                readOnly
                loan={{ ...loan, installments: paidInstallments }}
              />
            </div>
          )}

          {/* Unpaid installments */}
          {unpaidInstallments.length > 0 && (
            <div className='mt-8'>
              <h2 className='mb-3 text-lg font-semibold'>Parcelas em aberto</h2>
              <InstallmentsTable
                readOnly
                loan={{ ...loan, installments: unpaidInstallments }}
              />
            </div>
          )}

        </>
      )}

      {/* EDIT mode */}
      {isEditing && (
        <div className='mt-6'>
          <div className='mb-3 flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Parcelas</h2>
            <Button variant='ghost' onClick={onToggleAllPaid}>
              {draftInstallments.every((i) => i.paid) ? 'Desmarcar todas' : 'Marcar todas como pagas'}
            </Button>
          </div>

          <InstallmentsTable
            loan={{ ...loan, installments: draftInstallments }}
            onTogglePaid={onTogglePaid}
            onUpdatePaidAmount={onUpdatePaidAmount}
            onUpdatePaidDate={onUpdatePaidDate}
          />

          <div className='mt-4 flex items-center justify-end gap-3'>
            <Button variant='ghost' onClick={requestCancelEdit}>
              Cancelar
            </Button>
            <Button onClick={() => setShowSaveConfirm(true)} disabled={!isDirty}>
              <FontAwesomeIcon icon={faCheck} className='mr-2' />Salvar alterações
            </Button>
          </div>
        </div>
      )}

      {/* Save confirmation modal */}
      {showSaveConfirm && diffResult && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-md rounded-2xl bg-white p-6 shadow-xl'>
            <h3 className='mb-3 text-lg font-semibold'>Confirmar alterações</h3>

            <ul className='mb-4 max-h-64 space-y-2 overflow-y-auto text-sm'>
              {diffResult.changes.map((change, i) => (
                <li key={i} className='rounded-lg bg-slate-50 px-3 py-2'>
                  {change.type === 'paid' && (() => {
                    const discount = change.expectedAmountCents - change.paidAmountCents;
                    return (
                      <div>
                        <div className='font-medium text-slate-800'>
                          Parcela {change.number} — paga
                        </div>
                        <div className='mt-1 flex flex-wrap gap-x-4 text-xs text-slate-500'>
                          <span>Pago: <b className='text-slate-700'>{formatMoney(change.paidAmountCents)}</b></span>
                          {discount !== 0 && <span>Esperado: {formatMoney(change.expectedAmountCents)}</span>}
                          {change.paidDate && <span>Data: {fmtDate(change.paidDate)}</span>}
                        </div>
                        {discount !== 0 && (
                          <div className={`mt-1 text-xs font-medium ${discount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {discount > 0 ? 'Desconto: −' : 'Acréscimo: +'}{formatMoney(Math.abs(discount))}
                            {' '}({(Math.abs(discount) / change.expectedAmountCents * 100).toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {change.type === 'unpaid' && (
                    <span className='text-slate-600'>
                      <b>Parcela {change.number}</b> — desmarcada
                    </span>
                  )}

                  {change.type === 'amount-changed' && (() => {
                    const discount = change.expectedAmountCents - change.newCents;
                    return (
                      <div>
                        <div className='font-medium text-slate-800'>Parcela {change.number} — valor alterado</div>
                        <div className='mt-1 text-xs text-slate-500'>
                          {formatMoney(change.oldCents)} → <b className='text-slate-700'>{formatMoney(change.newCents)}</b>
                          <span className='ml-2 text-slate-400'>(esperado: {formatMoney(change.expectedAmountCents)})</span>
                        </div>
                        {discount !== 0 && (
                          <div className={`mt-1 text-xs font-medium ${discount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {discount > 0 ? 'Desconto: −' : 'Acréscimo: +'}{formatMoney(Math.abs(discount))}
                            {' '}({(Math.abs(discount) / change.expectedAmountCents * 100).toFixed(1)}%)
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {change.type === 'date-changed' && (
                    <div>
                      <div className='font-medium text-slate-800'>Parcela {change.number} — data alterada</div>
                      <div className='mt-1 text-xs text-slate-500'>
                        {fmtDate(change.oldDate)} → <b className='text-slate-700'>{fmtDate(change.newDate)}</b>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {/* Summary */}
            <div className='mb-4 rounded-xl bg-slate-50 px-4 py-3 text-sm space-y-1.5'>
              {diffResult.newlyPaidCents > 0 && (
                <div className='flex justify-between text-slate-600'>
                  <span>Pago nesta sessão</span>
                  <span className='font-semibold text-slate-800'>{formatMoney(diffResult.newlyPaidCents)}</span>
                </div>
              )}
              {diffResult.totalDiscountCents > 0 && (
                <div className='flex justify-between text-green-600'>
                  <span>Desconto total</span>
                  <span className='font-semibold'>−{formatMoney(diffResult.totalDiscountCents)}</span>
                </div>
              )}
              {diffResult.totalDiscountCents < 0 && (
                <div className='flex justify-between text-red-500'>
                  <span>Acréscimo total</span>
                  <span className='font-semibold'>+{formatMoney(Math.abs(diffResult.totalDiscountCents))}</span>
                </div>
              )}
              <div className={`flex justify-between text-slate-600 ${diffResult.newlyPaidCents > 0 ? 'border-t border-slate-200 pt-1.5' : ''}`}>
                <span>Total pago até agora</span>
                <span className='font-semibold text-slate-800'>{formatMoney(diffResult.totalPaidAfterSaveCents)}</span>
              </div>
            </div>

            <div className='flex justify-end gap-3'>
              <Button variant='ghost' onClick={() => setShowSaveConfirm(false)}>
                Voltar
              </Button>
              <Button onClick={confirmSave}>
                <FontAwesomeIcon icon={faCheck} className='mr-2' />Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl'>
            <h3 className='mb-2 text-lg font-semibold'>Excluir empréstimo?</h3>
            <p className='mb-4 text-sm text-slate-600'>
              Tem certeza que deseja excluir <b>{loan.name}</b>? Esta ação não pode ser desfeita.
            </p>
            <div className='flex justify-end gap-3'>
              <Button variant='ghost' onClick={() => setShowDeleteConfirm(false)}>
                Cancelar
              </Button>
              <Button variant='danger' onClick={onDeleteLoan}>
                <FontAwesomeIcon icon={faTrash} className='mr-2' />Excluir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Discard confirmation modal */}
      {showDiscardConfirm && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
          <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl'>
            <h3 className='mb-2 text-lg font-semibold'>Descartar alterações?</h3>
            <p className='mb-4 text-sm text-slate-600'>
              Você tem alterações não salvas. Deseja descartá-las?
            </p>
            <div className='flex justify-end gap-3'>
              <Button variant='ghost' onClick={() => setShowDiscardConfirm(false)}>
                Continuar editando
              </Button>
              <Button variant='danger' onClick={confirmDiscard}>
                Descartar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
