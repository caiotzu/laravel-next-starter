"use client";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import {
  useForm,
  UseFormSetError,
} from "react-hook-form";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { USUARIO_STATUS_OPTIONS } from "@/constants/usuario-status";
import { Grupo } from "@/domains/admin/grupo/types/grupo.model";
import { Usuario } from "@/domains/admin/usuario/types/usuario.model";

import {
  UsuarioFormDataEdicao,
  usuarioSchemaEdicao,
} from "../schemas/usuario.schema";

interface Props {
  onSubmit: (
    data: UsuarioFormDataEdicao,
    setError: UseFormSetError<UsuarioFormDataEdicao>
  ) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
  usuario: Usuario;
  grupos: Grupo[];
  isLoadingGrupos: boolean;
}

export function UsuarioFormEdit({
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
  usuario,
  grupos,
  isLoadingGrupos,
}: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<UsuarioFormDataEdicao>({
    resolver: zodResolver(usuarioSchemaEdicao),

    defaultValues: {
      nome: usuario.nome,
      email: usuario.email,
      grupo_id: usuario.grupoId,
      status: usuario.status
    },
  });

  const selectedGrupoId = watch("grupo_id");
  const canEditStatus = usuario.status !== "convidado" && usuario.status !== "expirado";
  const statusOptions = canEditStatus
    ? USUARIO_STATUS_OPTIONS.filter(
        (status) =>
          status.value !== "convidado" &&
          status.value !== "expirado"
      )
    : USUARIO_STATUS_OPTIONS;

  async function handleFormSubmit(data: UsuarioFormDataEdicao) {
    const payload = canEditStatus
      ? data
      : (({ status, ...rest }) => rest)(data);

    await onSubmit(payload, setError);
  }

  return (
    <Card className="w-full">

      <CardHeader>
        <CardTitle>
          Editar Usuário
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)}>

        <CardContent className="space-y-6 pt-6">

          {backendErrors && backendErrors.length > 0 && (
            <AppAlert
              variant="error"
              subtitle="Ocorreu um erro durante a operação"
              messages={backendErrors}
              onClose={clearBackendErrors}
              className="mb-6"
            />
          )}

          <div className="grid grid-cols-12 gap-6">

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="nome">
                Nome <span className="text-red-600">*</span>
              </Label>

              <Input
                id="nome"
                disabled={isLoading}
                className={
                  errors.nome
                    ? "border-red-700 focus-visible:ring-red-700"
                    : ""
                }
                {...register("nome")}
              />

              {errors.nome && (
                <p className="text-sm text-red-700">
                  {errors.nome.message}
                </p>
              )}
            </div>

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label htmlFor="email">
                E-mail <span className="text-red-600">*</span>
              </Label>

              <Input
                id="email"
                type="email"
                disabled={isLoading}
                className={
                  errors.email
                    ? "border-red-700 focus-visible:ring-red-700"
                    : ""
                }
                {...register("email")}
              />

              {errors.email && (
                <p className="text-sm text-red-700">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="col-span-12 md:col-span-4 space-y-2">

              <Label>
                Grupo <span className="text-red-600">*</span>
              </Label>

              <Combobox
                items={grupos}
                value={
                  grupos.find((g) => g.id === selectedGrupoId) ?? null
                }
                onValueChange={(g) => {
                  setValue("grupo_id", g?.id ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                itemToStringLabel={(g) => g?.descricao ?? ""}
              >
                <ComboboxInput
                  value={
                    grupos.find((g) => g.id === selectedGrupoId)
                      ?.descricao ?? ""
                  }
                  showClear
                  onChange={() => {
                    setValue("grupo_id", "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />

                <ComboboxContent>
                  <ComboboxEmpty>
                    {isLoadingGrupos
                      ? "Carregando..."
                      : "Nenhum grupo encontrado."}
                  </ComboboxEmpty>

                  <ComboboxList>
                    {(g) => (
                      <ComboboxItem key={g.id} value={g}>
                        {g.descricao}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {errors.grupo_id && (
                <p className="text-sm text-red-700">
                  {errors.grupo_id.message}
                </p>
              )}

            </div>

            <div className="col-span-12 md:col-span-4 space-y-2">
              <Label>
                Status / Situação <span className="text-red-600">*</span>
              </Label>

              <Combobox
                disabled={!canEditStatus}
                items={statusOptions}
                value={
                  statusOptions.find(
                    (s) => s.value === watch("status")
                  ) ?? null
                }
                onValueChange={(s) => {
                  setValue("status", s?.value ?? "", {
                    shouldValidate: true,
                    shouldDirty: true,
                  });
                }}
                itemToStringLabel={(s) => s?.label ?? ""}
              >
                <ComboboxInput
                  disabled={!canEditStatus}
                  value={
                    statusOptions.find(
                      (s) => s.value === watch("status")
                    )?.label ?? ""
                  }
                  showClear
                  onChange={() => {
                    setValue("status", "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />

                <ComboboxContent>
                  <ComboboxEmpty>
                    Nenhum status encontrado.
                  </ComboboxEmpty>

                  <ComboboxList>
                    {(status) => (
                      <ComboboxItem
                        key={status.value}
                        value={status}
                      >
                        {status.label}
                      </ComboboxItem>
                    )}
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>

              {errors.status && (
                <p className="text-sm text-red-700">
                  {errors.status.message}
                </p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3 pt-6">

          <Button asChild variant="outline">
            <Link href="/admin/usuarios" className="gap-2">
              Cancelar
            </Link>
          </Button>

          <Button
            type="submit"
            disabled={isLoading}
            className="cursor-pointer"
          >
            {isLoading && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}

            {usuario ? "Salvar" : "Cadastrar"}
          </Button>

        </CardFooter>
      </form>
    </Card>
  );
}