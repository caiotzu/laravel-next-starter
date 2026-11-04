/**
 * Content-Security-Policy completa, com NONCE por requisição (SEC-008 / F-09).
 *
 * Antes só havia `frame-ancestors`/`base-uri`/`form-action`/`object-src`. Agora também `script-src`:
 * só executa script que o servidor marcou com o nonce da requisição (ou que um script assim
 * carregou, `strict-dynamic`). Um `<script>` ou `onerror=` injetado por XSS não tem o nonce e é
 * bloqueado pelo navegador, o que limita o estrago de uma falha de sanitização.
 *
 * O nonce é gerado em `proxy.ts` a cada requisição de página e repassado ao Next pelo header da
 * requisição (o Next o aplica nos próprios scripts) e ao layout pelo header `x-nonce` (para o
 * script do tema, do `next-themes`). Como o nonce muda a cada resposta, as páginas precisam ser
 * renderizadas sob demanda (`dynamic = "force-dynamic"` nos layouts raiz).
 *
 * `style-src` mantém `'unsafe-inline'` de propósito: o React, o Radix, o Recharts, o Sonner e o
 * Tiptap usam atributos/elementos `style`. É um risco bem menor que o de scripts.
 */

export const CABECALHO_NONCE = "x-nonce";

export const CABECALHO_CSP = "Content-Security-Policy";
export const CABECALHO_CSP_SOMENTE_RELATORIO = "Content-Security-Policy-Report-Only";

/** Nonce aleatório de 128 bits em base64 (formato exigido pelo navegador). */
export function gerarNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  let binario = "";

  for (const byte of bytes) binario += String.fromCharCode(byte);

  return btoa(binario);
}

/** Origem (esquema + host + porta) do backend, ou `null` se a URL for inválida/ausente. */
export function origemDoBackend(urlBackend: string | undefined): string | null {
  if (!urlBackend) return null;

  try {
    return new URL(urlBackend).origin;
  } catch {
    return null;
  }
}

/**
 * `CSP_MODO=report-only` troca o cabeçalho por `Content-Security-Policy-Report-Only`: o navegador
 * NÃO bloqueia, só registra as violações no console. Serve para validar a política num ambiente
 * novo antes de impô-la. O padrão (qualquer outro valor) é bloquear.
 */
export function cabecalhoDaCsp(modo: string | undefined): string {
  return modo?.trim().toLowerCase() === "report-only" ? CABECALHO_CSP_SOMENTE_RELATORIO : CABECALHO_CSP;
}

interface OpcoesCsp {
  nonce: string;
  producao: boolean;
  /** Origem do backend: as URLs assinadas de anexo de chamado são carregadas direto dele em <img>. */
  origemBackend?: string | null;
}

export function construirCsp({ nonce, producao, origemBackend = null }: OpcoesCsp): string {
  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  // Só em desenvolvimento: o React usa eval para reconstruir pilhas de chamadas.
  if (!producao) scriptSrc.push("'unsafe-eval'");

  const imgSrc = ["'self'", "data:", "blob:"];
  if (origemBackend) imgSrc.push(origemBackend);

  const connectSrc = ["'self'"];
  // Só em desenvolvimento: o hot reload usa WebSocket.
  if (!producao) connectSrc.push("ws:", "wss:");

  const diretivas: [string, string[]][] = [
    ["default-src", ["'self'"]],
    ["script-src", scriptSrc],
    ["style-src", ["'self'", "'unsafe-inline'"]],
    ["img-src", imgSrc],
    ["font-src", ["'self'", "data:"]],
    ["connect-src", connectSrc],
    ["media-src", ["'self'"]],
    ["worker-src", ["'self'", "blob:"]],
    ["manifest-src", ["'self'"]],
    ["object-src", ["'none'"]],
    ["frame-src", ["'none'"]],
    ["base-uri", ["'self'"]],
    ["form-action", ["'self'"]],
    ["frame-ancestors", ["'none'"]],
  ];

  return diretivas.map(([nome, valores]) => `${nome} ${valores.join(" ")}`).join("; ");
}

/** Páginas recebem a CSP com nonce; API, assets do Next e `/storage` têm tratamento próprio. */
export function rotaRecebeCspComNonce(pathname: string): boolean {
  return !(
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/storage/")
  );
}

/**
 * Cabeçalhos das respostas de `/storage/*` (avatares, imagens de banner enviados por usuários).
 *
 * Aplicados por `app/storage/[...caminho]/route.ts`. Antes `/storage` era um rewrite no
 * `next.config.ts`, e o `headers()` do Next NÃO se aplica a rewrites para outro servidor
 * (verificado: a resposta saía sem nenhum cabeçalho de segurança). `sandbox` torna inerte qualquer conteúdo ativo que
 * chegue a ser aberto direto no navegador (ex.: um SVG com script) e `nosniff` impede o
 * navegador de "adivinhar" um tipo executável.
 */
export const CABECALHOS_ARQUIVO_ENVIADO: Record<string, string> = {
  "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox; frame-ancestors 'none'",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
};
