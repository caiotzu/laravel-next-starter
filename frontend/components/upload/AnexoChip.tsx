"use client";

import { useState } from "react";

import { AlertCircle, Download, FileText, Image as ImageIcon } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

/**
 * Imagens abrem num Dialog (mesmo componente de modal já usado no resto do
 * sistema — ver ReleaseFormDialog, por exemplo) em vez de navegar para uma
 * nova aba. Documentos (PDF etc.) continuam abrindo em nova aba, como já
 * funcionava — o armazenamento/envio do anexo não muda em nada aqui, só a
 * forma de visualizar.
 */
export function AnexoChip({ anexo }: { anexo: AnexoExibicao }) {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [erroAoCarregar, setErroAoCarregar] = useState(false);

  const ehImagem = anexo.mime_type.startsWith("image/");
  const Icon = ehImagem ? ImageIcon : FileText;

  if (!ehImagem) {
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

  return (
    <>
      <button
        type="button"
        onClick={() => setDialogAberto(true)}
        className="flex items-center gap-2 rounded-md border bg-background/60 px-2.5 py-1.5 text-xs transition-colors hover:bg-background"
      >
        <Icon className="size-3.5 shrink-0" />
        <span className="max-w-40 truncate">{anexo.nome_original}</span>
        <span className="shrink-0 opacity-70">{formatarTamanho(anexo.tamanho)}</span>
      </button>

      <Dialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate pr-6">{anexo.nome_original}</DialogTitle>
          </DialogHeader>

          {erroAoCarregar ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center text-sm text-muted-foreground">
              <AlertCircle className="size-8" />
              <p>Não foi possível carregar esta imagem.</p>
              <a
                href={anexo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                <Download className="size-3.5" />
                Tentar abrir em uma nova aba
              </a>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={anexo.url}
              alt={anexo.nome_original}
              className="max-h-[70vh] w-full rounded-md object-contain"
              onError={() => setErroAoCarregar(true)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
