import React from 'react';
import { Button } from '@/shared/ui/Button';

type Props = {
  title: string;
  children: React.ReactNode;
  confirmLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  title,
  children,
  confirmLabel = 'Confirmar',
  confirmVariant = 'primary',
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl'>
        <h3 className='mb-2 text-lg font-semibold'>{title}</h3>
        <div className='mb-4 text-sm text-slate-600'>{children}</div>
        <div className='flex justify-end gap-3'>
          <Button variant='ghost' onClick={onCancel}>Cancelar</Button>
          <Button variant={confirmVariant} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
