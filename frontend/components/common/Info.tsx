interface InfoProps {
  label: string;
  value: string | number;
  subValue?: string;
}

export function Info({ label, value, subValue }: InfoProps) {
  return (
    <div className="text-sm">
      <p className="font-medium text-foreground">{label}</p>

      <p className="text-muted-foreground">{value}</p>

      {subValue && (
        <p className="text-xs text-muted-foreground/80">
          {subValue}
        </p>
      )}
    </div>
  );
}