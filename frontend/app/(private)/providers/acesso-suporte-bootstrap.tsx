"use client"

import { useEffect, useRef, useState } from "react"

import { useAcessoSuporte } from "@/app/admin/providers/acesso-suporte-provider"

import { useUserPrivate } from "@/hooks/use-user-private"

/**
 * Inicializa o contexto de suporte na nova aba.
 *
 * O ID chega pela URL apenas como identificador inicial (placeholder) —
 * necessário para que o header X-Acesso-Suporte-Id já seja enviado na
 * primeira requisição, incluindo o /me abaixo. A autorização real
 * continua sendo feita pelo backend em cada requisição através desse
 * header (ver AcessoSuporteMiddleware).
 *
 * Importante: `expiraEm`/entidade NÃO são inventados aqui. Assim que o
 * /me confirmar o acesso, os valores reais retornados pelo backend
 * substituem o placeholder — o backend é sempre a fonte da verdade do
 * contador (ver AuthController::me()), nunca um cálculo local iniciado
 * no frontend.
 */
export function AcessoSuporteBootstrap({
  children,
}: {
  children: React.ReactNode
}) {
  const { entrarModoSuporte } = useAcessoSuporte()
  const [pronto, setPronto] = useState(false)
  const [aguardandoConfirmacao, setAguardandoConfirmacao] = useState(false)
  const sincronizadoComBackendRef = useRef<string | null>(null)

  useEffect(() => {
    const url = new URL(window.location.href)
    const acessoId = url.searchParams.get("acesso_suporte_id")

    if (acessoId) {
      entrarModoSuporte({
        id: acessoId,
        entidadeNome: "Cliente",
        expiraEm: null,
      })

      setAguardandoConfirmacao(true)

      url.searchParams.delete("acesso_suporte_id")
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`)
    }

    setPronto(true)
  }, [entrarModoSuporte])

  // Só busca o /me aqui enquanto estivermos confirmando um acesso de
  // suporte recém-iniciado por esta aba — nas demais páginas/entidades,
  // quem já precisa desses dados (ex: AppSidebar) continua usando o hook
  // normalmente, compartilhando o mesmo cache do react-query.
  const { data: userPrivate } = useUserPrivate({
    enabled: pronto && aguardandoConfirmacao,
  })

  useEffect(() => {
    const acessoSuporte = userPrivate?.acesso_suporte

    if (!acessoSuporte?.id) {
      return
    }

    const assinatura = `${acessoSuporte.id}:${acessoSuporte.expira_em ?? ""}`

    if (sincronizadoComBackendRef.current === assinatura) {
      return
    }

    sincronizadoComBackendRef.current = assinatura

    entrarModoSuporte({
      id: acessoSuporte.id,
      entidadeNome: acessoSuporte.entidade_nome ?? "Cliente",
      expiraEm: acessoSuporte.expira_em,
    })
  }, [userPrivate, entrarModoSuporte])

  if (!pronto) {
    return null
  }

  return children
}
