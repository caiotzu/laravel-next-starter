/**
 * SEC-008 / F-10: o HTML do editor só pode sair com tags, atributos e links da allowlist
 * (a mesma do backend). Os ataques abaixo cobrem as famílias clássicas de XSS; para cada um,
 * o resultado é reanalisado como DOM e conferido contra os INVARIANTES (não contra um texto
 * esperado), o que também pega variações que ninguém previu.
 */
import { describe, expect, it } from "vitest";

import { ATRIBUTOS_PERMITIDOS, sanitizarHtml, TAGS_PERMITIDAS } from "@/lib/sanitize-html";

const ESQUEMAS = /^(?:https?|mailto|tel):/i;

/** Reanalisa a saída e devolve o que SOBROU de perigoso (lista vazia = seguro). */
function violacoes(saida: string): string[] {
  const problemas: string[] = [];
  const doc = new DOMParser().parseFromString(`<body>${saida}</body>`, "text/html");

  doc.body.querySelectorAll("*").forEach((el) => {
    const tag = el.tagName.toLowerCase();

    if (!(TAGS_PERMITIDAS as readonly string[]).includes(tag)) problemas.push(`tag <${tag}>`);

    for (const atributo of Array.from(el.attributes)) {
      if (!(ATRIBUTOS_PERMITIDOS as readonly string[]).includes(atributo.name)) problemas.push(`atributo ${atributo.name} em <${tag}>`);
      if (atributo.name.startsWith("on")) problemas.push(`manipulador ${atributo.name}`);
    }

    if (tag === "a") {
      const href = el.getAttribute("href");
      if (href !== null && !ESQUEMAS.test(href.trim())) problemas.push(`href fora da allowlist: ${href}`);
      if (href !== null && el.getAttribute("rel") !== "noopener noreferrer") problemas.push("link sem rel=noopener noreferrer");
    }
  });

  if (/javascript:|vbscript:|data:text\/html/i.test(doc.body.innerHTML.replace(/&colon;/gi, ":"))) {
    problemas.push("esquema perigoso no texto");
  }

  return problemas;
}

const ATAQUES: [string, string][] = [
  ["script direto", `<script>alert(1)</script>`],
  ["script com caixa mista e espaços", `<ScRiPt >alert(1)</sCrIpT >`],
  ["img onerror", `<img src=x onerror=alert(1)>`],
  ["img sem aspas", `<img src=x onerror=alert(document.cookie)//>`],
  ["svg onload", `<svg onload=alert(1)>`],
  ["svg com script interno", `<svg><script>alert(1)</script></svg>`],
  ["svg animate", `<svg><animate onbegin=alert(1) attributeName=x dur=1s>`],
  ["math + href", `<math><a xlink:href="javascript:alert(1)">x</a></math>`],
  ["iframe srcdoc", `<iframe srcdoc="<script>alert(1)</script>"></iframe>`],
  ["iframe src javascript", `<iframe src="javascript:alert(1)"></iframe>`],
  ["object data", `<object data="javascript:alert(1)"></object>`],
  ["embed", `<embed src="javascript:alert(1)">`],
  ["link href javascript", `<a href="javascript:alert(1)">clique</a>`],
  ["link javascript com maiúsculas", `<a href="JaVaScRiPt:alert(1)">x</a>`],
  ["link javascript com espaço e tab", `<a href="  \tjava\tscript:alert(1)">x</a>`],
  ["link javascript com entidade numérica", `<a href="&#106;avascript:alert(1)">x</a>`],
  ["link javascript com entidade hex", `<a href="&#x6A;avascript:alert(1)">x</a>`],
  ["link javascript com dois pontos codificado", `<a href="javascript&colon;alert(1)">x</a>`],
  ["link vbscript", `<a href="vbscript:msgbox(1)">x</a>`],
  ["link data html", `<a href="data:text/html,<script>alert(1)</script>">x</a>`],
  ["link data base64", `<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">x</a>`],
  ["manipulador em tag permitida", `<p onclick="alert(1)" onmouseover="alert(2)">texto</p>`],
  ["manipulador em link", `<a href="https://exemplo.com" onfocus="alert(1)" autofocus>x</a>`],
  ["style com expression/url", `<p style="background:url(javascript:alert(1))">x</p>`],
  ["tag style", `<style>@import 'https://evil.example/x.css';</style><p>x</p>`],
  ["form com action", `<form action="javascript:alert(1)"><input name=x><button>ok</button></form>`],
  ["button formaction", `<form><button formaction="javascript:alert(1)">x</button></form>`],
  ["input autofocus onfocus", `<input autofocus onfocus=alert(1)>`],
  ["textarea", `<textarea><script>alert(1)</script></textarea>`],
  ["base href", `<base href="https://evil.example/"><a href="/x">x</a>`],
  ["meta refresh", `<meta http-equiv="refresh" content="0;url=javascript:alert(1)">`],
  ["link rel stylesheet", `<link rel="stylesheet" href="https://evil.example/x.css">`],
  ["template", `<template><script>alert(1)</script></template>`],
  ["noscript (mutação)", `<noscript><p title="</noscript><img src=x onerror=alert(1)>">`],
  ["mXSS clássico form/math/mglyph", `<form><math><mtext></form><form><mglyph><style></math><img src onerror=alert(1)>`],
  ["mXSS svg/style", `<svg></p><style><a id="</style><img src=1 onerror=alert(1)>">`],
  ["mXSS listing/xmp", `<listing>&lt;img src=x onerror=alert(1)&gt;</listing>`],
  ["tags aninhadas quebradas", `<<script>alert(1)//<</script>`],
  ["comentário condicional", `<!--[if gte IE 4]><script>alert(1)</script><![endif]-->`],
  ["data-* e aria-*", `<p data-x="1" data-onclick="alert(1)" aria-label="a" id="x" class="y">x</p>`],
  ["target _top e rel solto", `<a href="https://exemplo.com" target="_top" rel="opener">x</a>`],
  ["audio/video com onerror", `<video><source onerror=alert(1)></video><audio src=x onerror=alert(1)>`],
  ["img em picture/source", `<picture><source srcset="x"><img src=x onerror=alert(1)></picture>`],
  ["canvas", `<canvas id=c></canvas>`],
  ["atributo name (DOM clobbering)", `<a name="cookie" href="https://exemplo.com">x</a><img name=body>`],
  ["href protocolo relativo e vazio", `<a href="//evil.example/x">x</a><a href="">y</a><a href="#">z</a>`],
  ["href com caracteres de controle", `<a href="java\u0000script:alert(1)">x</a>`],
  ["utf-7 / ponto e vírgula", `+ADw-script+AD4-alert(1)+ADw-/script+AD4-`],
];

describe("sanitizarHtml — ataques conhecidos", () => {
  it.each(ATAQUES)("%s: nada perigoso sobrevive", (_nome, payload) => {
    const saida = sanitizarHtml(payload);

    expect(violacoes(saida), `saída: ${saida}`).toEqual([]);
  });

  it("nenhum ataque deixa uma tag perigosa ou esquema javascript: na saída bruta (texto escapado é inofensivo)", () => {
    for (const [, payload] of ATAQUES) {
      const saida = sanitizarHtml(payload);

      expect(saida.toLowerCase()).not.toMatch(/<script|<iframe|<svg|<img|<style|<form|<input|javascript:/);
    }
  });

  it("é idempotente: sanitizar de novo não muda nada (sem mutação por reparse)", () => {
    for (const [, payload] of ATAQUES) {
      const uma = sanitizarHtml(payload);

      expect(sanitizarHtml(uma)).toBe(uma);
    }
  });
});

describe("sanitizarHtml — conteúdo legítimo do editor é preservado", () => {
  it("mantém formatação, listas, citação, código e títulos", () => {
    const html =
      `<h1>Título</h1><h2>Sub</h2><p>Texto <strong>forte</strong>, <em>itálico</em>, <u>sublinhado</u>, <s>riscado</s> e <code>código</code>.</p>` +
      `<ul><li>um</li><li>dois</li></ul><ol><li>a</li></ol><blockquote>citação</blockquote><pre><code>linha</code></pre><hr><p>quebra<br>de linha</p>`;

    expect(sanitizarHtml(html)).toBe(html);
  });

  it("mantém links http, https, mailto e tel e adiciona rel seguro", () => {
    for (const href of ["https://exemplo.com/a?b=c#d", "http://exemplo.com", "mailto:ajuda@exemplo.com", "tel:+5534999999999"]) {
      const saida = sanitizarHtml(`<a href="${href}">link</a>`);

      expect(saida).toBe(`<a href="${href}" rel="noopener noreferrer">link</a>`);
    }
  });

  it("link com target _blank mantém o target e ganha rel", () => {
    expect(sanitizarHtml(`<a href="https://exemplo.com" target="_blank">x</a>`)).toBe(
      `<a href="https://exemplo.com" target="_blank" rel="noopener noreferrer">x</a>`
    );
  });

  it("o texto de tags removidas é mantido (o conteúdo não some, só a marcação)", () => {
    expect(sanitizarHtml(`<div><span>olá</span> <font color=red>mundo</font></div>`)).toBe("olá mundo");
  });

  it("acentos e emojis ficam intactos", () => {
    expect(sanitizarHtml(`<p>Atenção: ação, coração ✅ 😀</p>`)).toBe(`<p>Atenção: ação, coração ✅ 😀</p>`);
  });

  it("vazio, só espaços e indefinido viram texto vazio sem lançar erro", () => {
    expect(sanitizarHtml("")).toBe("");
    expect(sanitizarHtml("   ")).toBe("   ");
    expect(sanitizarHtml(undefined as unknown as string)).toBe("");
    expect(sanitizarHtml(null as unknown as string)).toBe("");
  });
});
