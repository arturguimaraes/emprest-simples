# Emprest Simples

**Emprest Simples** é um aplicativo web para acompanhar **financiamentos e empréstimos** de forma simples e prática, com dados salvos na nuvem via **Firebase Firestore**.

Cadastre um empréstimo, acompanhe **parcela por parcela**, marque pagamentos e veja um resumo claro do quanto já foi pago, quanto falta e quanto você economizou.

---

## Funcionalidades

### Cadastro de empréstimos

- Nome do empréstimo
- Valor emprestado e entrada (opcional)
- Três modos de cálculo das parcelas:
  - **Valor por parcela** — informe o valor de cada parcela; o total é calculado automaticamente
  - **Valor emprestado** — divide o valor financiado (principal − entrada) igualmente entre as parcelas
  - **Total a pagar** — informe o total; o valor por parcela é calculado automaticamente
- Data do primeiro vencimento
- Juros a.m. e CET a.a. (opcionais, informativos)

### Lista de empréstimos

- Todos os empréstimos em um só lugar
- Progresso de parcelas pagas (%)
- Total previsto e total pago

### Detalhes do empréstimo

- Tabela completa de parcelas
- Marcar parcela como paga / não paga
- Editar valor pago (adiantamento, desconto, negociação)
- Editar data real do pagamento

### Resumo financeiro automático

- **Pago até agora**
- **Falta pagar (estimado)**
- **Economia acumulada** — total previsto originalmente menos o custo projetado real

---

## Stack

- React 19 + TypeScript
- Tailwind CSS v4
- Firebase Firestore (persistência na nuvem)
- React Router v7
- Vite

---

## Rodando localmente

```bash
npm install
npm run dev
```

App disponível em `http://localhost:5173`.

## Build de produção

```bash
npm run build
```

Arquivos gerados em `dist/`.
