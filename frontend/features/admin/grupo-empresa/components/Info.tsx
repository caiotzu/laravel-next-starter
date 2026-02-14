interface InfoProps {
  label: string;
  value: string | number;
}

export function Info({ label, value }: InfoProps) {
  return (
    <div>
      <p className="font-medium text-black">{label}</p>
      <p className="text-muted-foreground">{value}</p>
    </div>
  );
}
