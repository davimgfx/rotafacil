export interface FilterTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

export function FilterTab({ label, active, onClick }: FilterTabProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-xs font-medium py-2.5 rounded-xl border transition ${
        active
          ? 'bg-blue-600 border-blue-600 text-white'
          : 'bg-[#16161F] border-white/5 text-gray-300 hover:bg-[#1C1C26]'
      }`}>
      {label}
    </button>
  );
}
