import * as React from "react"

/**
 * Retorna uma versão "atrasada" do valor informado: só é atualizada depois
 * que o valor para de mudar por `delayMs` (padrão 1s). Reinicia o timer a
 * cada mudança, evitando disparar uma ação (ex.: requisição) a cada tecla.
 */
export function useDebouncedValue<T>(value: T, delayMs = 1000): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => clearTimeout(timeout)
  }, [value, delayMs])

  return debouncedValue
}
