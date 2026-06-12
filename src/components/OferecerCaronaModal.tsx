import { useState } from 'react';
import { Car, MapPin } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { Field } from './Field';
import { supabase } from '../lib/supabase';
import { ORIGENS, DESTINOS } from '../constants/locations';
import { getUsuarioId } from '../lib/auth';

const inputClass =
  'w-full bg-[#1C1C26] border border-white/5 rounded-xl py-2.5 px-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50';

const selectClass =
  'w-full bg-[#1C1C26] border border-white/5 rounded-xl py-2.5 px-3 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none';

interface OferecerCaronaModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

export function OferecerCaronaModal({
  onClose,
  onCreated,
}: OferecerCaronaModalProps) {
  const [origem, setOrigem] = useState('');
  const [destino, setDestino] = useState('');
  const [horario, setHorario] = useState('');
  const [vagas, setVagas] = useState('');
  const [veiculo, setVeiculo] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!origem || !destino || !horario || !vagas || !veiculo) {
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

    const { error: insertError } = await supabase.from('caronas').insert({
      motorista_id: usuarioId,
      origem,
      destino,
      horario,
      vagas_total: Number(vagas),
      veiculo,
      observacoes: observacoes || null,
    });

    setLoading(false);

    if (insertError) {
      setError('Não foi possível publicar a carona. Tente novamente.');
      return;
    }

    onCreated?.();
    onClose();
  };

  return (
    <ModalShell
      title="Oferecer Carona"
      icon={Car}
      accent="bg-white/5 text-gray-300"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={loading ? 'Publicando...' : 'Publicar Carona'}>
      <Field label="Origem">
        <div className="relative">
          <MapPin className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <select
            value={origem}
            onChange={(e) => setOrigem(e.target.value)}
            className={`${selectClass} pl-9`}
            required>
            <option value="" disabled>
              Selecione a origem
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
          <MapPin className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
        <Field label="Horário">
          <input
            type="time"
            value={horario}
            onChange={(e) => setHorario(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="Vagas disponíveis">
          <input
            type="number"
            min={1}
            max={6}
            placeholder="Ex: 2"
            value={vagas}
            onChange={(e) => setVagas(e.target.value)}
            className={inputClass}
            required
          />
        </Field>
      </div>

      <Field label="Veículo">
        <input
          type="text"
          placeholder="Ex: Honda Civic - Cinza - ABC1D23"
          value={veiculo}
          onChange={(e) => setVeiculo(e.target.value)}
          className={inputClass}
          required
        />
      </Field>

      <Field label="Observações (opcional)">
        <textarea
          rows={3}
          placeholder="Ex: Saída em frente à guarita principal."
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

      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-400 leading-relaxed">
        Seus dados de motorista e placa serão verificados pela equipe de
        segurança do campus antes da publicação.
      </div>
    </ModalShell>
  );
}
