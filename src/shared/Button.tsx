import React from 'react';

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
};

export function Button({ className = '', variant = 'primary', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition ' +
    'focus:outline-none focus:ring-2 focus:ring-slate-400 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary: 'bg-slate-900 text-white hover:bg-slate-800',
    ghost: 'bg-transparent text-slate-900 hover:bg-slate-100',
    danger: 'bg-red-600 text-white hover:bg-red-500',
  };

  return <button {...props} className={`${base} ${variants[variant]} ${className}`} />;
}
