"use client"

import { useState } from "react"

import { LogOut, ShieldCheck, Timer } from "lucide-react"

import { useAcessoSuporte } from "@/app/admin/providers/acesso-suporte-provider"

import { Button } from "@/components/ui/button"

function formatarTempoRestante(segundos: number): string {
  const seguros = Math.max(0, segundos)
  const minutos = Math.floor(seguros / 60).toString().padStart(2, "0")
  const resto = Math.floor(seguros % 60).toString().padStart(2, "0")

  return `${minutos}:${resto}`
}

export function SupportModeBanner() {
  const {
    acessoSuporteAtivo,
    segundosRestantes,
    sairModoSuporte,
  } = useAcessoSuporte()

  const [saindo, setSaindo] = useState(false)

  if (!acessoSuporteAtivo) {
    return null
  }

  const expirandoEmBreve =
    segundosRestantes !== null && segundosRestantes <= 60

  async function handleSair() {
    setSaindo(true)

    try {
      await sairModoSuporte()
    } finally {
      setSaindo(false)
    }
  }

  return (
    <div className="flex min-w-0 items-center justify-center gap-2">
      {/* Status do suporte */}
      <div className="flex min-w-0 items-center gap-2">
        <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <ShieldCheck className="size-4" />

          <span
            className={[
              "absolute right-0 top-0 size-2 rounded-full ring-2 ring-background",
              expirandoEmBreve ? "bg-destructive" : "bg-emerald-500",
            ].join(" ")}
          />
        </div>

        <div className="hidden min-w-0 sm:block">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="font-semibold text-foreground">
              Suporte ativo
            </span>

            <span className="text-muted-foreground">
              •
            </span>

            <span className="max-w-[180px] truncate text-muted-foreground lg:max-w-[260px]">
              {acessoSuporteAtivo.entidadeNome}
            </span>
          </div>
        </div>
      </div>

      {/* Separador */}
      <div className="hidden h-5 w-px bg-border sm:block" />

      {/* Tempo restante */}
      <div
        className={[
          "flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1",
          expirandoEmBreve
            ? "bg-destructive/10 text-destructive"
            : "bg-muted text-foreground",
        ].join(" ")}
        aria-label="Tempo restante de suporte"
      >
        <Timer
          className={[
            "size-3.5",
            expirandoEmBreve
              ? "text-destructive"
              : "text-muted-foreground",
          ].join(" ")}
        />

        <span className="text-xs font-semibold tabular-nums">
          {segundosRestantes !== null
            ? formatarTempoRestante(segundosRestantes)
            : "--:--"}
        </span>
      </div>

      {/* Sair */}
      <Button
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 px-2.5"
        disabled={saindo}
        onClick={handleSair}
      >
        <LogOut className="size-3.5" />

        <span className="hidden lg:inline">
          Sair do suporte
        </span>
      </Button>
    </div>
  )
}