"use client";

import { useRef } from "react";

import Image from "next/image";

import { ArrowDown, ArrowUp, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export type BannerImagemValue =
  | { tipo: "existente"; id: string; url: string }
  | { tipo: "nova"; nome: string; conteudo: string; previewUrl: string };

interface Props {
  value: BannerImagemValue[];
  onChange: (imagens: BannerImagemValue[]) => void;
  maxImagens?: number;
  disabled?: boolean;
}

const MIMES_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO_KB = 5 * 1024;

function lerComoBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1] ?? "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Uploader de imagens do banner. Mesma lógica de leitura/validação do
 * AnexosUploader (components/upload/AnexosUploader.tsx) — base64 puro,
 * validação client-side só como feedback imediato, quem decide de verdade
 * é o backend (ver BannerService::armazenarImagem) — mas com suporte a
 * MÚLTIPLAS imagens ordenáveis (setas ao invés de drag-and-drop, para não
 * introduzir uma dependência nova só para isso) e reaproveitamento de
 * imagens já existentes na edição (ver BannerFormEdit).
 */
export function BannerImagensUploader({
  value,
  onChange,
  maxImagens = 10,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const restantes = maxImagens - value.length;
    if (restantes <= 0) {
      toast.error(`Você já atingiu o limite de ${maxImagens} imagens.`);
      return;
    }

    const selecionados = Array.from(files).slice(0, restantes);
    const novas: BannerImagemValue[] = [];

    for (const file of selecionados) {
      if (!MIMES_PERMITIDOS.includes(file.type)) {
        toast.error(`"${file.name}" não é um tipo de imagem permitido (use JPEG, PNG ou WEBP).`);
        continue;
      }

      if (file.size > TAMANHO_MAXIMO_KB * 1024) {
        toast.error(`"${file.name}" excede o tamanho máximo permitido (5 MB).`);
        continue;
      }

      const conteudo = await lerComoBase64(file);
      novas.push({
        tipo: "nova",
        nome: file.name,
        conteudo,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (novas.length > 0) {
      onChange([...value, ...novas]);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function remover(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function mover(index: number, direcao: -1 | 1) {
    const destino = index + direcao;
    if (destino < 0 || destino >= value.length) return;

    const copia = [...value];
    [copia[index], copia[destino]] = [copia[destino], copia[index]];
    onChange(copia);
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={MIMES_PERMITIDOS.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        disabled={disabled || value.length >= maxImagens}
        onClick={() => inputRef.current?.click()}
      >
        Adicionar imagem
      </Button>

      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhuma imagem adicionada. Pelo menos 1 imagem é obrigatória.
        </p>
      )}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {value.map((imagem, index) => {
            const url = imagem.tipo === "existente" ? imagem.url : imagem.previewUrl;
            const nome = imagem.tipo === "existente" ? `Imagem ${index + 1}` : imagem.nome;

            return (
              <div
                key={imagem.tipo === "existente" ? imagem.id : `${imagem.nome}-${index}`}
                className="group relative overflow-hidden rounded-lg border bg-muted/30"
              >
                <div className="relative aspect-video w-full">
                  <Image
                    src={url}
                    alt={nome}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>

                <div className="absolute top-1 left-1 rounded bg-background/80 px-1.5 py-0.5 text-[11px] font-medium">
                  {index + 1}ª
                </div>

                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => remover(index)}
                    disabled={disabled}
                    className="rounded bg-background/80 p-1 text-muted-foreground hover:text-destructive"
                    aria-label={`Remover ${nome}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="absolute bottom-1 right-1 flex gap-1">
                  <button
                    type="button"
                    onClick={() => mover(index, -1)}
                    disabled={disabled || index === 0}
                    className="rounded bg-background/80 p-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                    aria-label="Mover para a esquerda"
                  >
                    <ArrowUp className="h-3.5 w-3.5 -rotate-90" />
                  </button>
                  <button
                    type="button"
                    onClick={() => mover(index, 1)}
                    disabled={disabled || index === value.length - 1}
                    className="rounded bg-background/80 p-1 text-muted-foreground hover:text-foreground disabled:opacity-40"
                    aria-label="Mover para a direita"
                  >
                    <ArrowDown className="h-3.5 w-3.5 -rotate-90" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
