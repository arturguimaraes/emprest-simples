# 💸 Emprest Simples

**Emprest Simples** é um mini-sistema web para acompanhar **financiamentos / empréstimos** de forma simples, prática e offline-first (usando **LocalStorage**).

A ideia é permitir que você cadastre um empréstimo com seus principais dados e depois acompanhe **parcela por parcela**, marcando pagamentos, ajustando valores e vendo um resumo claro do quanto já foi pago, quanto falta e quanto você economizou.

---

## ✅ Funcionalidades

### 📌 Cadastro de empréstimos

- Nome do empréstimo (para fácil identificação)
- Valor emprestado (principal)
- Total previsto a pagar
- Número de parcelas
- Data do primeiro vencimento
- (Opcional) juros a.m. e CET a.a.

### 📋 Lista de empréstimos

- Exibe todos os empréstimos cadastrados
- Progresso de parcelas pagas (%)
- Total previsto e total pago até o momento

### 🧾 Detalhes do empréstimo

- Tabela completa de parcelas
- Marcar parcela como paga/não paga
- Editar valor pago (ex: adiantamento, desconto, negociação)
- Editar data real do pagamento

### 📊 Resumo financeiro automático

- **Pago até agora**
- **Falta pagar (estimado)**
- **Economia acumulada**  
  Calculada por:
  > Total previsto originalmente − (valor já pago + soma esperada das parcelas restantes)

---

## 🧱 Stack

- ⚛️ React
- 🟦 TypeScript
- 🎨 Tailwind CSS (v4)
- 💾 LocalStorage (persistência local)
- 🧭 React Router

---

## 🚀 Rodando localmente

### 1) Instalar dependências

```bash
npm install
```

### 2) Rodar o projeto

```bash
npm run dev
```

O app estará disponível em:

```bash
http://localhost:5173
```

## 📦 Build de produção

```bash
npm run build
```

Os arquivos finais serão gerados em:

```bash
dist/
```
