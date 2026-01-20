import React from 'react';

export function Card({ children }: { children: React.ReactNode }) {
  return <div className='rounded-2xl border border-slate-200 bg-white shadow-sm'>{children}</div>;
}

export function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className='border-b border-slate-100 p-4'>{children}</div>;
}

export function CardContent({ children }: { children: React.ReactNode }) {
  return <div className='p-4'>{children}</div>;
}
