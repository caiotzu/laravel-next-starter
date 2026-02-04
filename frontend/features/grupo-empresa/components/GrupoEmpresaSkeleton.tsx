export function GrupoEmpresasSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="h-12 w-full animate-pulse rounded-lg bg-gray-200"
        />
      ))}
    </div>
  );
}
