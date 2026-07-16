import { useMemo, useState } from 'react';
import { Button } from '../../../shared/ui/Button';
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card';
import { useLoans } from '../loans.context';
import { downloadLoansBackup, mergeLoans, parseLoansBackup } from '../loans.backup';

type ImportMode = 'replace' | 'merge';

export function BackupControls() {
  const { loans, setLoans } = useLoans();

  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [textValue, setTextValue] = useState('');
  const [status, setStatus] = useState<{ type: 'idle' | 'ok' | 'error'; message?: string }>({
    type: 'idle',
  });

  const canImport = useMemo(() => textValue.trim().length > 0, [textValue]);

  async function handleFile(file: File) {
    const text = await file.text();
    setTextValue(text);
    setStatus({ type: 'idle' });
  }

  function handleExport() {
    downloadLoansBackup(loans);
    setStatus({ type: 'ok', message: 'Backup exportado com sucesso ✅' });
  }

  function handleImport() {
    try {
      const { loans: imported } = parseLoansBackup(textValue);

      if (importMode === 'replace') {
        setLoans(imported);
      } else {
        setLoans(mergeLoans(loans, imported));
      }

      setStatus({
        type: 'ok',
        message:
          importMode === 'replace'
            ? `Importação concluída ✅ (${imported.length} empréstimos substituíram os atuais)`
            : `Importação concluída ✅ (${imported.length} empréstimos foram mesclados)`,
      });

      setTextValue('');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Falha ao importar backup.';
      setStatus({ type: 'error', message: msg });
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <h2 className='text-lg font-semibold'>Backup (JSON)</h2>
            <p className='text-sm text-slate-600'>
              Exporte/import para evitar perda de dados (LocalStorage).
            </p>
          </div>

          <Button variant='ghost' onClick={handleExport}>
            Exportar backup
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className='grid gap-4'>
          <div className='flex flex-wrap items-center gap-3'>
            <label className='text-sm text-slate-700'>
              <span className='mr-2 font-medium'>Importar via arquivo:</span>
              <input
                type='file'
                accept='application/json'
                className='text-sm'
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                }}
              />
            </label>

            <div className='ml-auto flex items-center gap-2 text-sm'>
              <span className='text-slate-600'>Modo:</span>

              <button
                className={`rounded-xl px-3 py-1 border ${
                  importMode === 'merge'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white'
                }`}
                onClick={() => setImportMode('merge')}
                type='button'
              >
                Mesclar
              </button>

              <button
                className={`rounded-xl px-3 py-1 border ${
                  importMode === 'replace'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white'
                }`}
                onClick={() => setImportMode('replace')}
                type='button'
              >
                Substituir
              </button>
            </div>
          </div>

          <div className='grid gap-2'>
            <label className='text-sm font-medium text-slate-700'>Ou cole o JSON aqui:</label>

            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              placeholder='Cole aqui o conteúdo do arquivo ".json"...'
              className='min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm outline-none focus:ring-2 focus:ring-slate-300'
            />

            <div className='flex items-center justify-end gap-2'>
              <Button variant='ghost' onClick={() => setTextValue('')} disabled={!canImport}>
                Limpar
              </Button>

              <Button onClick={handleImport} disabled={!canImport}>
                Importar backup
              </Button>
            </div>
          </div>

          {status.type !== 'idle' ? (
            <div
              className={`rounded-2xl border p-3 text-sm ${
                status.type === 'ok'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              {status.message}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
