import { useState } from 'react';
import { ShieldCheck, Mail, FileUp, Send, Loader2, Check } from 'lucide-react';
import { supabase } from './lib/supabase';
import { VerificarCodigoModal } from './components/VerificarCodigoModal';

export default function App() {
  const [status, setStatus] = useState('idle'); // idle | loading | sent
  const [email, setEmail] = useState('');

  const gerarCodigo = () =>
    String(Math.floor(Math.random() * 1000000)).padStart(6, '0');

  const handleClick = async () => {
    if (!email) return;

    try {
      setStatus('loading');

      const codigo = gerarCodigo();

      const { data: usuario } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (usuario) {
        await supabase
          .from('usuarios')
          .update({
            codigo_verificacao: codigo,
          })
          .eq('id', usuario.id);
      } else {
        await supabase.from('usuarios').insert({
          nome_cliente: email.split('@')[0],
          email: email.toLowerCase(),
          codigo_verificacao: codigo,
        });
      }

      const response = await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: 'Código de acesso - RotaSegura Uni', // Assunto do e-mail
          _captcha: 'false', // Desativa o captcha obrigatório deles para funcionar em segundo plano
          Mensagem: `Seu código de verificação é: ${codigo}`,
          Aviso: 'Não compartilhe este código com ninguém.',
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('E-mail enviado via Web3Forms com sucesso!', result);
        setStatus('sent');
      } else {
        throw new Error(result.message || 'Erro ao submeter ao Web3Forms');
      }

      setStatus('sent');
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d0f] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#151517] rounded-2xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
            <span className="text-white font-semibold text-sm">
              RotaSegura Uni
            </span>
          </div>
          <span className="text-gray-500 text-xs font-medium tracking-wide">
            SOS
          </span>
        </div>

        {/* Body */}
        <div className="px-6 py-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>

          <h1 className="text-white text-2xl font-bold mb-3">
            Verificação de Estudante
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-8 mt-2">
            Para manter nossa comunidade segura e exclusiva, precisamos
            confirmar seu vínculo acadêmico. Escolha um dos métodos abaixo para
            continuar.
          </p>

          {/* Email Section */}
          <div className="w-full text-left">
            <label className="block text-gray-400 text-xs font-semibold tracking-wider mb-2 mt-4">
              E-MAIL INSTITUCIONAL
            </label>
            <div className="flex items-center gap-2 bg-[#1f1f22] border border-white/10 rounded-lg px-3 py-3 mb-2 focus-within:border-blue-500 transition-colors">
              <Mail className="w-4 h-4 text-gray-500 shrink-0" />
              <input
                type="email"
                placeholder="exemplo@universidade.edu.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status !== 'idle'}
                className="bg-transparent w-full text-sm text-white placeholder-gray-500 outline-none disabled:opacity-60"
              />
            </div>
            <p className="text-gray-500 text-xs mb-6">
              Você receberá um código de ativação instantâneo.
            </p>
          </div>

          {/* Button */}
          <button
            onClick={handleClick}
            disabled={status !== 'idle'}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold transition-colors mt-2
              ${
                status === 'sent'
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }
              disabled:cursor-not-allowed`}>
            {status === 'idle' && (
              <>
                Enviar Código de Verificação
                <Send className="w-4 h-4" />
              </>
            )}
            {status === 'loading' && (
              <>
                Enviando...
                <Loader2 className="w-4 h-4 animate-spin" />
              </>
            )}
            {status === 'sent' && (
              <>
                Enviado
                <Check className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 w-full my-8">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-500 text-xs font-medium tracking-wider">
              OU VALIDE MANUALMENTE
            </span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Upload */}
          <button className="w-full bg-[#1a1a1d] border border-white/10 rounded-xl py-6 flex flex-col items-center gap-3 hover:border-white/20 transition-colors">
            <FileUp className="w-6 h-6 text-gray-400" />
            <span className="text-white text-sm font-semibold">
              Upload de Comprovante de Matrícula
            </span>
            <span className="text-gray-500 text-xs">
              Carteirinha ou declaração (até 24h para análise).
            </span>
          </button>
        </div>
      </div>
      <div>
        {status === 'sent' && (
          <VerificarCodigoModal
            email={email}
            onClose={() => setStatus('idle')}
          />
        )}
      </div>
    </div>
  );
}
