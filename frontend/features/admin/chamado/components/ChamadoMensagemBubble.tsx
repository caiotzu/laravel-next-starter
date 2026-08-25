"use client";


import { RichTextViewer } from "@/components/editor/RichTextViewer";
import { AnexoChip } from "@/components/upload/AnexoChip";

import { ChamadoMensagem } from "@/domains/admin/chamado/types/chamado.model";
import { cn, formatDate } from "@/lib/utils";

interface Props {
  mensagem: ChamadoMensagem;
  ehPropria: boolean;
}

export function ChamadoMensagemBubble({ mensagem, ehPropria }: Props) {
  return (
    <div className={cn("flex flex-col gap-1", ehPropria ? "items-end" : "items-start")}>
      <span className="px-1 text-xs font-medium text-muted-foreground">
        {ehPropria ? "Você" : (mensagem.usuario.nome ?? "Cliente")}
      </span>

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
          ehPropria
            ? "rounded-tr-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm border bg-muted/50"
        )}
      >
        <RichTextViewer
          html={mensagem.mensagem}
          className={ehPropria ? "prose-invert" : ""}
        />

        {mensagem.anexos.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {mensagem.anexos.map((anexo) => (
              <AnexoChip
                key={anexo.id}
                anexo={{
                  id: anexo.id,
                  nome_original: anexo.nomeOriginal,
                  url: anexo.url,
                  mime_type: anexo.mimeType,
                  tamanho: anexo.tamanho,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <span className="px-1 text-xs text-muted-foreground">
        {formatDate(mensagem.createdAt)}
      </span>
    </div>
  );
}
