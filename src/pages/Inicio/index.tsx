import { useCallback, useEffect, useState } from 'react';

import {
  MapPin,
  Search,
  UserPlus,
  Car,
  User,
  Clock,
  Footprints,
  Lock,
} from 'lucide-react';
import { CriarBondeModal } from '../../components/CriarbondeModal';
import { OferecerCaronaModal } from '../../components/OferecerCaronaModal';
import { supabase } from '../../lib/supabase';
import type { Bonde, Carona } from '../../types';
import { getUsuarioId } from '../../lib/auth';
import { BottomNav } from '../../components/BottomNav';

function formatHora(hhmmss: string) {
  return hhmmss?.slice(0, 5) ?? '';
}

export function Inicio() {
  const [bondeModalOpen, setBondeModalOpen] = useState(false);
  const [caronaModalOpen, setCaronaModalOpen] = useState(false);

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

  const fetchData = useCallback(async () => {
    setLoading(true);

    const usuarioId = getUsuarioId();

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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEntrarBonde = async (bondeId: string) => {
    const usuarioId = getUsuarioId();
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

    fetchData();
  };

  const handleSolicitarCarona = async (caronaId: string) => {
    const usuarioId = getUsuarioId();
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

    fetchData();
  };

  const handleFecharBonde = async (bondeId: string) => {
    setActionError(null);
    setPendingId(bondeId);

    const { error } = await supabase
      .from('bondes')
      .update({ status: 'em_andamento' })
      .eq('id', bondeId);

    setPendingId(null);

    if (error) {
      setActionError('Não foi possível fechar o bonde.');
      return;
    }

    fetchData();
  };

  const handleFecharCarona = async (caronaId: string) => {
    setActionError(null);
    setPendingId(caronaId);

    const { error } = await supabase
      .from('caronas')
      .update({ status: 'em_andamento' })
      .eq('id', caronaId);

    setPendingId(null);

    if (error) {
      setActionError('Não foi possível fechar a carona.');
      return;
    }

    fetchData();
  };

  const usuarioIdAtual = getUsuarioId();

  return (
    <div className="min-h-screen w-full bg-[#0B0B12] text-white flex justify-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen relative">
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0E0E16] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h1 className="text-[15px] font-semibold tracking-wide text-blue-100">
              RotaSegura Uni
            </h1>
          </div>
          <span className="text-blue-400 text-sm font-mono">SOS</span>
        </header>

        {/* Main scroll area */}
        <main className="flex-1 overflow-y-auto px-4 pt-5 pb-24 space-y-5">
          {/* Greeting + search */}
          <section>
            <h2 className="text-2xl font-bold leading-tight">
              Para onde vamos?
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Encontre uma rota segura ou um grupo.
            </p>
            <div className="mt-4 relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar destinos (ex: Campus Central)..."
                className="w-full bg-[#16161F] border border-white/5 rounded-xl py-3 pl-10 pr-3 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </section>

          {/* Action cards */}
          <section className="space-y-3">
            <button
              type="button"
              onClick={() => setBondeModalOpen(true)}
              className="w-full text-left bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition rounded-xl p-4 flex items-center justify-between shadow-lg shadow-blue-600/20">
              <div>
                <h3 className="font-semibold text-base">Criar Bonde</h3>
                <p className="text-xs text-blue-100/80 mt-1">
                  Inicie um grupo de caminhada.
                </p>
              </div>
              <UserPlus className="w-7 h-7 text-white/90 shrink-0" />
            </button>

            <button
              type="button"
              onClick={() => setCaronaModalOpen(true)}
              className="w-full text-left bg-[#1C1C26] hover:bg-[#22222E] active:scale-[0.99] transition rounded-xl p-4 flex items-center justify-between border border-white/5">
              <div>
                <h3 className="font-semibold text-base">Oferecer Carona</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Compartilhe uma carona com segurança.
                </p>
              </div>
              <Car className="w-7 h-7 text-gray-300 shrink-0" />
            </button>
          </section>

          {/* Nearby safety */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-base">
                Segurança Próximo a Você
              </h3>
            </div>

            {actionError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-xs text-red-300 mb-3">
                {actionError}
              </div>
            )}

            {loading && (
              <p className="text-sm text-gray-500 text-center py-6">
                Carregando...
              </p>
            )}

            {!loading && bondes.length === 0 && caronas.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">
                Nenhum bonde ou carona ativos por aqui ainda.
              </p>
            )}

            <div className="space-y-3">
              {/* Bondes */}
              {bondes.map((bonde) => {
                const vagasRestantes = bonde.vagas_total - bonde.vagas_ocupadas;
                const cheio = vagasRestantes <= 0;
                const isCriador = bonde.criador_id === usuarioIdAtual;
                const jaParticipa = bondesParticipando.has(bonde.id);

                let label = 'Entrar no Bonde';
                if (pendingId === bonde.id) {
                  label = 'Entrando...';
                } else if (isCriador) {
                  label = 'Você criou este bonde';
                } else if (jaParticipa) {
                  label = 'Você já está no bonde';
                } else if (cheio) {
                  label = 'Bonde Completo';
                }

                return (
                  <div
                    key={bonde.id}
                    className="bg-[#16161F] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                        <Footprints className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm leading-snug">
                            {bonde.origem} para {bonde.destino}
                          </h4>
                          <span className="bg-green-600/90 text-[10px] font-bold tracking-wide px-2 py-1 rounded-md text-center leading-tight shrink-0">
                            ATIVO
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {cheio
                            ? 'Grupo completo.'
                            : `${vagasRestantes} vaga(s) disponível(is) no bonde.`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{' '}
                            {formatHora(bonde.horario_saida)}
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
                        onClick={() => handleFecharBonde(bonde.id)}
                        className="w-full mt-3 py-2.5 rounded-lg border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        {pendingId === bonde.id
                          ? 'Fechando...'
                          : 'Fechar Bonde'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          cheio || jaParticipa || pendingId === bonde.id
                        }
                        onClick={() => handleEntrarBonde(bonde.id)}
                        className="w-full mt-3 py-2.5 rounded-lg border border-blue-500/40 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed">
                        {label}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Caronas */}
              {caronas.map((carona) => {
                const vagasRestantes =
                  carona.vagas_total - carona.vagas_ocupadas;
                const cheio = vagasRestantes <= 0;
                const isMotorista = carona.motorista_id === usuarioIdAtual;
                const jaParticipa = caronasParticipando.has(carona.id);

                let label = 'Solicitar Vaga';
                if (pendingId === carona.id) {
                  label = 'Solicitando...';
                } else if (isMotorista) {
                  label = 'Você ofereceu esta carona';
                } else if (jaParticipa) {
                  label = 'Você já está na carona';
                } else if (cheio) {
                  label = 'Carona Completa';
                }

                return (
                  <div
                    key={carona.id}
                    className="bg-[#16161F] border border-white/5 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Car className="w-5 h-5 text-gray-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm leading-snug">
                            {carona.origem} para {carona.destino}
                          </h4>
                          <span className="bg-white/10 text-gray-300 text-[10px] font-bold tracking-wide px-2 py-1 rounded-md shrink-0">
                            AGENDADO
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5">
                          {cheio
                            ? 'Carona completa.'
                            : `Carona disponível. ${vagasRestantes} vaga(s) restante(s).`}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />{' '}
                            {formatHora(carona.horario)}
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
                        onClick={() => handleFecharCarona(carona.id)}
                        className="w-full mt-3 py-2.5 rounded-lg border border-amber-500/40 text-amber-400 text-sm font-medium hover:bg-amber-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" />
                        {pendingId === carona.id
                          ? 'Fechando...'
                          : 'Fechar Carona'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          cheio || jaParticipa || pendingId === carona.id
                        }
                        onClick={() => handleSolicitarCarona(carona.id)}
                        className="w-full mt-3 py-2.5 rounded-lg border border-blue-500/40 text-blue-400 text-sm font-medium hover:bg-blue-500/10 transition disabled:opacity-40 disabled:cursor-not-allowed">
                        {label}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        {/* Bottom nav */}
        <BottomNav />

        {/* Modals */}
        {bondeModalOpen && (
          <CriarBondeModal
            onClose={() => setBondeModalOpen(false)}
            onCreated={fetchData}
          />
        )}
        {caronaModalOpen && (
          <OferecerCaronaModal
            onClose={() => setCaronaModalOpen(false)}
            onCreated={fetchData}
          />
        )}
      </div>
    </div>
  );
}
