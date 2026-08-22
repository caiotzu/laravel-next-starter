"use client";

import { useEffect, useState } from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { Release, ReleaseContexto, ReleaseTipo } from "@/domains/admin/release/types/release.model";

const OPCOES_TIPO: { valor: ReleaseTipo; label: string }[] = [
  { valor: "feature", label: "Novidade" },
  { valor: "improvement", label: "Melhoria" },
  { valor: "fix", label: "Correção" },
  { valor: "change", label: "Alteração" },
];

const OPCOES_CONTEXTO: { valor: ReleaseContexto; label: string }[] = [
  { valor: "admin", label: "Admin" },
  { valor: "private", label: "Private" },
];

export interface ReleaseFormValues {
  contexto: ReleaseContexto;
  titulo: string;
  conteudo: string;
  tipo: ReleaseTipo;
  versao: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  release?: Release | null;
  isLoading?: boolean;
  onSubmit: (values: ReleaseFormValues) => void;
}

const VALORES_INICIAIS: ReleaseFormValues = {
  contexto: "private",
  titulo: "",
  conteudo: "",
  tipo: "feature",
  versao: "",
};

export function ReleaseFormDialog({ open, onOpenChange, release, isLoading, onSubmit }: Props) {
  const [values, setValues] = useState<ReleaseFormValues>(VALORES_INICIAIS);

  useEffect(() => {
    if (!open) return;

    setValues(
      release
        ? {
            contexto: release.contexto ?? "private",
            titulo: release.titulo,
            conteudo: release.conteudo,
            tipo: release.tipo,
            versao: release.versao,
          }
        : VALORES_INICIAIS
    );
  }, [open, release]);

  const valido = values.titulo.trim().length > 0
    && values.conteudo.trim().length > 0
    && values.versao.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{release ? "Editar release" : "Nova release"}</DialogTitle>
          <DialogDescription>
            {release
              ? "As alterações não afetam o status de publicação."
              : "A release é criada como rascunho — publique quando estiver pronta."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contexto">Contexto</Label>
              <Select
                value={values.contexto}
                onValueChange={(value) => setValues((v) => ({ ...v, contexto: value as ReleaseContexto }))}
              >
                <SelectTrigger id="contexto" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPCOES_CONTEXTO.map((opcao) => (
                    <SelectItem key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={values.tipo}
                onValueChange={(value) => setValues((v) => ({ ...v, tipo: value as ReleaseTipo }))}
              >
                <SelectTrigger id="tipo" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OPCOES_TIPO.map((opcao) => (
                    <SelectItem key={opcao.valor} value={opcao.valor}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              value={values.titulo}
              onChange={(e) => setValues((v) => ({ ...v, titulo: e.target.value }))}
              placeholder="Ex: Nova tela de relatórios"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="versao">Versão</Label>
            <Input
              id="versao"
              value={values.versao}
              onChange={(e) => setValues((v) => ({ ...v, versao: e.target.value }))}
              placeholder="Ex: 1.6.0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo</Label>
            <Textarea
              id="conteudo"
              rows={5}
              className="min-h-[120px] resize-y"
              value={values.conteudo}
              onChange={(e) => setValues((v) => ({ ...v, conteudo: e.target.value }))}
              placeholder="Descreva a novidade para o usuário final"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!valido || isLoading}
            onClick={() => onSubmit(values)}
            className="gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {release ? "Salvar alterações" : "Criar release"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
