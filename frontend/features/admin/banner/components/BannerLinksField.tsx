"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface BannerLinkValue {
  id?: string;
  nome: string;
  url: string;
}

interface Props {
  value: BannerLinkValue[];
  onChange: (links: BannerLinkValue[]) => void;
  maxLinks?: number;
  disabled?: boolean;
  errors?: Record<number, { nome?: string; url?: string }>;
}

/**
 * Campo de links do banner — 0, 1 ou N links (ver item 5 do pedido). Cada
 * link tem nome (texto do botão na exibição) e URL. Estrutura sempre uma
 * lista, nunca um único par nome/url solto no formulário.
 */
export function BannerLinksField({
  value,
  onChange,
  maxLinks = 10,
  disabled,
  errors,
}: Props) {
  function adicionar() {
    if (value.length >= maxLinks) return;
    onChange([...value, { nome: "", url: "" }]);
  }

  function remover(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function atualizar(index: number, campo: "nome" | "url", texto: string) {
    onChange(value.map((link, i) => (i === index ? { ...link, [campo]: texto } : link)));
  }

  return (
    <div className="flex flex-col gap-3">
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum link adicionado. O banner pode ser exibido sem nenhum link.
        </p>
      )}

      {value.map((link, index) => (
        <div
          key={link.id ?? `novo-${index}`}
          className="flex flex-col gap-2 rounded-md border p-3 sm:flex-row sm:items-start"
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`link-nome-${index}`}>
              Nome do botão <span className="text-red-600">*</span>
            </Label>
            <Input
              id={`link-nome-${index}`}
              placeholder="Ex: Conheça a campanha"
              value={link.nome}
              disabled={disabled}
              onChange={(e) => atualizar(index, "nome", e.target.value)}
              className={errors?.[index]?.nome ? "border-red-700 focus-visible:ring-red-700" : ""}
            />
            {errors?.[index]?.nome && (
              <p className="text-sm text-red-700">{errors[index]?.nome}</p>
            )}
          </div>

          <div className="flex-1 space-y-1.5">
            <Label htmlFor={`link-url-${index}`}>
              URL de destino <span className="text-red-600">*</span>
            </Label>
            <Input
              id={`link-url-${index}`}
              placeholder="https://..."
              value={link.url}
              disabled={disabled}
              onChange={(e) => atualizar(index, "url", e.target.value)}
              className={errors?.[index]?.url ? "border-red-700 focus-visible:ring-red-700" : ""}
            />
            {errors?.[index]?.url && (
              <p className="text-sm text-red-700">{errors[index]?.url}</p>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-6 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => remover(index)}
            disabled={disabled}
            aria-label="Remover link"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-fit"
        onClick={adicionar}
        disabled={disabled || value.length >= maxLinks}
      >
        Adicionar link
      </Button>
    </div>
  );
}
