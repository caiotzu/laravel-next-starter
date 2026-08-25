"use client";

import { RichTextViewer } from "@/components/editor/RichTextViewer";
import { AnexoChip } from "@/components/upload/AnexoChip";

import { ChamadoMensagem } from "@/domains/private/chamado/types/chamado.model";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";



interface Props {
  mensagem: ChamadoMensagem;
  ehPropria: boolean;
}

/**
 * Inspirado numa conversa (mensagens próprias à direita, da outra parte à
 * esquerda), mas usando só Card/Badge/tipografia já do design system —
 * nenhuma cor ou componente novo fora do padrão do restante do sistema.
 */
export function ChamadoMensagemBubble({ mensagem, ehPropria }: Props) {
  return (
    <div className={cn("flex flex-col gap-1", ehPropria ? "items-end" : "items-start")}>
      <span className="px-1 text-xs font-medium text-muted-foreground">
        {ehPropria ? "Você" : (mensagem.usuario.nome ?? "Suporte")}
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
