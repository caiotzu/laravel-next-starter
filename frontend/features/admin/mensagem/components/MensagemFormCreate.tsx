"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Send, User } from "lucide-react";
import { useForm } from "react-hook-form";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";

import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";
import { useUsuarios } from "@/domains/admin/usuario/hooks/useUsuarios";
import { Usuario } from "@/domains/admin/usuario/types/usuario.model";

import {
  mensagemSchemaCadastro,
  MensagemFormDataCadastro,
} from "../schemas/mensagem.schema";

interface MensagemFormCreateProps {
  onSubmit: (data: MensagemFormDataCadastro) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
}

export function MensagemFormCreate({
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
}: MensagemFormCreateProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<MensagemFormDataCadastro>({
    resolver: zodResolver(mensagemSchemaCadastro),
    defaultValues: {
      titulo: "",
      conteudo: "",
      direcionamento_tipo: "grupo_empresa",
      grupo_empresa_id: undefined,
      usuario_id: undefined,
    },
  });

  const direcionamentoTipo = watch("direcionamento_tipo");

  const [grupoEmpresaBusca, setGrupoEmpresaBusca] = useState("");
  const [usuarioBusca, setUsuarioBusca] = useState("");

  const { data: gruposData, isLoading: isLoadingGrupos } = useGrupoEmpresas({
    page: 1,
    excluido: false,
    por_pagina: 10,
    nome: grupoEmpresaBusca || undefined,
  });
  const grupos = (gruposData?.data ?? []) as GrupoEmpresa[];
  const grupoSelecionado =
    grupos.find((item) => item.id === watch("grupo_empresa_id")) ?? null;

  const { data: usuariosData, isLoading: isLoadingUsuarios } = useUsuarios({
    page: 1,
    excluido: false,
    por_pagina: 10,
    nome: usuarioBusca || undefined,
  });
  const usuarios = (usuariosData?.data ?? []) as Usuario[];
  const usuarioSelecionado =
    usuarios.find((item) => item.id === watch("usuario_id")) ?? null;

  async function handleFormSubmit(data: MensagemFormDataCadastro) {
    await onSubmit(data);
    reset();
    setGrupoEmpresaBusca("");
    setUsuarioBusca("");
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Enviar mensagem</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-6 pt-2">
          {backendErrors && backendErrors.length > 0 && (
            <AppAlert
              variant="error"
              subtitle="Ocorreu um erro durante a operação"
              messages={backendErrors}
              onClose={clearBackendErrors}
              className="mb-6"
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="titulo">
              Título <span className="text-red-600">*</span>
            </Label>
            <input
              id="titulo"
              type="text"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Ex: Manutenção programada no sistema"
              {...register("titulo")}
            />
            {errors.titulo && (
              <p className="text-sm text-red-700">{errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">
              Conteúdo <span className="text-red-600">*</span>
            </Label>
            <Textarea
              id="conteudo"
              rows={5}
              placeholder="Digite o conteúdo da mensagem..."
              {...register("conteudo")}
            />
            {errors.conteudo && (
              <p className="text-sm text-red-700">{errors.conteudo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Direcionamento <span className="text-red-600">*</span>
            </Label>

            <ToggleGroup
              type="single"
              variant="outline"
              value={direcionamentoTipo}
              onValueChange={(value) => {
                if (!value) return;

                setValue(
                  "direcionamento_tipo",
                  value as MensagemFormDataCadastro["direcionamento_tipo"],
                  { shouldDirty: true, shouldValidate: true }
                );

                setValue("grupo_empresa_id", undefined);
                setValue("usuario_id", undefined);
              }}
              className="justify-start"
            >
              <ToggleGroupItem value="grupo_empresa" className="gap-2 px-4">
                <Building2 className="h-4 w-4" />
                Grupo de empresa
              </ToggleGroupItem>
              <ToggleGroupItem value="usuario" className="gap-2 px-4">
                <User className="h-4 w-4" />
                Usuário
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {direcionamentoTipo === "grupo_empresa" && (
            <div className="space-y-2">
              <Label>
                Grupo de empresa <span className="text-red-600">*</span>
              </Label>

              <Combobox
                items={grupos}
                value={grupoSelecionado}
                onValueChange={(item) => {
                  setValue("grupo_empresa_id", item ? item.id : undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  if (!item) setGrupoEmpresaBusca("");
                }}
                itemToStringLabel={(item) => item?.nome ?? ""}
              >
                <ComboboxInput
                  placeholder="Digite o nome do grupo de empresa..."
                  value={grupoSelecionado?.nome ?? grupoEmpresaBusca}
                  onChange={(e) => setGrupoEmpresaBusca(e.target.value)}
                  showClear
                />

                <ComboboxContent>
                  <ComboboxEmpty>
                    {isLoadingGrupos
                      ? "Carregando..."
                      : "Nenhum grupo de empresa encontrado."}
                  </ComboboxEmpty>

                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.nome}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {errors.grupo_empresa_id && (
                <p className="text-sm text-red-700">
                  {errors.grupo_empresa_id.message}
                </p>
              )}
            </div>
          )}

          {direcionamentoTipo === "usuario" && (
            <div className="space-y-2">
              <Label>
                Usuário <span className="text-red-600">*</span>
              </Label>

              <Combobox
                items={usuarios}
                value={usuarioSelecionado}
                onValueChange={(item) => {
                  setValue("usuario_id", item ? item.id : undefined, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });

                  if (!item) setUsuarioBusca("");
                }}
                itemToStringLabel={(item) => item?.nome ?? ""}
              >
                <ComboboxInput
                  placeholder="Digite o nome do usuário..."
                  value={usuarioSelecionado?.nome ?? usuarioBusca}
                  onChange={(e) => setUsuarioBusca(e.target.value)}
                  showClear
                />

                <ComboboxContent>
                  <ComboboxEmpty>
                    {isLoadingUsuarios
                      ? "Carregando..."
                      : "Nenhum usuário encontrado."}
                  </ComboboxEmpty>

                  <ComboboxList>
                    {(item) => (
                      <ComboboxItem key={item.id} value={item}>
                        {item.nome}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {errors.usuario_id && (
                <p className="text-sm text-red-700">
                  {errors.usuario_id.message}
                </p>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-2 pt-6">
          <Button type="submit" disabled={isLoading} className="gap-2 cursor-pointer">
            <Send className="h-4 w-4" />
            {isLoading ? "Enviando..." : "Enviar mensagem"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
