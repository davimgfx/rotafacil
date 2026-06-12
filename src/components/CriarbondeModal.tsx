import { useState } from 'react';
import { Footprints, MapPin, UserPlus } from 'lucide-react';
import { Field } from './Field';
import { ModalShell } from './ModalShell';
import { supabase } from '../lib/supabase';
import { ORIGENS, DESTINOS } from '../constants/locations';
import { getUsuarioId } from '../lib/auth';

const inputClass =
  'w-full bg-[#1C1C26] border border-white/5 rounded-xl py-2.5 px-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50';

const selectClass =
  'w-full bg-[#1C1C26] border border-white/5 rounded-xl py-2.5 px-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none';

interface CriarBondeModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

export function CriarBondeModal({ onClose, onCreated }: CriarBondeModalProps) {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [horario, setHorario] = useState('');
  const [vagas, setVagas] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!origem || !destino || !horario || !vagas) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);

    const usuarioId = getUsuarioId();

    if (!usuarioId) {
      setError('Você precisa estar logado para criar um bonde.');
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from('bondes').insert({
      criador_id: usuarioId,
      origem,
      destino,
      horario_saida: horario,
      vagas_total: Number(vagas),
      observacoes: observacoes || null,
    });

    setLoading(false);

    if (insertError) {
      setError('Não foi possível criar o bonde. Tente novamente.');
      return;
    }

    onCreated?.();
    onClose();
  };

  return (
    <ModalShell
      title="Criar Bonde"
      icon={UserPlus}
      accent="bg-blue-500/15 text-blue-400"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={loading ? 'Criando...' : 'Criar Bonde'}>
      <Field label="Ponto de partida">
        <div className="relative">
          <MapPin className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            className={`${selectClass} pl-9`}
            required>
            <option value="" disabled>
              Selecione o ponto de partida
            </option>
            {ORIGENS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <Field label="Destino">
        <div className="relative">
          <Footprints className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={destino}
            onChange={(e) => setDestino(e.target.value)}
            className={`${selectClass} pl-9`}
            required>
            <option value="" disabled>
              Selecione o destino
            </option>
            {DESTINOS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Horário de saída">
          <input
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Vagas no grupo">
          <input
            type="number"
            min={1}
            max={20}
            placeholder="Ex: 5"
            value={vagas}
            onChange={(e) => setVagas(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
      </div>

      <Field label="Observações (opcional)">
        <textarea
          rows={3}
          placeholder="Ex: Vou esperar em frente à entrada principal."
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className={`${inputClass} resize-none`}
        />
      </Field>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-3 text-xs text-blue-200/80 leading-relaxed">
        Pessoas próximas verão seu bonde como "Ativo agora" e poderão entrar
        para caminhar com segurança até o destino.
      </div>
    </ModalShell>
  );
}
