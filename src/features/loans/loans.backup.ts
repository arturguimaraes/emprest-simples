import type { Loan } from './loans.types';
import { cryptoId, createInstallments, todayISODate } from './loans.utils';

export type LoansStorageShapeV1 = {
  version: 1;
  loans: Loan[];
};

export type LoansBackupV1 = {
  app: 'emprest-simples';
  backupVersion: 1;
  exportedAt: string;
  storage: LoansStorageShapeV1;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toInt(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.round(n);
}

function toStringSafe(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toBool(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Normaliza um Loan parcialmente vindo do JSON.
 * - Preenche campos obrigatórios
 * - Corrige tipos
 * - Garante installments consistentes
 */
function normalizeLoan(input: unknown): Loan | null {
  if (!isObject(input)) return null;

  const now = new Date().toISOString();

  const id = toStringSafe(input.id, cryptoId());
  const name = toStringSafe(input.name, 'Empréstimo importado');

  const principalAmountCents = toInt(input.principalAmountCents, 0);
  let totalToPayCents = toInt(input.totalToPayCents, 0);

  const interestRateMonthlyPct =
    typeof input.interestRateMonthlyPct === 'number' ? input.interestRateMonthlyPct : undefined;

  const cetAnnualPct = typeof input.cetAnnualPct === 'number' ? input.cetAnnualPct : undefined;

  const createdAt = toStringSafe(input.createdAt, now);
  const updatedAt = toStringSafe(input.updatedAt, now);

  // firstDueDate e installmentsCount: tentamos extrair, mas garantimos um fallback.
  const firstDueDate = toStringSafe(input.firstDueDate, todayISODate());

  const rawInstallments = Array.isArray(input.installments) ? input.installments : [];

  // Se vier installments no JSON, usamos e normalizamos.
  const normalizedInstallments = rawInstallments
    .map((it: unknown, idx: number) => {
      if (!isObject(it)) return null;

      const installmentId = toStringSafe(it.id, cryptoId());
      const number = toInt(it.number, idx + 1);
      const dueDate = toStringSafe(it.dueDate, firstDueDate);

      const expectedAmountCents = toInt(it.expectedAmountCents, 0);

      const paid = toBool(it.paid, false);
      const paidAmountCents = paid ? toInt(it.paidAmountCents, expectedAmountCents) : undefined;

      const paidDate = paid ? toStringSafe(it.paidDate, todayISODate()) : undefined;

      return {
        id: installmentId,
        number,
        dueDate,
        expectedAmountCents,
        paid,
        paidAmountCents,
        paidDate,
      };
    })
    .filter(Boolean) as Loan['installments'];

  // Se não veio parcelas, a gente gera automaticamente (fallback)
  let installments: Loan['installments'] = normalizedInstallments;

  let installmentsCount = toInt(input.installmentsCount, installments.length || 0);

  // Se não veio installmentsCount mas veio array, usamos o length
  if (installmentsCount <= 0 && installments.length > 0) {
    installmentsCount = installments.length;
  }

  // Se nada veio, gera um empréstimo "mínimo"
  if (installmentsCount <= 0) {
    installmentsCount = 1;
  }

  // Se não vier parcelas, gera pelo total (se totalToPay estiver 0, tenta derivar do principal)
  if (installments.length === 0) {
    if (totalToPayCents <= 0) totalToPayCents = Math.max(principalAmountCents, 0);

    installments = createInstallments({
      installmentsCount,
      firstDueDate,
      totalToPayCents,
    });
  }

  // Se totalToPay veio 0 ou inválido, tenta derivar da soma esperada
  if (totalToPayCents <= 0) {
    totalToPayCents = installments.reduce((acc, it) => acc + it.expectedAmountCents, 0);
  }

  // Garantia final: installmentsCount coerente com o array
  if (installments.length !== installmentsCount) {
    installmentsCount = installments.length;
  }

  return {
    id,
    name,
    principalAmountCents,
    totalToPayCents,
    interestRateMonthlyPct,
    cetAnnualPct,
    installmentsCount,
    firstDueDate,
    createdAt,
    updatedAt,
    installments,
  };
}

/**
 * Exporta como JSON string (com metadados + estrutura compatível).
 */
export function serializeLoansBackup(loans: Loan[]): string {
  const backup: LoansBackupV1 = {
    app: 'emprest-simples',
    backupVersion: 1,
    exportedAt: new Date().toISOString(),
    storage: {
      version: 1,
      loans,
    },
  };

  return JSON.stringify(backup, null, 2);
}

function downloadTextFile(filename: string, text: string, mime = 'application/json') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Faz download do backup como arquivo .json
 */
export function downloadLoansBackup(loans: Loan[]) {
  const json = serializeLoansBackup(loans);
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  downloadTextFile(`emprest-simples-backup-${yyyy}-${mm}-${dd}.json`, json);
}

/**
 * Parseia e valida import:
 * Aceita formatos:
 * 1) { app, backupVersion, exportedAt, storage: { version:1, loans: [...] } }
 * 2) { version:1, loans:[...] } (shape direto do storage)
 * 3) [...] (array de loans)
 */
export function parseLoansBackup(jsonText: string): { loans: Loan[] } {
  let parsed: unknown;

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('JSON inválido. Verifique o arquivo/conteúdo importado.');
  }

  let maybeLoans: unknown = null;

  // Formato 1: backup completo
  if (isObject(parsed) && isObject(parsed.storage) && Array.isArray(parsed.storage.loans)) {
    maybeLoans = parsed.storage.loans;
  }

  // Formato 2: storage direto
  if (maybeLoans === null && isObject(parsed) && Array.isArray(parsed.loans)) {
    maybeLoans = parsed.loans;
  }

  // Formato 3: array direto
  if (maybeLoans === null && Array.isArray(parsed)) {
    maybeLoans = parsed;
  }

  if (!Array.isArray(maybeLoans)) {
    throw new Error('Estrutura de backup não reconhecida. Esperado um array de empréstimos.');
  }

  const normalized = maybeLoans.map(normalizeLoan).filter(Boolean) as Loan[];

  if (normalized.length === 0) {
    throw new Error('Backup não contém empréstimos válidos para importação.');
  }

  return { loans: normalized };
}

/**
 * Merge por id (importado sobrescreve o existente com mesmo id)
 */
export function mergeLoans(existing: Loan[], imported: Loan[]): Loan[] {
  const map = new Map<string, Loan>();

  // base: existing
  for (const l of existing) {
    map.set(l.id, l);
  }

  // imported sobrescreve
  for (const l of imported) {
    map.set(l.id, l);
  }

  // retorno: importados primeiro (mais “visíveis”), depois os demais
  const importedIds = new Set(imported.map((l) => l.id));
  const importedFirst = imported.map((l) => map.get(l.id)!).filter(Boolean);

  const rest = existing
    .filter((l) => !importedIds.has(l.id))
    .map((l) => map.get(l.id)!)
    .filter(Boolean);

  return [...importedFirst, ...rest];
}
