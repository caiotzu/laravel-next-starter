<?php

namespace App\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Sanitizador de HTML por ALLOWLIST para conteúdo produzido pelo editor rich text
 * (Tiptap: negrito, itálico, listas, citação, código e links).
 *
 * Camada de defesa em profundidade no backend: o frontend também sanitiza (DOMPurify) ao
 * exibir o detalhe, mas conteúdo salvo direto pela API não passa pelo editor. Tudo que não
 * estiver na allowlist é removido: tags desconhecidas são "desembrulhadas" (o texto fica) e
 * tags perigosas (script, style, iframe, svg...) são descartadas junto com o conteúdo.
 * Nenhum atributo é mantido, exceto href/target/rel em <a> (com esquema validado).
 *
 * Não tenta ser um sanitizador genérico: para HTML arbitrário use uma biblioteca dedicada
 * (ex.: HTMLPurifier). Aqui o conjunto de tags é pequeno e fechado de propósito.
 */
final class HtmlSanitizer
{
    private const TAGS_PERMITIDAS = [
        'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del',
        'code', 'pre', 'blockquote', 'ul', 'ol', 'li', 'hr',
        'h1', 'h2', 'h3', 'h4', 'a',
    ];

    /** Tags cujo CONTEÚDO também deve ser descartado (não faz sentido manter o texto). */
    private const TAGS_DESCARTADAS = [
        'script', 'style', 'iframe', 'frame', 'frameset', 'object', 'embed', 'applet',
        'template', 'noscript', 'svg', 'math', 'title', 'head', 'meta', 'link', 'base',
        'form', 'textarea', 'select', 'option', 'button', 'input', 'audio', 'video', 'canvas',
    ];

    private const ESQUEMAS_LINK = ['http', 'https', 'mailto', 'tel'];

    public static function sanitizar(?string $html): string
    {
        $html = (string) $html;

        if (trim($html) === '') {
            return '';
        }

        $doc = new DOMDocument('1.0', 'UTF-8');

        $usarErrosInternos = libxml_use_internal_errors(true);

        // O prefixo <?xml encoding> força UTF-8 (o parser HTML do libxml assume ISO-8859-1).
        $doc->loadHTML(
            '<?xml encoding="UTF-8"><html><body><div id="__raiz">' . $html . '</div></body></html>',
            LIBXML_NOERROR | LIBXML_NOWARNING | LIBXML_NONET
        );

        libxml_clear_errors();
        libxml_use_internal_errors($usarErrosInternos);

        $raiz = $doc->getElementById('__raiz');

        if (! $raiz) {
            return '';
        }

        self::limparFilhos($raiz);

        $saida = '';

        foreach ($raiz->childNodes as $filho) {
            $saida .= $doc->saveHTML($filho);
        }

        return trim($saida);
    }

    private static function limparFilhos(DOMNode $pai): void
    {
        // Copia a lista: vamos remover/substituir nós enquanto percorre.
        foreach (iterator_to_array($pai->childNodes) as $no) {
            if ($no->nodeType === XML_TEXT_NODE) {
                continue;
            }

            if (! $no instanceof DOMElement) {
                // Comentários, CDATA, instruções de processamento etc.
                $pai->removeChild($no);
                continue;
            }

            $tag = strtolower($no->nodeName);

            if (in_array($tag, self::TAGS_DESCARTADAS, true)) {
                $pai->removeChild($no);
                continue;
            }

            // Sanitiza primeiro os descendentes...
            self::limparFilhos($no);

            if (! in_array($tag, self::TAGS_PERMITIDAS, true)) {
                // ...depois "desembrulha": mantém o conteúdo (já limpo) e remove só a tag.
                while ($no->firstChild) {
                    $pai->insertBefore($no->firstChild, $no);
                }
                $pai->removeChild($no);
                continue;
            }

            self::limparAtributos($no, $tag);
        }
    }

    private static function limparAtributos(DOMElement $no, string $tag): void
    {
        $href = null;

        if ($tag === 'a' && $no->hasAttribute('href')) {
            $href = self::validarHref($no->getAttribute('href'));
        }

        foreach (iterator_to_array($no->attributes) as $atributo) {
            $no->removeAttributeNode($atributo);
        }

        if ($tag === 'a' && $href !== null) {
            $no->setAttribute('href', $href);
            $no->setAttribute('target', '_blank');
            $no->setAttribute('rel', 'noopener noreferrer nofollow');
        }
    }

    private static function validarHref(string $href): ?string
    {
        // Remove caracteres de controle e espaços usados para disfarçar "java\nscript:".
        $normalizado = preg_replace('/[\x00-\x20\x7F-\x9F]+/u', '', $href) ?? '';

        if ($normalizado === '') {
            return null;
        }

        if (! preg_match('/^([a-z][a-z0-9+.\-]*):/i', $normalizado, $m)) {
            // Sem esquema (relativo, âncora, //host): não permitido — só links absolutos.
            return null;
        }

        if (! in_array(strtolower($m[1]), self::ESQUEMAS_LINK, true)) {
            return null;
        }

        return trim($href);
    }
}
