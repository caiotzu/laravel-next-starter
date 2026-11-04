import { NextResponse } from "next/server";

import {
  cabecalhosParaOBackend,
  cabecalhosParaONavegador,
  origemDoStorage,
  segmentosDeStorageValidos,
} from "@/lib/storage-proxy";

/**
 * Entrega os arquivos públicos do backend (`/storage/...`) com cabeçalhos de segurança.
 * Só GET (o Next atende HEAD a partir dele). O destino é sempre `<origem do backend>/storage/<caminho>`:
 * o caminho passa por validação rígida e o navegador nunca escolhe o host.
 */
export async function GET(req: Request, { params }: { params: Promise<{ caminho: string[] }> }) {
  const { caminho } = await params;

  if (!segmentosDeStorageValidos(caminho)) {
    return new NextResponse(null, { status: 404 });
  }

  const origem = origemDoStorage();

  if (!origem) {
    return new NextResponse(null, { status: 502 });
  }

  const destino = new URL(`/storage/${caminho.map(encodeURIComponent).join("/")}`, origem);

  try {
    const resposta = await fetch(destino, {
      headers: cabecalhosParaOBackend(req.headers),
      redirect: "manual", // um redirecionamento do backend nunca é seguido (poderia sair do host)
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

    if (resposta.status >= 300 && resposta.status < 400 && resposta.status !== 304) {
      return new NextResponse(null, { status: 502 });
    }

    return new Response(resposta.status === 304 ? null : resposta.body, {
      status: resposta.status,
      headers: cabecalhosParaONavegador(resposta.headers),
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
}
