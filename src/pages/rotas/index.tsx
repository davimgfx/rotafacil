import { useCallback, useEffect, useState } from 'react';
import {
  Shield,
  Clock,
  Users,
  MapPin,
  Footprints,
  Car,
  User,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { getUsuarioId } from '../../lib/auth';
import type { Bonde, Carona } from '../../types';
import { BottomNav } from '../../components/BottomNav';
import { Badge } from '../../components/Badge';
import { Toggle } from '../../components/Toggle';
import { FilterTab } from '../../components/FilterTab';
import MonitoramentoAndamento from '../../components/MonitoramentoAndamento';

type FilterKey = 'todos' | 'bondes' | 'caronas';

// Qual rota está aberta no modal de monitoramento
interface RotaAberta {
  id: string;
  origem: string;
  destino: string;
}

function formatHora(hhmmss: string) {
  return hhmmss?.slice(0, 5) ?? '';
}

export default function Rotas() {
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [womenOnly, setWomenOnly] = useState(false);

  const [bondesAndamento, setBondesAndamento] = useState<Bonde[]>([]);
  const [caronasAndamento, setCaronasAndamento] = useState<Carona[]>([]);

  // Guarda os dados da rota aberta, não só o id
  const [rotaAberta, setRotaAberta] = useState<RotaAberta | null>(null);

  const [bondes, setBondes] = useState<Bonde[]>([]);
  const [caronas, setCaronas] = useState<Carona[]>([]);
  const [bondesParticipando, setBondesParticipando] = useState<Set<string>>(
    new Set()
  );
  const [caronasParticipando, setCaronasParticipando] = useState<Set<string>>(
    new Set()
  );

  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const usuarioId = getUsuarioId();

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [
      { data: bondesData },
      { data: caronasData },
      participacoesBondes,
      participacoesCaronas,
    ] = await Promise.all([
      supabase
        .from('bondes')
        .select('*')
        .eq('status', 'ativo')
        .order('horario_saida', { ascending: true }),
      supabase
        .from('caronas')
        .select('*')
        .eq('status', 'agendado')
        .order('horario', { ascending: true }),
      usuarioId
        ? supabase
            .from('bonde_participantes')
            .select('bonde_id')
            .eq('user_id', usuarioId)
        : Promise.resolve({ data: [] as { bonde_id: string }[] }),
      usuarioId
        ? supabase
            .from('carona_passageiros')
            .select('carona_id')
            .eq('user_id', usuarioId)
        : Promise.resolve({ data: [] as { carona_id: string }[] }),
    ]);

    setBondes(bondesData ?? []);
    setCaronas(caronasData ?? []);
    setBondesParticipando(
      new Set((participacoesBondes.data ?? []).map((p) => p.bonde_id))
    );
    setCaronasParticipando(
      new Set((participacoesCaronas.data ?? []).map((p) => p.carona_id))
    );

    setLoading(false);
  }, [usuarioId]);

  const fetchAndamento = useCallback(async () => {
    if (!usuarioId) {
      setBondesAndamento([]);
      setCaronasAndamento([]);
      return;
    }

    const [{ data: participaBondes }, { data: participaCaronas }] =
      await Promise.all([
        supabase
          .from('bonde_participantes')
          .select('bonde_id')
          .eq('user_id', usuarioId),
        supabase
          .from('carona_passageiros')
          .select('carona_id')
          .eq('user_id', usuarioId),
      ]);

    const bondeIds = (participaBondes ?? []).map((p) => p.bonde_id);
    const caronaIds = (participaCaronas ?? []).map((p) => p.carona_id);

    const bondeFilter = bondeIds.length
      ? `criador_id.eq.${usuarioId},id.in.(${bondeIds.join(',')})`
      : `criador_id.eq.${usuarioId}`;

    const caronaFilter = caronaIds.length
      ? `motorista_id.eq.${usuarioId},id.in.(${caronaIds.join(',')})`
      : `motorista_id.eq.${usuarioId}`;

    const [{ data: bondesData }, { data: caronasData }] = await Promise.all([
      supabase
        .from('bondes')
        .select('*')
        .eq('status', 'em_andamento')
        .or(bondeFilter)
        .order('horario_saida', { ascending: true }),
      supabase
        .from('caronas')
        .select('*')
        .eq('status', 'em_andamento')
        .or(caronaFilter)
        .order('horario', { ascending: true }),
    ]);

    setBondesAndamento(bondesData ?? []);
    setCaronasAndamento(caronasData ?? []);
  }, [usuarioId]);

  const fetchAll = useCallback(async () => {
    await Promise.all([fetchData(), fetchAndamento()]);
  }, [fetchData, fetchAndamento]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleEntrarBonde = async (bondeId: string) => {
    if (!usuarioId) {
      setActionError('Você precisa estar logado.');
      return;
    }

    setActionError(null);
    setPendingId(bondeId);

    const { error } = await supabase.rpc('entrar_bonde', {
      p_bonde_id: bondeId,
      p_user_id: usuarioId,
    });

    setPendingId(null);

    if (error) {
      setActionError(error.message ?? 'Não foi possível entrar no bonde.');
      return;
    }

    fetchAll();
  };

  const handleSolicitarCarona = async (caronaId: string) => {
    if (!usuarioId) {
      setActionError('Você precisa estar logado.');
      return;
    }

    setActionError(null);
    setPendingId(caronaId);

    const { error } = await supabase.rpc('solicitar_carona', {
      p_carona_id: caronaId,
      p_user_id: usuarioId,
    });

    setPendingId(null);

    if (error) {
      setActionError(error.message ?? 'Não foi possível solicitar a vaga.');
      return;
    }

    fetchAll();
  };

  const handleEncerrarBonde = async (e: React.MouseEvent, bondeId: string) => {
    // Impede que o clique propague para o div pai e abra o modal
    e.stopPropagation();

    setActionError(null);
    setPendingId(bondeId);

    const { error } = await supabase
      .from('bondes')
      .update({ status: 'encerrado' })
      .eq('id', bondeId);

    setPendingId(null);

    if (error) {
      setActionError('Não foi possível encerrar o bonde.');
      return;
    }

    fetchAll();
  };

  const handleEncerrarCarona = async (
    e: React.MouseEvent,
    caronaId: string
  ) => {
    // Impede que o clique propague para o div pai e abra o modal
    e.stopPropagation();

    setActionError(null);
    setPendingId(caronaId);

    const { error } = await supabase
      .from('caronas')
      .update({ status: 'encerrado' })
      .eq('id', caronaId);

    setPendingId(null);

    if (error) {
      setActionError('Não foi possível encerrar a carona.');
      return;
    }

    fetchAll();
  };

  const temAndamento =
    bondesAndamento.length > 0 || caronasAndamento.length > 0;

  const bondesFiltrados = bondes.filter((b) => {
    if (filter === 'caronas') return false;
    if (womenOnly && !b.apenas_mulheres) return false;
    return true;
  });

  const caronasFiltradas = caronas.filter((c) => {
    if (filter === 'bondes') return false;
    if (womenOnly && !c.apenas_mulheres) return false;
    return true;
  });

  const semResultados =
    !loading && bondesFiltrados.length === 0 && caronasFiltradas.length === 0;

  return (
    <div className="min-h-screen w-full bg-[#0B0B12] text-white flex justify-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0E0E16] sticky top-0 z-10">
          <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center">
            <Shield className="w-4 h-4 text-blue-400" />
          </div>
          <h1 className="text-[15px] font-semibold tracking-wide text-blue-100">
            RotaSegura Uni
          </h1>
          <span className="text-blue-400 text-sm font-mono">SOS</span>
        </header>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-24 space-y-4">
          {/* Title */}
          <section>
            <h2 className="text-2xl font-bold leading-tight">Explorar Rotas</h2>
            <p className="text-sm text-gray-400 mt-1">
              Encontre 'Bondes' (a pé) ou 'Caronas' seguras.
            </p>
          </section>

          {actionError && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300">
              {actionError}
            </div>
          )}

          {/* Em andamento */}
          {temAndamento && (
            <section className="space-y-3">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Em Andamento
              </h3>

              {bondesAndamento.map((bonde) => {
                const isCriador = bonde.criador_id === usuarioId;
                return (
                  <div
                    key={bonde.id}
                    className="bg-[#16161F] border border-amber-500/20 rounded-xl p-4 cursor-pointer"
                    onClick={() =>
                      setRotaAberta({
                        id: bonde.id,
                        origem: bonde.origem,
                        destino: bonde.destino,
                      })
                    }>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                        <Footprints className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm leading-snug">
                            {bonde.origem} para {bonde.destino}
                          </h4>
                          <span className="bg-amber-500/15 text-amber-400 text-[10px] font-bold tracking-wide px-2 py-1 rounded-md shrink-0">
                            EM ANDAMENTO
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{' '}
                            {formatHora(bonde.horario_saida)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />{' '}
                            {bonde.vagas_ocupadas}/{bonde.vagas_total}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" /> {bonde.destino}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isCriador ? (
                      <button
                        type="button"
                        disabled={pendingId === bonde.id}
                        // e.stopPropagation() evita abrir o modal ao encerrar
                        onClick={(e) => handleEncerrarBonde(e, bonde.id)}
                        className="w-full mt-3 py-2.5 rounded-lg border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        {pendingId === bonde.id
                          ? 'Encerrando...'
                          : 'Encerrar Bonde'}
                      </button>
                    ) : (
                      <div className="w-full mt-3 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        Você está participando
                      </div>
                    )}
                  </div>
                );
              })}

              {caronasAndamento.map((carona) => {
                const isMotorista = carona.motorista_id === usuarioId;
                return (
                  <div
                    key={carona.id}
                    className="bg-[#16161F] border border-amber-500/20 rounded-xl p-4 cursor-pointer"
                    onClick={() =>
                      setRotaAberta({
                        id: carona.id,
                        origem: carona.origem,
                        destino: carona.destino,
                      })
                    }>
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-amber-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm leading-snug">
                            {carona.origem} para {carona.destino}
                          </h4>
                          <span className="bg-amber-500/15 text-amber-400 text-[10px] font-bold tracking-wide px-2 py-1 rounded-md shrink-0">
                            EM ANDAMENTO
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{' '}
                            {formatHora(carona.horario)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />{' '}
                            {carona.vagas_ocupadas}/{carona.vagas_total}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {carona.veiculo}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isMotorista ? (
                      <button
                        type="button"
                        disabled={pendingId === carona.id}
                        // e.stopPropagation() evita abrir o modal ao encerrar
                        onClick={(e) => handleEncerrarCarona(e, carona.id)}
                        className="w-full mt-3 py-2.5 rounded-lg border border-red-500/40 text-red-400 text-sm font-medium hover:bg-red-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        {pendingId === carona.id
                          ? 'Encerrando...'
                          : 'Encerrar Carona'}
                      </button>
                    ) : (
                      <div className="w-full mt-3 py-2.5 rounded-lg border border-white/10 text-gray-400 text-sm font-medium flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-400" />
                        Você está participando
                      </div>
                    )}
                  </div>
                );
              })}
            </section>
          )}

          {/* Filter tabs */}
          <section className="grid grid-cols-3 gap-2">
            <FilterTab
              label="Todos"
              active={filter === 'todos'}
              onClick={() => setFilter('todos')}
            />
            <FilterTab
              label="Bondes (A pé)"
              active={filter === 'bondes'}
              onClick={() => setFilter('bondes')}
            />
            <FilterTab
              label="Caronas"
              active={filter === 'caronas'}
              onClick={() => setFilter('caronas')}
            />
          </section>

          {/* Women-only toggle */}
          <section className="bg-[#16161F] border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-pink-400 text-base leading-none">♀</span>
              <span className="text-sm font-medium">Apenas Mulheres</span>
            </div>
            <Toggle checked={womenOnly} onChange={setWomenOnly} />
          </section>

          {/* Lista dinâmica */}
          <section className="space-y-3">
            {loading && (
              <p className="text-sm text-gray-500 text-center py-6">
                Carregando...
              </p>
            )}

            {semResultados && (
              <div className="text-center text-sm text-gray-500 py-10">
                Nenhuma rota encontrada com esses filtros.
              </div>
            )}

            {/* Bondes */}
            {bondesFiltrados.map((bonde) => {
              const vagasRestantes = bonde.vagas_total - bonde.vagas_ocupadas;
              const cheio = vagasRestantes <= 0;
              const isCriador = bonde.criador_id === usuarioId;
              const jaParticipa = bondesParticipando.has(bonde.id);

              let label = 'Juntar-se';
              if (pendingId === bonde.id) {
                label = 'Entrando...';
              } else if (isCriador) {
                label = 'Seu bonde';
              } else if (jaParticipa) {
                label = 'Já participa';
              } else if (cheio) {
                label = 'Cheio';
              }

              const disabled =
                cheio || isCriador || jaParticipa || pendingId === bonde.id;

              return (
                <div
                  key={bonde.id}
                  className="bg-[#16161F] border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                        <Footprints className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-sm leading-snug pt-1.5">
                        Bonde: {bonde.origem} → {bonde.destino}
                      </h3>
                    </div>
                    {!cheio && <Badge tone="green" label="ATIVO AGORA" />}
                  </div>

                  {bonde.apenas_mulheres && (
                    <div className="flex justify-end mb-2">
                      <Badge tone="dark" label="SÓ MULHERES" prefix="♀" />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-12 mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatHora(bonde.horario_saida)}</span>
                  </div>

                  <div className="flex items-center justify-between ml-12 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {bonde.vagas_ocupadas}/{bonde.vagas_total} Pessoas
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{bonde.destino}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/5">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleEntrarBonde(bonde.id)}
                      className="text-blue-400 text-sm font-medium hover:text-blue-300 transition disabled:text-gray-500 disabled:cursor-not-allowed">
                      {label}
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Caronas */}
            {caronasFiltradas.map((carona) => {
              const vagasRestantes = carona.vagas_total - carona.vagas_ocupadas;
              const cheio = vagasRestantes <= 0;
              const isMotorista = carona.motorista_id === usuarioId;
              const jaParticipa = caronasParticipando.has(carona.id);

              let label = 'Juntar-se';
              if (pendingId === carona.id) {
                label = 'Solicitando...';
              } else if (isMotorista) {
                label = 'Sua carona';
              } else if (jaParticipa) {
                label = 'Já participa';
              } else if (cheio) {
                label = 'Cheio';
              }

              const disabled =
                cheio || isMotorista || jaParticipa || pendingId === carona.id;

              return (
                <div
                  key={carona.id}
                  className="bg-[#16161F] border border-white/5 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="font-semibold text-sm leading-snug pt-1.5">
                        Carona: {carona.origem} → {carona.destino}
                      </h3>
                    </div>
                    {cheio && <Badge tone="dark" label="LOTAÇÃO MÁXIMA" />}
                  </div>

                  {carona.apenas_mulheres && (
                    <div className="flex justify-end mb-2">
                      <Badge tone="dark" label="SÓ MULHERES" prefix="♀" />
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-xs text-gray-400 ml-12 mb-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatHora(carona.horario)}</span>
                  </div>

                  <div className="flex items-center justify-between ml-12 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>
                        {carona.vagas_ocupadas}/{carona.vagas_total} Vagas
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{carona.veiculo}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end mt-3 pt-3 border-t border-white/5">
                    {disabled ? (
                      <span className="text-gray-500 text-sm font-medium">
                        {label}
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSolicitarCarona(carona.id)}
                        className="text-blue-400 text-sm font-medium hover:text-blue-300 transition">
                        {label}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        </main>

        {/* Bottom nav */}
        <BottomNav />
      </div>

      {/* Modal de monitoramento — fora do scroll, renderiza uma única vez */}
      {rotaAberta && (
        <div className="fixed inset-0 z-50">
          <MonitoramentoAndamento
            origem={rotaAberta.origem}
            destino={rotaAberta.destino}
            eta="8 mins (650m)"
            onClose={() => setRotaAberta(null)}
          />
        </div>
      )}
    </div>
  );
}
