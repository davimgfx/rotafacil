import { X, type LucideIcon } from "lucide-react";

interface ModalShellProps {
  title: string;
  icon: LucideIcon;
  accent: string;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel: string;
  children: React.ReactNode;
}

export function ModalShell({
  title,
  icon: Icon,
  accent,
  onClose,
  onSubmit,
  submitLabel,
  children,
}: ModalShellProps) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div className="relative w-full max-w-sm bg-[#14141C] rounded-t-2xl border-t border-white/10 max-h-[88%] flex flex-col animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/5">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${accent}`}>
              <Icon className="w-5 h-5" />
            </div>
            <h2 className="text-base font-semibold">{title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            onSubmit?.();
          }}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {children}
        </form>

        <div className="px-5 py-4 border-t border-white/5 bg-[#14141C]">
          <button
            type="button"
            onClick={onSubmit}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] transition font-semibold text-sm">
            {submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
