import { useState } from 'react';
import type { FormEvent } from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VerificarCodigoModalProps {
  email: string;
  onClose: () => void;
}

export function VerificarCodigoModal({
  email,
  onClose,
}: VerificarCodigoModalProps) {
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerificar = async (e: FormEvent) => {
    e.preventDefault();

    if (codigo.length !== 6) {
      setErro('Digite os 6 números do código.');
      return;
    }

    setLoading(true);
    setErro('');

    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, codigo_verificacao')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (error || !data) {
        setErro('Não foi possível verificar o código. Tente novamente.');
        setLoading(false);
        return;
      }

      if (data.codigo_verificacao !== codigo) {
        setErro('Código incorreto. Verifique seu email e tente novamente.');
        setLoading(false);
        return;
      }

      await supabase
        .from('usuarios')
        .update({ email_confirmado: true })
        .eq('id', data.id);

      localStorage.setItem('usuario_id', data.id);

      window.location.href = './option';
    } catch (err) {
      console.error(err);
      setErro('Erro inesperado. Tente novamente.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-sm bg-[#151517] rounded-2xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span className="text-white font-semibold text-sm">
              Verificação de Código
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-300 text-xs font-medium">
            Fechar
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-white text-xl font-bold mb-2">Digite o código</h2>
          <p className="text-gray-400 text-sm leading-relaxed mb-8">
            Enviamos um código de 6 dígitos para{' '}
            <span className="text-gray-200">{email}</span>
          </p>

          <form onSubmit={handleVerificar} className="w-full">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={codigo}
              onChange={(e) => {
                setCodigo(e.target.value.replace(/\D/g, ''));
                setErro('');
              }}
              disabled={loading}
              placeholder="000000"
              className="w-full bg-[#1f1f22] border border-white/10 rounded-lg py-3 text-center text-2xl tracking-[0.5em] font-mono text-white placeholder-gray-600 outline-none focus:border-blue-500 transition-colors disabled:opacity-60"
            />

            {erro && <p className="text-red-400 text-xs mt-3">{erro}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-3 mt-6 text-sm font-semibold bg-blue-500 hover:bg-blue-600 text-white transition-colors disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? (
                <>
                  Verificando...
                  <Loader2 className="w-4 h-4 animate-spin" />
                </>
              ) : (
                'Verificar código'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
