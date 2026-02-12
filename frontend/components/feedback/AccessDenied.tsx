import { Lock } from "lucide-react"

interface AccessDeniedProps {
  title?: string
  description?: string
}

export function AccessDenied({
  title = "Acesso restrito",
  description = "Você não possui permissão para visualizar esta página.",
}: AccessDeniedProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Lock className="h-10 w-10 text-muted-foreground mb-4" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted-foreground mt-2">
        {description}
      </p>
    </div>
  )
}
