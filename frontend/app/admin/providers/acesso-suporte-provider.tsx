"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react"

import {
  AcessoSuporteAtivo,
  obterAcessoSuporteAtivo,
  definirAcessoSuporteAtivo,
  limparAcessoSuporteAtivo,
  assinarAlteracoesAcessoSuporte,
} from "@/lib/acesso-suporte/acesso-suporte-storage"
import { proxyAdminRequest } from "@/lib/proxy-admin"

type AcessoSuporteContextType = {
  acessoSuporteAtivo: AcessoSuporteAtivo | null
  segundosRestantes: number | null
  entrarModoSuporte: (acesso: AcessoSuporteAtivo) => void
  sairModoSuporte: () => Promise<void>
}

const AcessoSuporteContext = createContext<AcessoSuporteContextType>({
  acessoSuporteAtivo: null,
  segundosRestantes: null,
  entrarModoSuporte: () => {},
  sairModoSuporte: async () => {},
})

/**
 * Rota oficial do Dashboard do Admin (a mesma usada pelo middleware.ts ao
 * redirecionar quem já possui admin_access_token válido). Ao terminar o
 * acesso de suporte — por qualquer motivo: expiração, revogação ou
 * encerramento manual — o usuário sempre volta para cá, independente da
 * entidade em que estava (Private, Despachante, ou qualquer futura
 * entidade que reutilize este mesmo contexto).
 */
const ROTA_DASHBOARD_ADMIN = "/admin/dashboard"

/**
 * Disponibiliza, para toda a área Admin (e para qualquer entidade que
 * utilize o mecanismo de acesso de suporte, como Private), o estado do
 * modo de suporte e a contagem regressiva — de forma global, sem depender
 * de estar dentro de uma entidade específica.
 *
 * A contagem aqui é SOMENTE visual — o backend é quem, a cada requisição,
 * valida de verdade se o acesso ainda é válido (ver AcessoSuporteMiddleware
 * no backend). Se o tempo chegar a zero neste componente, o front sai do
 * modo de suporte por conta própria (sem esperar um 403), mas isso nunca
 * substitui a validação do backend.
 */
export function AcessoSuporteProvider({ children }: { children: React.ReactNode }) {
  const [acessoSuporteAtivo, setAcessoSuporteAtivo] = useState<AcessoSuporteAtivo | null>(null)
  const [segundosRestantes, setSegundosRestantes] = useState<number | null>(null)

  // Evita múltiplos redirects simultâneos (ex: o intervalo do contador
  // expirando ao mesmo tempo em que uma requisição em andamento recebe um
  // 403) — só o primeiro dispara a navegação.
  const redirecionandoRef = useRef(false)

  const irParaDashboardAdmin = useCallback(() => {
    if (redirecionandoRef.current) {
      return
    }

    if (window.location.pathname === ROTA_DASHBOARD_ADMIN) {
      return
    }

    redirecionandoRef.current = true
    window.location.href = ROTA_DASHBOARD_ADMIN
  }, [])

  const sincronizar = useCallback(() => {
    setAcessoSuporteAtivo(obterAcessoSuporteAtivo())
  }, [])

  useEffect(() => {
    sincronizar()
    return assinarAlteracoesAcessoSuporte(sincronizar)
  }, [sincronizar])

  useEffect(() => {
    if (!acessoSuporteAtivo || !acessoSuporteAtivo.expiraEm) {
      setSegundosRestantes(null)
      return
    }

    const calcular = () => {
      const restante = Math.floor(
        (new Date(acessoSuporteAtivo.expiraEm).getTime() - Date.now()) / 1000
      )

      if (restante <= 0) {
        limparAcessoSuporteAtivo()
        setSegundosRestantes(0)
        irParaDashboardAdmin()
        return
      }

      setSegundosRestantes(restante)
    }

    calcular()
    const intervalo = setInterval(calcular, 1000)

    return () => clearInterval(intervalo)
  }, [acessoSuporteAtivo, irParaDashboardAdmin])

  const entrarModoSuporte = useCallback((acesso: AcessoSuporteAtivo) => {
    definirAcessoSuporteAtivo(acesso)
  }, [])

  const sairModoSuporte = useCallback(async () => {
    const atual = obterAcessoSuporteAtivo()

    // Remove localmente primeiro — o Admin não deve continuar "parecendo"
    // em modo de suporte enquanto espera a resposta do backend.
    limparAcessoSuporteAtivo()

    if (atual) {
      try {
        await proxyAdminRequest({
          url: `/admin/acessos-suporte/${atual.id}`,
          method: "DELETE",
        })
      } catch {
        // Mesmo se o encerramento no backend falhar (ex: já havia expirado
        // ou sido revogado pelo cliente), o front já saiu do modo de
        // suporte — o que importa para a UX. O backend é a fonte de
        // verdade sobre o status real do acesso.
      }
    }

    irParaDashboardAdmin()
  }, [irParaDashboardAdmin])

  const value = useMemo(
    () => ({ acessoSuporteAtivo, segundosRestantes, entrarModoSuporte, sairModoSuporte }),
    [acessoSuporteAtivo, segundosRestantes, entrarModoSuporte, sairModoSuporte]
  )

  return (
    <AcessoSuporteContext.Provider value={value}>
      {children}
    </AcessoSuporteContext.Provider>
  )
}

export const useAcessoSuporte = () => useContext(AcessoSuporteContext)
