interface BadgeProps {
  tone: 'red' | 'green' | 'dark';
  label: string;
  prefix?: string;
}

export function Badge({ tone, label, prefix }: BadgeProps) {
  const toneClasses: Record<BadgeProps['tone'], string> = {
    red: 'bg-red-950/60 text-red-400 border border-red-500/20',
    green: 'bg-green-950/60 text-green-400 border border-green-500/20',
    dark: 'bg-black/60 text-gray-200 border border-white/10',
  };

  return (
    <span
      className={`flex items-center gap-1 text-[10px] font-bold tracking-wide px-2 py-1 rounded-md shrink-0 ${toneClasses[tone]}`}>
      {prefix && <span className="text-pink-400">{prefix}</span>}
      {label}
    </span>
  );
}
