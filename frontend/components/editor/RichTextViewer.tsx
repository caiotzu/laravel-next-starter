"use client";

import { useMemo } from "react";

import DOMPurify from "dompurify";

interface Props {
  html: string;
  className?: string;
}

/**
 * O conteúdo vem do RichTextEditor (Tiptap) preenchido por administradores
 * — fonte relativamente confiável, mas sanitizamos mesmo assim antes de
 * injetar via dangerouslySetInnerHTML, já que é HTML de fato (negrito,
 * listas, links) e não apenas texto.
 */
export function RichTextViewer({ html, className }: Props) {
  const sanitizado = useMemo(() => {
    if (typeof window === "undefined") return "";
    return DOMPurify.sanitize(html);
  }, [html]);

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: sanitizado }}
    />
  );
}
