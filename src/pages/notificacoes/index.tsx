import { Shield, Bell } from 'lucide-react';
import { BottomNav } from '../../components/BottomNav';

export default function Notificacoes() {
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
          <section className="flex items-center justify-between">
            <h2 className="text-2xl font-bold leading-tight">Notificações</h2>
            <button
              type="button"
              className="text-blue-400 text-sm font-medium hover:text-blue-300 transition">
              Marcar como lidas
            </button>
          </section>

          {/* Empty state */}
          <section className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
              <Bell className="w-6 h-6 text-gray-500" />
            </div>
            <p className="text-sm text-gray-500">
              Você não tem notificações por aqui ainda.
            </p>
          </section>
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
