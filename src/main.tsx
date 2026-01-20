import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './index.css';
import { LoansProvider } from './features/loans/loans.context';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <LoansProvider>
      <App />
    </LoansProvider>
  </React.StrictMode>,
);
