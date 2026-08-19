"use client"

import { Wrench, LogOut } from "lucide-react"

import { useAcessoSuporte } from "@/app/admin/providers/acesso-suporte-provider"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function formatarContagem(segundos: number): string {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60

  const par = (n: number) => n.toString().padStart(2, "0")

  return h > 0 ? `${par(h)}:${par(m)}:${par(s)}` : `${par(m)}:${par(s)}`
}

/**
 * Indicação permanente, no header, de que o Admin está atuando em nome de
 * um cliente através de um Acesso de Suporte. Some sozinha quando o acesso
 * é encerrado/expira — nunca é possível "esquecer" que está ativa, já que
 * fica no topo de toda tela da área Admin.
 */
export function SupportModeBanner() {
  const {
    acessoSuporteAtivo,
    segundosRestantes,
    sairModoSuporte,
  } = useAcessoSuporte()

  if (!acessoSuporteAtivo || segundosRestantes === null) {
    return null
  }

  const expirandoEmBreve = segundosRestantes <= 60

  return (
    <div className="flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-1.5">
      <Wrench className="h-4 w-4 text-amber-600 dark:text-amber-400" />

      <div className="flex flex-col leading-tight">
        <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          Modo de suporte — {acessoSuporteAtivo.entidadeNome}
        </span>

        <span
          className={
            "text-xs tabular-nums " +
            (expirandoEmBreve
              ? "font-semibold text-red-600 dark:text-red-400"
              : "text-amber-700/80 dark:text-amber-400/80")
          }
        >
          Expira em {formatarContagem(segundosRestantes)}
        </span>
      </div>

      <Badge
        variant="outline"
        className="ml-1 hidden border-amber-500/50 text-amber-700 dark:text-amber-400 sm:inline-flex"
      >
        Ação auditada
      </Badge>

      <Button
        size="sm"
        variant="outline"
        className="ml-1 h-7 gap-1 border-amber-500/50 text-amber-700 hover:bg-amber-500/20 dark:text-amber-400"
        onClick={() => sairModoSuporte()}
      >
        <LogOut className="h-3.5 w-3.5" />
        Encerrar suporte
      </Button>
    </div>
  )
}