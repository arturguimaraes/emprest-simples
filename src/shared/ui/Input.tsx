import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className = '', ...props }: Props) {
  return (
    <label className='grid gap-1 text-sm'>
      {label ? <span className='text-slate-700'>{label}</span> : null}
      <input
        {...props}
        className={`rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 ${className}`}
      />
    </label>
  );
}
