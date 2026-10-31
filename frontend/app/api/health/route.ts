import { NextResponse } from "next/server";

import { redisEstaSaudavel } from "@/lib/session/saude";

// Sempre consulta o Redis na hora: uma resposta em cache esconderia uma queda.
export const dynamic = "force-dynamic";

/**
 * "Está tudo funcionando?" para monitoramento, balanceador de carga e healthcheck do Docker.
 *
 * Público e sem efeitos colaterais (só GET). Responde 200 quando o Redis das sessões está de
 * pé e 503 quando não está, o que tira a instância do balanceador em vez de deixá-la devolver
 * erros de login. Não traz nenhum detalhe interno (host, versão, mensagem de erro).
 */
export async function GET() {
  const redis = await redisEstaSaudavel();

  return NextResponse.json(
    { status: redis ? "ok" : "degradado", redis: redis ? "ok" : "indisponivel" },
    { status: redis ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
