import { useState } from 'react';
import { X, Clock, Users, MapPin, AlertTriangle } from 'lucide-react';

interface MonitoramentoAndamentoProps {
  /** Origem da rota */
  origem: string;
  /** Destino da rota */
  destino: string;
  /** ETA em texto, ex: "8 mins (650m)" */
  eta: string;
  /** Lista de participantes visíveis no mapa */
  participantes: number;
  /** Callback ao fechar a tela */
  onClose: () => void;
}

export default function MonitoramentoAndamento({
  origem = 'UFBA',
  destino = 'Biblioteca Central',
  eta = '8 mins (650m)',
  participantes = 0,
  onClose,
}: MonitoramentoAndamentoProps) {
  const [sosAtivo, setSosAtivo] = useState(false);

  const handleSOS = () => setSosAtivo(true);
  const handleFecharSOS = () => setSosAtivo(false);

  return (
    <div className="min-h-screen w-full bg-[#0B0B12] flex justify-center">
      <div
        className={[
          'w-full max-w-sm flex flex-col min-h-screen relative',
          sosAtivo ? 'ring-2 ring-red-500' : '',
        ]
          .filter(Boolean)
          .join(' ')}>
        {/* Borda vermelha pulsante quando SOS ativo */}
        {sosAtivo && (
          <div className="pointer-events-none absolute inset-0 z-50 animate-pulse rounded-none border-4 border-red-500" />
        )}

        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#0E0E16] sticky top-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition"
            aria-label="Fechar">
            <X className="w-4 h-4 text-white/60" />
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <h1 className="text-[15px] font-semibold tracking-wide text-blue-100">
              RotaSegura Uni
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-[10px] font-bold text-green-400 tracking-widest">
                MONITORAMENTO ATIVO
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSOS}
            className="text-red-400 text-sm font-bold font-mono hover:text-red-300 transition">
            SOS
          </button>
        </header>

        {/* Mapa */}
        <div
          className="relative bg-[#111118] overflow-hidden"
          style={{ height: 340 }}>
          <MapaSVG origem={origem} destino={destino} />

          {/* Controles do mapa */}
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            <div className="w-9 h-9 rounded-lg bg-[#14141e]/90 border border-white/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white/50" />
            </div>
            <div className="w-9 h-9 rounded-lg bg-[#14141e]/90 border border-white/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-white/50" />
            </div>
          </div>

          {/* Botão SOS flutuante */}
          <button
            type="button"
            onClick={handleSOS}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[72px] h-[72px] rounded-full bg-red-500 text-white font-black flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-red-500/40 active:scale-95 transition z-10">
            <span className="text-[15px] leading-none tracking-wider">SOS</span>
            <span className="text-[9px] font-semibold opacity-80 tracking-widest">
              SOCORRO
            </span>
          </button>
        </div>

        {/* Participantes */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0E0E16] border-t border-white/5">
          <span className="text-xs text-white/40">
            {participantes} participantes nessa rota
          </span>
        </div>

        {/* Painel de info */}
        <div className="px-4 pt-4 pb-6 bg-[#0B0B12] space-y-3 flex-1">
          <div>
            <h2 className="text-[17px] font-bold leading-tight">
              Monitoramento em Tempo Real
            </h2>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-white/40">
              <Clock className="w-3.5 h-3.5" />
              <span>ETA: {eta}</span>
            </div>
          </div>

          {/* Destino + Check-in */}
          <div className="flex items-center justify-center bg-[#16161F] border border-white/5 rounded-xl px-4 py-3">
            <div>
              <p className="text-[10px] font-semibold text-white/35 tracking-widest uppercase mb-0.5">
                Destination
              </p>
              <p className="text-sm font-semibold">{destino}</p>
            </div>
          </div>
        </div>

        {/* Overlay SOS */}
        {sosAtivo && (
          <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center px-6">
            <div className="bg-[#16161F] border border-red-500/30 rounded-2xl p-7 w-full max-w-xs text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/15 border-2 border-red-500/40 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="text-base font-bold text-red-300 mb-2">
                Alerta SOS Enviado!
              </h3>
              <p className="text-sm text-white/60 leading-relaxed">
                As autoridades competentes foram acionadas, aguarde.
              </p>
              <button
                type="button"
                onClick={handleFecharSOS}
                className="mt-5 w-full py-2.5 rounded-lg bg-white/7 border border-white/10 text-sm text-white hover:bg-white/10 transition">
                Entendido
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Mapa SVG estático simulando o ambiente urbano noturno */
function MapaSVG({ origem, destino }: { origem: string; destino: string }) {
  return (
    <svg
      viewBox="0 0 380 340"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full">
      <rect width="380" height="340" fill="#111118" />

      {/* Vias */}
      <line x1="40" y1="0" x2="40" y2="340" stroke="#1a1a2a" strokeWidth="24" />
      <line
        x1="110"
        y1="0"
        x2="80"
        y2="340"
        stroke="#1a1a2a"
        strokeWidth="18"
      />
      <line
        x1="200"
        y1="0"
        x2="200"
        y2="340"
        stroke="#1a1a2a"
        strokeWidth="30"
      />
      <line
        x1="320"
        y1="0"
        x2="300"
        y2="340"
        stroke="#1a1a2a"
        strokeWidth="20"
      />
      <line
        x1="0"
        y1="80"
        x2="380"
        y2="100"
        stroke="#1a1a2a"
        strokeWidth="22"
      />
      <line
        x1="0"
        y1="160"
        x2="380"
        y2="170"
        stroke="#1a1a2a"
        strokeWidth="28"
      />
      <line
        x1="0"
        y1="250"
        x2="380"
        y2="240"
        stroke="#1a1a2a"
        strokeWidth="18"
      />

      {/* Quadras */}
      <rect x="50" y="110" width="40" height="30" rx="3" fill="#161622" />
      <rect x="100" y="115" width="25" height="25" rx="3" fill="#161622" />
      <rect x="220" y="105" width="50" height="35" rx="3" fill="#161622" />
      <rect x="285" y="110" width="30" height="28" rx="3" fill="#161622" />
      <rect x="55" y="200" width="35" height="28" rx="3" fill="#161622" />
      <rect x="240" y="195" width="45" height="30" rx="3" fill="#161622" />

      {/* Rota tracejada */}
      <line
        x1="185"
        y1="290"
        x2="255"
        y2="68"
        stroke="#2563eb"
        strokeWidth="2"
        strokeDasharray="8,5"
        opacity="0.7"
      />

      {/* Destino */}
      <circle cx="255" cy="60" r="8" fill="#4ade80" opacity="0.9" />
      <text
        x="268"
        y="64"
        fill="#4ade80"
        fontSize="10"
        fontWeight="600"
        opacity="0.8">
        {destino}
      </text>

      {/* Marcador "You" */}
      <rect x="143" y="161" width="44" height="24" rx="6" fill="#2563eb" />
      <text
        x="165"
        y="177"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="white">
        You
      </text>
      <polygon points="165,195 159,189 171,189" fill="#2563eb" />
      <circle
        cx="165"
        cy="205"
        r="10"
        fill="#3b82f6"
        stroke="#1d4ed8"
        strokeWidth="2"
      />

      {/* Origem label */}
      <text x="10" y="330" fill="rgba(255,255,255,0.2)" fontSize="9">
        {origem}
      </text>
    </svg>
  );
}
