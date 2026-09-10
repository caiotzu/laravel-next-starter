"use client";

import { useRef } from "react";

import { FileText, Image as ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export interface AnexoValue {
  nome: string;
  conteudo: string; // base64, sem o prefixo "data:...;base64,"
  tamanho: number; // bytes
  mimeType: string;
}

interface Props {
  value: AnexoValue[];
  onChange: (anexos: AnexoValue[]) => void;
  maxArquivos: number;
  tamanhoMaximoKb: number;
  mimesPermitidos: string[];
  extensoesPermitidas: string[];
  disabled?: boolean;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function lerComoBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const resultado = reader.result as string;
      // Remove o prefixo "data:<mime>;base64," — o backend espera só o
      // base64 puro (mesmo formato do upload de avatar já existente).
      resolve(resultado.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validação aqui é só feedback imediato para o usuário — quem decide de
 * verdade é o backend (ver Http\Requests\Private\Chamado\AbrirRequest),
 * que inspeciona os bytes reais do arquivo, não a extensão/MIME
 * reportados pelo navegador.
 */
export function AnexosUploader({
  value,
  onChange,
  maxArquivos,
  tamanhoMaximoKb,
  mimesPermitidos,
  extensoesPermitidas,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const restantes = maxArquivos - value.length;
    if (restantes <= 0) {
      toast.error(`Você já atingiu o limite de ${maxArquivos} anexos.`);
      return;
    }

    const selecionados = Array.from(files).slice(0, restantes);
    const novos: AnexoValue[] = [];

    for (const file of selecionados) {
      if (!mimesPermitidos.includes(file.type)) {
        toast.error(`"${file.name}" não é um tipo de arquivo permitido.`);
        continue;
      }

      if (file.size > tamanhoMaximoKb * 1024) {
        toast.error(`"${file.name}" excede o tamanho máximo permitido.`);
        continue;
      }

      const conteudo = await lerComoBase64(file);
      novos.push({ nome: file.name, conteudo, tamanho: file.size, mimeType: file.type });
    }

    if (novos.length > 0) {
      onChange([...value, ...novos]);
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  function remover(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={extensoesPermitidas.join(",")}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={disabled}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit gap-2"
        disabled={disabled || value.length >= maxArquivos}
        onClick={() => inputRef.current?.click()}
      >
        Anexar arquivo
      </Button>

      {value.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {value.map((anexo, index) => {
            const Icon = anexo.mimeType.startsWith("image/") ? ImageIcon : FileText;

            return (
              <li
                key={`${anexo.nome}-${index}`}
                className="flex items-center justify-between gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-sm"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Icon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{anexo.nome}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatarTamanho(anexo.tamanho)}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => remover(index)}
                  disabled={disabled}
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Remover ${anexo.nome}`}
                >
                  <X className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
