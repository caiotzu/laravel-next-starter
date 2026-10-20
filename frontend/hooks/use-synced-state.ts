import { useState, type Dispatch, type SetStateAction } from "react"

/**
 * Estado local que ACOMPANHA um valor vindo de fora (prop, dado do servidor).
 *
 * Enquanto `valor` não muda, o estado pode ser alterado normalmente (ex.: pré-visualização
 * otimista). Quando `valor` muda, o estado é reiniciado para ele. O ajuste acontece durante a
 * renderização, que é o padrão recomendado pelo React no lugar de
 * `useEffect(() => setEstado(valor), [valor])` — evita uma renderização extra com o valor antigo.
 */
export function useSyncedState<T>(valor: T): [T, Dispatch<SetStateAction<T>>] {
  const [estado, setEstado] = useState<T>(valor)
  const [valorAnterior, setValorAnterior] = useState<T>(valor)

  if (!Object.is(valorAnterior, valor)) {
    setValorAnterior(valor)
    setEstado(valor)
  }

  return [estado, setEstado]
}
