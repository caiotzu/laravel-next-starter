import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";

import { getUsuarioStatusBorder, getUsuarioStatusLabel, USUARIO_STATUS_OPTIONS } from "@/constants/usuario-status";
import { alterarStatusUsuarioGrupoEmpresa, redefinirSenhaUsuarioGrupoEmpresa } from "@/domains/admin/usuario-grupo-empresa/services/usuarioGrupoEmpresaService";
import { formatDate } from "@/lib/utils";

import { UsuarioGrupoEmpresaFormDataAlteraStatus, usuarioGrupoEmpresaSchemaAlteraStatus } from "../schemas/usuarioGrupoEmpresa.schema";

import { UsuarioGrupoEmpresa } from "@/domains/admin/usuario-grupo-empresa/types/usuario.model";
interface Props {
  usuario: UsuarioGrupoEmpresa;
}

interface RedefinirSenhaProps {
  usuarioId: string;
  grupoId: string;
}

interface AlterarStatusProps {
  usuarioId: string;
  grupoId: string;
  data: {
    status: string
  }
}

type ModalState = {
  tipo: "alterarStatus" | null;
};

export function UsuarioCard({ usuario }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    reset,
    formState: { errors },
  } = useForm<UsuarioGrupoEmpresaFormDataAlteraStatus>({
    resolver: zodResolver(usuarioGrupoEmpresaSchemaAlteraStatus),
    defaultValues: {
      status: usuario.status
    },
  });


  const queryClient = useQueryClient();
  const [modal, setModal] = useState<ModalState>({ tipo: null });

  const canEditStatus = usuario.status !== "convidado" && usuario.status !== "expirado";
  const statusOptions = canEditStatus
      ? USUARIO_STATUS_OPTIONS.filter(
          (status) =>
            status.value !== "convidado" &&
            status.value !== "expirado"
        )
      : USUARIO_STATUS_OPTIONS;

  
  const { mutate: redefinirSenhaMutation } = useMutation({
    mutationFn: ({ usuarioId, grupoId }: RedefinirSenhaProps) => redefinirSenhaUsuarioGrupoEmpresa(usuarioId, grupoId),
    onSuccess: (data) => {
      toast.success(data.mensagem);
      queryClient.invalidateQueries({ queryKey: ["grupo-empresa"] });
    },
    onError: () => {
      toast.error("Erro ao redefinir a senha.");
    },
  });

  const { mutate: alterarStatusMutation, isPending: isAlterandoStatus, } = useMutation({
    mutationFn: ({ usuarioId, grupoId, data }: AlterarStatusProps) => alterarStatusUsuarioGrupoEmpresa(usuarioId, grupoId, data),
    onSuccess: () => {
      toast.success(`O status do cliente ( ${usuario.nome} foi alterado com sucesso)`);
      queryClient.invalidateQueries({ queryKey: ["grupo-empresa"] });
    },
    onError: () => {
      toast.error("Erro ao alterar o status.");
    },
  });

  const onSubmitAlterarStatus = (data: UsuarioGrupoEmpresaFormDataAlteraStatus) => {
    alterarStatusMutation({
      usuarioId: usuario.id,
      grupoId: usuario.grupoId,
      data,
    });

    setModal({ tipo: null });
  };

  return (
    <div
      className={`relative rounded-xl shadow-sm border-l-4 bg-card ${getUsuarioStatusBorder( usuario.status )} p-3`}
    >
      <div className="absolute top-2 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <AdminPermissionGuard permission="admin.grupo_empresa.usuario.redefinir_senha" disableFallback={true}>
              <DropdownMenuItem
                onClick={() =>
                  redefinirSenhaMutation({
                    usuarioId: usuario.id,
                    grupoId: usuario.grupoId,
                  })
                }
              >
                Resetar senha
              </DropdownMenuItem>
            </AdminPermissionGuard>
            <AdminPermissionGuard permission="admin.grupo_empresa.usuario.atualizar_status" disableFallback={true}>
              <DropdownMenuItem
                onClick={() => {
                  reset({
                    status: usuario.status,
                  });
                  setModal({ tipo: "alterarStatus" });
                }}
              >
                Altera status
              </DropdownMenuItem>
            </AdminPermissionGuard>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex justify-center mb-2">
        <div className="h-18 w-18 rounded-full bg-muted flex items-center justify-center overflow-hidden">
          <Avatar className="h-18 w-18 transition-all duration-300 group-hover:scale-105">
            <AvatarImage src={usuario.avatar ?? undefined} />
            <AvatarFallback>
                <User className="h-6 w-6 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>

      <div className="text-center mb-2">
        <p className="font-medium text-sm text-foreground">
          {usuario.nome}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {usuario.email}
        </p>
      </div>

      <div className="text-xs space-y-1">
        <p>
          <span className="font-medium text-foreground">Criado:</span>{" "}
          <span className="text-muted-foreground">
            {formatDate(usuario.createdAt)}
          </span>
        </p>

        <p>
          <span className="font-medium text-foreground">Último Acesso:</span>{" "}
          <span className="text-muted-foreground">
            {formatDate(usuario.ultimoLoginEm)}
          </span>
        </p>
        <p>
          <span className="font-medium text-foreground">Status:</span>{" "}
          <span className="text-muted-foreground">
            {getUsuarioStatusLabel(usuario.status)}
          </span>
        </p>
        <p>
          <span className="font-medium text-foreground">2FA:</span>{" "}
          <span className="text-muted-foreground">
            {usuario.google2faEnable
              ? "Ativado"
              : "Desativado"}
          </span>
        </p>
      </div>

      

      {/* ----------------- Modais compartilhados ----------------- */}
      {modal.tipo === "alterarStatus" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setModal({ tipo: null })}
          />

          {/* Modal */}
          <div className="relative z-10 w-full max-w-md rounded-lg border bg-background p-6 shadow-xl">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">
                Alterar status do usuário
              </h2>

              <p className="text-sm text-muted-foreground">
                Altere o status de <strong>{usuario.nome}</strong>.
              </p>
            </div>

            <form
              onSubmit={handleSubmit(onSubmitAlterarStatus)}
              className="mt-6 space-y-4"
            >
              <div className="space-y-2">
                <Label>Status</Label>

                <Combobox
                  disabled={!canEditStatus}
                  items={statusOptions}
                  value={
                    statusOptions.find(
                      (s) => s.value === watch("status")
                    ) ?? null
                  }
                  onValueChange={(s) =>
                    setValue("status", s?.value ?? "", {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
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
                    onChange={() =>
                      setValue("status", "", {
                        shouldValidate: true,
                        shouldDirty: true,
                      })
                    }
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
                  <p className="text-sm text-red-600">
                    {errors.status.message}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModal({ tipo: null })}
                >
                  Cancelar
                </Button>

                <Button 
                  type="submit"
                  disabled={!canEditStatus}
                >
                  Salvar alteração
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}