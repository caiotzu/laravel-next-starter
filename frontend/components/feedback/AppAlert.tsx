import {
  CheckCircle2,
  CircleX,
  CircleAlert,
  Info,
  X,
} from "lucide-react"

type Variant = "success" | "error" | "warning" | "info"

interface AppAlertProps {
  variant?: Variant
  title?: string
  subtitle?: string
  messages?: string[]
  onClose?: () => void
  className?: string
}

export function AppAlert({
  variant = "info",
  title,
  subtitle,
  messages,
  onClose,
  className = "",
}: AppAlertProps) {
  const variants = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
      headerClass: "text-emerald-700 dark:text-emerald-400",
      cardClass: "bg-emerald-50 border-emerald-200 dark:bg-zinc-900 dark:border-zinc-800",
      accentClass: "border-l-4 border-emerald-500 dark:border-emerald-500",
      defaultTitle: "Sucesso",
    },

    error: {
      icon: <CircleX className="h-5 w-5 text-red-600 dark:text-red-400" />,
      headerClass: "text-red-700 dark:text-red-400",
      cardClass: "bg-red-50 border-red-200 dark:bg-zinc-900 dark:border-zinc-800",
      accentClass: "border-l-4 border-red-500 dark:border-red-500",
      defaultTitle: "Erro",
    },

    warning: {
      icon: <CircleAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />,
      headerClass: "text-amber-700 dark:text-amber-400",
      cardClass: "bg-amber-50 border-amber-200 dark:bg-zinc-900 dark:border-zinc-800",
      accentClass: "border-l-4 border-amber-500 dark:border-amber-500",
      defaultTitle: "Atenção",
    },

    info: {
      icon: <Info className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />,
      headerClass: "text-indigo-700 dark:text-indigo-400",
      cardClass: "bg-indigo-50 border-indigo-200 dark:bg-zinc-900 dark:border-zinc-800",
      accentClass: "border-l-4 border-indigo-500 dark:border-indigo-500",
      defaultTitle: "Informação",
    },
  }

  const current = variants[variant]

  return (
    <div
      className={`w-full rounded-xl shadow-sm overflow-hidden ${current.cardClass} ${current.accentClass} ${className}`}
    >
      {/* HEADER */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {current.icon}

            <div>
              <h3 className={`font-semibold ${current.headerClass}`}>
                {title ?? current.defaultTitle}
              </h3>

              {subtitle && (
                <p className="text-xs opacity-80 mt-1">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className={`p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition cursor-pointer`}
              aria-label="Fechar alerta"
            >
              <X className={`h-4 w-4 ${current.headerClass}`} />
            </button>
          )}
        </div>
      </div>

      {messages?.length ? (
        <div className="px-5 py-4 text-sm text-zinc-700 dark:text-zinc-300 space-y-3">
          <ul className="list-disc list-inside space-y-1">
            {messages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
