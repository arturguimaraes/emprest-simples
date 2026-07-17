import React from 'react';

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const hasBg = /\bbg-/.test(className);
  const hasBorder = /\bborder-[a-z]/.test(className);
  return (
    <div className={`rounded-2xl border shadow-sm ${!hasBorder ? 'border-slate-200' : ''} ${!hasBg ? 'bg-white' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className='border-b border-slate-100 p-4'>{children}</div>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className='p-4'>{children}</div>;
}
