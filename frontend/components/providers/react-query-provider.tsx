"use client"

import { useState } from "react"

import dynamic from "next/dynamic"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

// O devtools é uma ferramenta de desenvolvimento: o pacote fica em `devDependencies` e só é
// carregado (import dinâmico, sem SSR) quando NODE_ENV === "development". Em produção o
// ramo abaixo é descartado no build e o pacote nem precisa estar instalado.
const ReactQueryDevtools =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () => import("@tanstack/react-query-devtools").then((modulo) => modulo.ReactQueryDevtools),
        { ssr: false }
      )
    : (_props: { initialIsOpen?: boolean }) => null

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
