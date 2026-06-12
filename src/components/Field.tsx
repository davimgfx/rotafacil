interface FieldProps {
  label: string;
  children: React.ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-gray-400 mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}
