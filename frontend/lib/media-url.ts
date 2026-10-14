/**
 * Normalização de URLs de mídia (avatar, imagens de banner) vindas do backend.
 *
 * O Laravel devolve URLs absolutas montadas com `APP_URL` (ex.: `http://localhost/storage/a.png`),
 * que nem sempre é alcançável pelo navegador. O navegador só fala com o Next (BFF), então
 * convertemos para caminho relativo (`/storage/a.png`) e o rewrite `/storage/*` do
 * `next.config.ts` encaminha ao backend.
 *
 * Só URLs cujo caminho começa com `/storage/` são alteradas. Qualquer outra (links externos,
 * URLs assinadas de anexo, `blob:`, `data:`, texto) é preservada exatamente como veio.
 */

const PREFIXO_STORAGE = "/storage/";

export function normalizarUrlDeMidia<T extends string | null | undefined>(url: T): T {
  if (typeof url !== "string" || url === "") return url;

  if (!/^https?:\/\//i.test(url)) return url;

  try {
    const { pathname, search, hash } = new URL(url);

    if (!pathname.startsWith(PREFIXO_STORAGE)) return url;

    return `${pathname}${search}${hash}` as T;
  } catch {
    return url;
  }
}

/**
 * Percorre objetos e arrays (sem mutar o original) normalizando toda string que seja uma URL
 * absoluta de `/storage`. Usada nas respostas dos proxies, para não repetir a conversão por domínio.
 */
export function normalizarUrlsDeMidia<T>(valor: T): T {
  if (typeof valor === "string") return normalizarUrlDeMidia(valor);

  if (Array.isArray(valor)) {
    return valor.map((item) => normalizarUrlsDeMidia(item)) as T;
  }

  if (valor !== null && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor as Record<string, unknown>).map(([chave, item]) => [
        chave,
        normalizarUrlsDeMidia(item),
      ])
    ) as T;
  }

  return valor;
}
