"use client";

import { useMemo } from "react";

import { sanitizarHtml } from "@/lib/sanitize-html";

interface Props {
  html: string;
  className?: string;
}

/**
 * O conteúdo vem do RichTextEditor (Tiptap) preenchido por administradores
 * — fonte relativamente confiável, mas sanitizamos mesmo assim antes de
 * injetar via dangerouslySetInnerHTML, já que é HTML de fato (negrito,
 * listas, links) e não apenas texto. A allowlist (tags, atributos e esquemas
 * de link) é a de `lib/sanitize-html.ts`, a mesma do backend.
 */
export function RichTextViewer({ html, className }: Props) {
  const sanitizado = useMemo(() => sanitizarHtml(html), [html]);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizado }}
    />
  );
}
