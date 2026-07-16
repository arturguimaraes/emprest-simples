import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  computed?: boolean;
};

export function Input({ label, className = '', computed, ...props }: Props) {
  return (
    <label className='grid gap-1 text-sm'>
      {label ? (
        <span className={props.required ? 'font-semibold text-slate-700' : 'text-slate-700'}>
          {label}
          {props.required && <span className='ml-0.5 text-red-500'>*</span>}
          {computed && <span className='ml-1.5 text-xs font-normal text-slate-400'>(calculado)</span>}
        </span>
      ) : null}
      <input
        {...props}
        readOnly={computed || props.readOnly}
        className={`rounded-xl border px-3 py-2 outline-none ${
          computed
            ? 'cursor-default border-slate-100 bg-slate-50 text-slate-500'
            : 'border-slate-200 bg-white focus:ring-2 focus:ring-slate-300'
        } ${className}`}
      />
    </label>
  );
}
