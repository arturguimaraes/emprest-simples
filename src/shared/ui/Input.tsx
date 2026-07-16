import React from 'react';

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, className = '', ...props }: Props) {
  return (
    <label className='grid gap-1 text-sm'>
      {label ? (
        <span className={props.required ? 'font-semibold text-slate-700' : 'text-slate-700'}>
          {label}
          {props.required && <span className='ml-0.5 text-red-500'>*</span>}
        </span>
      ) : null}
      <input
        {...props}
        className={`rounded-xl border border-slate-200 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-slate-300 ${className}`}
      />
    </label>
  );
}
