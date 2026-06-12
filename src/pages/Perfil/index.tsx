import { useCallback, useEffect, useState } from 'react';
import {
  User,
  LogOut,
  Footprints,
  Car,
  Clock,
  MapPin,
  ChevronRight,
} from 'lucide-react';

import { BottomNav } from '../../components/BottomNav';
import { supabase } from '../../lib/supabase';
import { getUsuarioId } from '../../lib/auth';
import type { Bonde, Carona } from '../../types';

// ── tipos locais ──────────────────────────────────────────────
interface Usuario {
  id: string;
  nome_cliente: string;
  email: string;
}

type HistoricoTab = 'bondes' | 'caronas';

// ── helpers ───────────────────────────────────────────────────
function formatHora(hhmmss: string) {
  return hhmmss?.slice(0, 5) ?? '';
}

function formatData(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    encerrado: { label: 'ENCERRADO', cls: 'bg-gray-600/60 text-gray-300' },
    cancelado: { label: 'CANCELADO', cls: 'bg-red-600/40 text-red-300' },
    em_andamento: {
      label: 'EM ANDAMENTO',
      cls: 'bg-amber-600/40 text-amber-300',
    },
    ativo: { label: 'ATIVO', cls: 'bg-green-600/80 text-white' },
    agendado: { label: 'AGENDADO', cls: 'bg-white/10 text-gray-300' },
  };
  const { label, cls } = map[status] ?? {
    label: status.toUpperCase(),
    cls: 'bg-white/10 text-gray-300',
  };
  return (
    <span
      className={`text-[10px] font-bold tracking-wide px-2 py-1 rounded-md shrink-0 ${cls}`}>
      {label}
    </span>
  );
}

// ── Avatar genérico ───────────────────────────────────────────
function Avatar({ nome_cliente }: { nome_cliente: string }) {
  const initials = nome_cliente
    .split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="w-20 h-20 rounded-full bg-blue-500/20 border-2 border-blue-500/40 flex items-center justify-center shrink-0">
      <span className="text-2xl font-bold text-blue-300">{initials}</span>
    </div>
  );
}

// ── Card Bonde ────────────────────────────────────────────────
function BondeCard({ bonde }: { bonde: Bonde }) {
  return (
    <div className="bg-[#16161F] border border-white/5 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
          <Footprints className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm leading-snug">
              {bonde.origem} → {bonde.destino}
            </h4>
            <StatusBadge status={bonde.status} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatHora(bonde.horario_saida)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {bonde.destino}
            </span>
            <span className="ml-auto text-gray-600">
              {formatData(bonde.created_at)}
            </span>
          </div>
          {bonde.observacoes && (
            <p className="text-xs text-gray-500 mt-1.5 truncate">
              {bonde.observacoes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card Carona ───────────────────────────────────────────────
function CaronaCard({ carona }: { carona: Carona }) {
  return (
    <div className="bg-[#16161F] border border-white/5 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-gray-300" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-semibold text-sm leading-snug">
              {carona.origem} → {carona.destino}
            </h4>
            <StatusBadge status={carona.status} />
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formatHora(carona.horario)}
            </span>
            <span className="flex items-center gap-1">
              <Car className="w-3.5 h-3.5" />
              {carona.veiculo}
            </span>
            <span className="ml-auto text-gray-600">
              {formatData(carona.created_at)}
            </span>
          </div>
          {carona.observacoes && (
            <p className="text-xs text-gray-500 mt-1.5 truncate">
              {carona.observacoes}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────
export function Perfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [bondes, setBondes] = useState<Bonde[]>([]);
  const [caronas, setCaronas] = useState<Carona[]>([]);
  const [tab, setTab] = useState<HistoricoTab>('bondes');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setErro(null);

    const userId = getUsuarioId();
    if (!userId) {
      setErro('Nenhum usuário autenticado.');
      setLoading(false);
      return;
    }

    try {
      const [
        { data: userData, error: userErr },
        { data: bondesData, error: bondesErr },
        { data: caronasData, error: caronasErr },
      ] = await Promise.all([
        supabase
          .from('usuarios')
          .select('id, nome_cliente, email')
          .eq('id', userId)
          .single(),
        supabase
          .from('bondes')
          .select('*')
          .eq('criador_id', userId)
          .in('status', ['encerrado', 'cancelado', 'em_andamento'])
          .order('created_at', { ascending: false }),
        supabase
          .from('caronas')
          .select('*')
          .eq('motorista_id', userId)
          .in('status', ['encerrado', 'cancelado', 'em_andamento'])
          .order('created_at', { ascending: false }),
      ]);

      if (userErr) throw userErr;
      if (bondesErr) throw bondesErr;
      if (caronasErr) throw caronasErr;

      setUsuario(userData);
      setBondes(bondesData ?? []);
      setCaronas(caronasData ?? []);
    } catch (e: any) {
      setErro(e.message ?? 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function handleSair() {
    localStorage.removeItem('user_id');
    window.location.href = '/';
  }

  // ── Estados de carga / erro ───────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0B0B12] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500">Carregando perfil…</span>
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="min-h-screen w-full bg-[#0B0B12] flex items-center justify-center px-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center max-w-xs">
          <p className="text-sm text-red-300 mb-4">{erro}</p>
          <a href="/login" className="text-blue-400 text-sm underline">
            Ir para login
          </a>
        </div>
      </div>
    );
  }

  const listaVazia =
    tab === 'bondes' ? bondes.length === 0 : caronas.length === 0;

  return (
    <div className="min-h-screen w-full bg-[#0B0B12] text-white flex justify-center">
      <div className="w-full max-w-sm flex flex-col min-h-screen relative">
        {/* ── Header ── */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0E0E16] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h1 className="text-[15px] font-semibold tracking-wide text-blue-100">
              RotaSegura Uni
            </h1>
          </div>
          <span className="text-blue-400 text-sm font-mono">SOS</span>
        </header>

        {/* ── Scroll area ── */}
        <main className="flex-1 overflow-y-auto px-4 pt-6 pb-24 space-y-5">
          {/* ── Card de perfil ── */}
          <section className="bg-[#16161F] border border-white/5 rounded-xl p-5 flex flex-col items-center gap-3">
            {usuario ? (
              <Avatar nome_cliente={usuario.nome_cliente} />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
            <div className="text-center">
              <p className="font-bold text-base">
                {usuario?.nome_cliente ?? '—'}
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                {usuario?.email ?? '—'}
              </p>
            </div>
          </section>
          {/* ── Sair ── */}
          <section>
            <button
              type="button"
              onClick={handleSair}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 active:scale-[0.99] transition">
              <div className="flex items-center gap-3">
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Sair da conta</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-40" />
            </button>
          </section>

          {/* ── Histórico ── */}
          <section>
            <h3 className="font-semibold text-base mb-3">Histórico</h3>

            {/* Tabs */}
            <div className="flex bg-[#16161F] border border-white/5 rounded-xl p-1 mb-4">
              {(['bondes', 'caronas'] as HistoricoTab[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    tab === t
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}>
                  {t === 'bondes' ? 'Meus Bondes' : 'Minhas Caronas'}
                </button>
              ))}
            </div>

            {/* Lista */}
            {listaVazia ? (
              <div className="bg-[#16161F] border border-white/5 rounded-xl p-8 text-center">
                {tab === 'bondes' ? (
                  <Footprints className="w-9 h-9 text-gray-700 mx-auto mb-3" />
                ) : (
                  <Car className="w-9 h-9 text-gray-700 mx-auto mb-3" />
                )}
                <p className="text-sm text-gray-500">
                  Nenhum histórico de {tab === 'bondes' ? 'bondes' : 'caronas'}{' '}
                  ainda.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {tab === 'bondes'
                  ? bondes.map((b) => <BondeCard key={b.id} bonde={b} />)
                  : caronas.map((c) => <CaronaCard key={c.id} carona={c} />)}
              </div>
            )}
          </section>
        </main>

        {/* ── Bottom nav ── */}
        <BottomNav />
      </div>
    </div>
  );
}
