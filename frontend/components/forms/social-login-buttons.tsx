"use client"

import { useState } from "react"

import { useQuery } from "@tanstack/react-query"
import axios from "axios"
import { Loader2, LogIn } from "lucide-react"

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
 * Ícones de marca por provedor. Para um provedor novo, o botão funciona sem nada aqui (usa o
 * ícone genérico); registrar o ícone é só acabamento visual. SVG inline: a CSP não permite
 * imagens de hosts externos.
 */
const ICONES: Record<string, () => React.JSX.Element> = {
  google: () => (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path fill="#4285F4" d="M23.5 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.27-2.09 3.57-5.17 3.57-8.81Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.29v3.1A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.29 14.3a7.2 7.2 0 0 1 0-4.6v-3.1H1.29a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.76c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.6l4 3.1C6.23 6.87 8.88 4.76 12 4.76Z" />
    </svg>
  ),
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
          const Icone = ICONES[chave]

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
              ) : Icone ? (
                <span className="mr-2"><Icone /></span>
              ) : (
                <LogIn className="h-4 w-4 mr-2" />
              )}
              Entrar com {nome}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
