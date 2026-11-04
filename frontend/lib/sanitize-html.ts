import DOMPurify from "dompurify";

/**
 * Sanitização do HTML produzido pelo editor rich text (Tiptap) antes de exibi-lo com
 * `dangerouslySetInnerHTML` (SEC-008 / F-10).
 *
 * É uma ALLOWLIST FECHADA que espelha a do backend (`app/Support/HtmlSanitizer.php`): as mesmas
 * tags, nenhum atributo exceto `href`/`target`/`rel` em `<a>`, e links só `http`, `https`,
 * `mailto` e `tel`. Antes usava a configuração padrão do DOMPurify, que aceita `<img>`, `<svg>`,
 * `style`, `data-*`, `class`, `id` e URLs `data:`: mais superfície do que o editor produz. O
 * resultado mais restritivo também combina com a CSP (ver `lib/security/csp.ts`).
 */
export const TAGS_PERMITIDAS = [
  "p", "br", "strong", "b", "em", "i", "u", "s", "del",
  "code", "pre", "blockquote", "ul", "ol", "li", "hr",
  "h1", "h2", "h3", "h4", "a",
] as const;

export const ATRIBUTOS_PERMITIDOS = ["href", "target", "rel"] as const;

const ESQUEMAS_DE_LINK = /^(?:https?|mailto|tel):/i;

let ganchoRegistrado = false;

function registrarGancho() {
  if (ganchoRegistrado) return;
  ganchoRegistrado = true;

  // Todo link que abre em outra aba ou sai do site ganha `noopener noreferrer`.
  DOMPurify.addHook("afterSanitizeAttributes", (no) => {
    if (no.tagName !== "A") return;

    // Link sem destino (ou com href vazio) vira texto: não leva a lugar nenhum.
    if (!no.getAttribute("href")) {
      no.removeAttribute("href");
      no.removeAttribute("target");
      no.removeAttribute("rel");
      return;
    }

    no.setAttribute("rel", "noopener noreferrer");

    if (no.getAttribute("target") && no.getAttribute("target") !== "_blank") {
      no.setAttribute("target", "_blank");
    }
  });
}

/**
 * Atenção: NÃO usar `USE_PROFILES` aqui. O DOMPurify o aplica SUBSTITUINDO `ALLOWED_TAGS` e
 * `ALLOWED_ATTR` pelos do perfil (voltavam `<div>`, `<span>`, `<font>`...). O teste
 * `tests/lib/sanitize-html.test.ts` quebra se isso voltar a acontecer.
 */
export function sanitizarHtml(html: string): string {
  // O DOMPurify precisa de um DOM: no servidor não renderiza nada (o viewer é "use client").
  if (typeof window === "undefined") return "";

  registrarGancho();

  return DOMPurify.sanitize(html ?? "", {
    ALLOWED_TAGS: [...TAGS_PERMITIDAS],
    ALLOWED_ATTR: [...ATRIBUTOS_PERMITIDOS],
    ALLOWED_URI_REGEXP: ESQUEMAS_DE_LINK,
    // O DOMPurify valida o VALOR de todo atributo fora desta lista contra ALLOWED_URI_REGEXP;
    // sem isto `target="_blank"` seria descartado por não parecer uma URL.
    ADD_URI_SAFE_ATTR: ["target", "rel"],
    ALLOW_DATA_ATTR: false,
    ALLOW_ARIA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    FORBID_TAGS: ["style", "form", "input", "button", "textarea", "select", "svg", "math", "iframe", "object", "embed", "audio", "video", "canvas", "link", "meta", "base", "template", "noscript", "img", "picture", "source"],
    FORBID_ATTR: ["style", "class", "id", "src", "srcset", "srcdoc", "formaction", "action", "name"],
    RETURN_TRUSTED_TYPE: false,
    WHOLE_DOCUMENT: false,
    SANITIZE_DOM: true,
  });
}
