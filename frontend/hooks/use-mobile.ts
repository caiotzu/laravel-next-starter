import * as React from "react"

const MOBILE_BREAKPOINT = 768

// A largura da tela é um "store externo": assinamos a media query e lemos o valor atual,
// em vez de copiar para um estado dentro de um useEffect.
function assinar(aoMudar: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", aoMudar)
  return () => mql.removeEventListener("change", aoMudar)
}

const lerNoNavegador = () => window.innerWidth < MOBILE_BREAKPOINT
const lerNoServidor = () => false

export function useIsMobile() {
  return React.useSyncExternalStore(assinar, lerNoNavegador, lerNoServidor)
}
