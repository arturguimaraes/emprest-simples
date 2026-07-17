import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faEnvelope, faPaperPlane, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../auth.context';
import { Button } from '../../../shared/ui/Button';
import { Input } from '../../../shared/ui/Input';
import { Card, CardContent, CardHeader } from '../../../shared/ui/Card';

export function LoginPage() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendMagicLink(email.trim());
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar o link. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-slate-50 p-6'>
      <div className='w-full max-w-sm'>
        <div className='mb-8 text-center'>
          <h1 className='text-3xl font-bold'>Emprest Simples</h1>
          <p className='mt-1 text-slate-600'>Seus empréstimos e financiamentos em um só lugar.</p>
        </div>

        <Card>
          <CardHeader>
            <div className='font-semibold'>
              {sent ? (
                <><FontAwesomeIcon icon={faPaperPlane} className='mr-2 text-blue-500' />Link enviado!</>
              ) : (
                <><FontAwesomeIcon icon={faEnvelope} className='mr-2 text-slate-500' />Entrar</>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className='text-sm text-slate-600'>
                <p>Enviamos um link de acesso para <b>{email}</b>.</p>
                <p className='mt-2'>Verifique sua caixa de entrada e clique no link para entrar.</p>
                <Button variant='ghost' className='mt-4 w-full' onClick={() => { setSent(false); setEmail(''); }}>
                  <FontAwesomeIcon icon={faArrowLeft} className='mr-2' />Usar outro e-mail
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className='grid gap-4'>
                <Input
                  label='E-mail'
                  required
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='seu@email.com'
                />
                {error && <p className='text-sm text-red-600'>{error}</p>}
                <Button type='submit' disabled={loading || !email.trim()}>
                  <FontAwesomeIcon icon={loading ? faSpinner : faPaperPlane} spin={loading} className='mr-2' />
                  {loading ? 'Enviando...' : 'Enviar link de acesso'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
