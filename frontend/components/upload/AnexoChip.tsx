"use client";

import { FileText, Image as ImageIcon } from "lucide-react";

export interface AnexoExibicao {
  id: string;
  nome_original: string;
  url: string;
  mime_type: string;
  tamanho: number;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AnexoChip({ anexo }: { anexo: AnexoExibicao }) {
  const Icon = anexo.mime_type.startsWith("image/") ? ImageIcon : FileText;

  return (
    <a
      href={anexo.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-xs transition-colors hover:bg-background"
    >
      <Icon className="size-3.5 shrink-0" />
      <span className="max-w-40 truncate">{anexo.nome_original}</span>
      <span className="shrink-0 opacity-70">{formatarTamanho(anexo.tamanho)}</span>
    </a>
  );
}
