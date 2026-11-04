import { CABECALHOS_ARQUIVO_ENVIADO } from "@/lib/security/csp";

/**
 * Proxy dos arquivos públicos do backend (`/storage/...`: avatares e imagens de banner),
 * usado por `app/storage/[...caminho]/route.ts` (SEC-008 / F-09).
 *
 * Substitui o rewrite do `next.config.ts`, que (a) entregava os arquivos enviados por usuários
 * SEM nenhum cabeçalho de segurança (o `headers()` do Next não vale para rewrites externos) e
 * (b) não deixava anexá-los de outro jeito sem vazar o endereço interno do backend no header
 * `x-middleware-rewrite`.
 */

/** Origem que serve `/storage`: `BACKEND_STORAGE_URL` (opcional) ou a de `BACKEND_URL`. */
export function origemDoStorage(env: Record<string, string | undefined> = process.env): string | null {
  const bruto = env.BACKEND_STORAGE_URL || env.BACKEND_URL;

  if (!bruto) return null;

  try {
    const url = new URL(bruto);

    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : null;
  } catch {
    return null;
  }
}

/**
 * Cada segmento do caminho precisa ser um nome simples de arquivo/pasta: sem `.`/`..`, sem
 * barras, sem caracteres de controle. Os arquivos do backend têm nomes gerados (uuid/hash +
 * extensão), então a regra não restringe nada legítimo.
 */
const SEGMENTO_VALIDO = /^[\p{L}\p{N}][\p{L}\p{N}._ -]*$/u;

export function segmentosDeStorageValidos(segmentos: string[] | undefined): segmentos is string[] {
  return (
    Array.isArray(segmentos) &&
    segmentos.length > 0 &&
    segmentos.length <= 8 &&
    segmentos.every((s) => s.length <= 255 && SEGMENTO_VALIDO.test(s) && !s.includes(".."))
  );
}

const TIPOS_DE_IMAGEM = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

/** Cabeçalhos da requisição do navegador que valem repassar (cache e trechos de arquivo). */
const CABECALHOS_DE_ENTRADA = ["range", "if-none-match", "if-modified-since", "if-range"] as const;

export function cabecalhosParaOBackend(entrada: Headers): Headers {
  const saida = new Headers({ Accept: "image/*,*/*;q=0.8" });

  for (const nome of CABECALHOS_DE_ENTRADA) {
    const valor = entrada.get(nome);
    if (valor) saida.set(nome, valor);
  }

  return saida;
}

const CABECALHOS_DE_SAIDA = ["content-length", "content-range", "accept-ranges", "etag", "last-modified", "cache-control"] as const;

/**
 * Cabeçalhos da resposta ao navegador: só os de cache/tamanho do backend + os de segurança.
 * Só imagens são exibidas inline; qualquer outro tipo vira download (`octet-stream` +
 * `attachment`), então um HTML/SVG enviado por engano nunca é interpretado pelo navegador.
 */
export function cabecalhosParaONavegador(upstream: Headers): Headers {
  const saida = new Headers();

  for (const nome of CABECALHOS_DE_SAIDA) {
    const valor = upstream.get(nome);
    if (valor) saida.set(nome, valor);
  }

  const tipo = (upstream.get("content-type") ?? "").split(";")[0].trim().toLowerCase();

  if (TIPOS_DE_IMAGEM.has(tipo)) {
    saida.set("Content-Type", tipo);
  } else {
    saida.set("Content-Type", "application/octet-stream");
    saida.set("Content-Disposition", "attachment");
  }

  for (const [nome, valor] of Object.entries(CABECALHOS_ARQUIVO_ENVIADO)) saida.set(nome, valor);

  return saida;
}
