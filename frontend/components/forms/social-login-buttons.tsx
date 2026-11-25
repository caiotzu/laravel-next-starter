"use client"

import { useState } from "react"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Loader2 } from "lucide-react"

import { IconeProvedorSocial } from "@/components/forms/provedor-social-icone"
import { Button } from "@/components/ui/button"

import type { ContextoSessao } from "@/lib/session/tipos"

type Provedor = { chave: string; nome: string }

interface SocialLoginButtonsProps {
  contexto: ContextoSessao
  /** Chamado com a mensagem quando não foi possível iniciar o login. */
  onError?: (mensagem: string) => void
  className?: string
}

/**
 * Botões "Entrar com ..." — a lista vem da API (só provedores ativos e configurados), então
 * habilitar um novo provedor no backend faz o botão aparecer aqui sem alterar o frontend.
 * Sem provedores, não renderiza nada.
 */
export function SocialLoginButtons({ contexto, onError, className }: SocialLoginButtonsProps) {
  const [iniciando, setIniciando] = useState<string | null>(null)

  const { data: provedores } = useQuery({
    queryKey: ["login-social-provedores", contexto],
    queryFn: async () => {
      const resposta = await axios.get<{ data: { provedores: Provedor[] } }>(
        `/api/auth/${contexto}/social/provedores`
      )

      return resposta.data.data.provedores
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  if (!provedores || provedores.length === 0) return null

  async function entrar(chave: string) {
    try {
      setIniciando(chave)

      const resposta = await axios.post<{ data: { url: string } }>(
        `/api/auth/${contexto}/social/${chave}/iniciar`
      )

      // Navegação completa (não SPA): o provedor assume a tela e devolve ao /callback do BFF.
      window.location.assign(resposta.data.data.url)
    } catch (err: unknown) {
      setIniciando(null)

      const mensagem =
        axios.isAxiosError<{ errors?: { business?: string[] } }>(err)
          ? err.response?.data?.errors?.business?.[0]
          : undefined

      onError?.(mensagem ?? "Não foi possível iniciar o login. Tente novamente.")
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center gap-3 py-2">
        <span className="bg-border h-px flex-1" />
        <span className="text-muted-foreground text-xs">ou</span>
        <span className="bg-border h-px flex-1" />
      </div>

      <div className="flex flex-col gap-2">
        {provedores.map(({ chave, nome }) => {
          return (
            <Button
              key={chave}
              type="button"
              variant="outline"
              className="w-full"
              disabled={iniciando !== null}
              onClick={() => entrar(chave)}
            >
              {iniciando === chave ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <span className="mr-2"><IconeProvedorSocial chave={chave} /></span>
              )}
              Entrar com {nome}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
