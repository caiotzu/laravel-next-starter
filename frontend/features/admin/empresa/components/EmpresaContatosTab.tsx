"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  EMPRESA_CONTATO_TIPO_OPTIONS,
  EmpresaContatoTipo,
  getEmpresaContatoTipoLabel,
} from "@/constants/empresa-contato-tipos";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { atualizarEmpresaContato, cadastrarEmpresaContato, excluirEmpresaContato } from "@/domains/admin/empresa-contato/services/empresaContatoService";
import { EmpresaContato } from "@/domains/admin/empresa-contato/types/empresaContato.model";
import { maskPhone } from "@/lib/utils";

import { EmpresaContatoFormData, empresaContatoSchema } from "../../empresa-contato/schemas/empresa-contato.schema";

interface Props {
  empresa: Empresa;
  contatos: EmpresaContato[];
}

const DEFAULT_VALUES: EmpresaContatoFormData = {
  id: "",
  tipo: "T",
  valor: "",
  principal: false,
  ativo: true
};

export function EmpresaContatosTab({
  empresa,
  contatos
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    reset,
    watch
  } = useForm<EmpresaContatoFormData>({
    resolver: zodResolver(empresaContatoSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const queryClient = useQueryClient();
  const tipo = watch("tipo");
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);
  const [editingContato, setEditingContato] = useState<EmpresaContato | null>(null);
  
  
  const resetForm = (tipo?: EmpresaContatoTipo) => {
    reset({
      ...DEFAULT_VALUES,
      tipo: tipo ?? DEFAULT_VALUES.tipo,
    });

    setEditingContato(null);
  };

  const { mutate: cadastrarContatoMutation, isPending: isPendingCadastrarContato } = useMutation<
    EmpresaContato,
    AxiosError<ApiErrorResponse>,
    EmpresaContatoFormData
  >({
    mutationFn: (data) => cadastrarEmpresaContato(empresa.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["empresa", empresa.id],
      });
      toast.success("Contato cadastrado com sucesso");
      resetForm();
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao atualizar o contato"]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!messages || field === "business") return;

        setError(field as keyof EmpresaContatoFormData, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  const { mutate: atualizarContatoMutation, isPending: isPendingAtualizarContato } = useMutation<
    EmpresaContato,
    AxiosError<ApiErrorResponse>,
    {
      id: string;
      data: EmpresaContatoFormData
    }
  >({
    mutationFn: ({ id, data }) => atualizarEmpresaContato(empresa.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["empresa", empresa.id],
      });
      toast.success("Contato atualizado com sucesso");
      resetForm();
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao atualizar o contato"]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!messages || field === "business") return;

        setError(field as keyof EmpresaContatoFormData, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  const { mutate: deletarContatoMutation } = useMutation({
    mutationFn: ({ id }: { id: string }) => excluirEmpresaContato(empresa.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["empresa", empresa.id],
      });
      toast.success("Contato excluído com sucesso");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao excluir o contato");
    },
  });

  const onSubmit = (data: EmpresaContatoFormData) => {
    if (editingContato) {
      atualizarContatoMutation({
        id: editingContato.id,
        data,
      });

      return;
    }

    cadastrarContatoMutation(data);
  };

  const onEdit = (contato: EmpresaContato) => {
    setEditingContato(contato);

    reset({
      id: contato.id,
      tipo: contato.tipo,
      valor: contato.tipo === "E" ? contato.valor : maskPhone(contato.valor),
      principal: contato.principal,
      ativo: contato.ativo,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        {backendErrors && backendErrors.length > 0 && (
          <AppAlert
            variant="error"
            subtitle="Ocorreu um erro durante a operação"
            messages={backendErrors}
            onClose={() => setBackendErrors(null)}
            className="mb-6"
          />
        )}
        <CardHeader>
          <CardTitle>
            {editingContato ? "Editar Contato" : "Adicionar Contato"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label>Tipo</Label>

                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value: EmpresaContatoTipo) =>  {
                        field.onChange(value);
                        resetForm(value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>

                      <SelectContent>
                        {EMPRESA_CONTATO_TIPO_OPTIONS.map((tipo) => (
                          <SelectItem
                            key={tipo.value}
                            value={tipo.value}
                          >
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />

                {errors.tipo && (
                  <p className="text-sm text-red-700">
                    {errors.tipo.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-6 space-y-2">
                <Label htmlFor="valor">Valor</Label>

                <Controller
                  name="valor"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="valor"
                      placeholder={
                        tipo === "T"
                          ? "Digite o telefone"
                          : "Digite o e-mail"
                      }
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(
                          tipo === "T"
                            ? maskPhone(e.target.value)
                            : e.target.value
                        )
                      }
                    />
                  )}
                />

                {errors.valor && (
                  <p className="text-sm text-red-700">
                    {errors.valor.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-3 space-y-2">
                <Controller
                  name="principal"
                  control={control}
                  render={({ field }) => (
                    <div className="flex min-h-12 items-center gap-2 rounded-md px-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm">Principal</span>
                    </div>
                  )}
                />

                {errors.principal && (
                  <p className="text-sm text-red-700">
                    {errors.principal.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-3 space-y-2">
                <Controller
                  name="ativo"
                  control={control}
                  render={({ field }) => (
                    <div className="flex min-h-12 items-center gap-2 rounded-md px-3">
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                      <span className="text-sm">Ativo</span>
                    </div>
                  )}
                />

                {errors.ativo && (
                  <p className="text-sm text-red-700">
                    {errors.ativo.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <div className="flex justify-end gap-2">
                {editingContato && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => resetForm()}
                    disabled={isPendingCadastrarContato || isPendingAtualizarContato}
                  >
                    Cancelar
                  </Button>
                )}

                <AdminPermissionGuard
                  permission={
                    editingContato
                      ? "admin.empresa.contato.atualizar"
                      : "admin.empresa.contato.cadastrar"
                  }
                  disableFallback={true}
                >
                  <Button
                    type="submit"
                    disabled={
                      isPendingCadastrarContato ||
                      isPendingAtualizarContato
                    }
                  >
                    {(isPendingCadastrarContato || isPendingAtualizarContato) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}

                    {editingContato
                      ? "Salvar Alterações"
                      : "Adicionar Contato"}
                  </Button>
                </AdminPermissionGuard>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contatos Adicionados</CardTitle>
        </CardHeader>

        <CardContent>
          {!contatos.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum contato adicionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {contatos.map((item, index) => (
                  <TableRow key={`${item.tipo}-${item.valor}-${index}`}>
                    <TableCell>{getEmpresaContatoTipoLabel(item.tipo)}</TableCell>
                    <TableCell>
                      {item.tipo === "T" ? maskPhone(item.valor) : item.valor}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.principal
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {item.principal ? "Sim" : "Nao"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          item.ativo
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {item.ativo ? "Sim" : "Nao"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <AdminPermissionGuard
                            permission="admin.empresa.contato.atualizar"
                            disableFallback={true}
                          >
                            <DropdownMenuItem
                              onClick={() => onEdit(item)}
                              className="flex items-center cursor-pointer"
                            >
                              <Pencil className="h-4 w-4" />
                              Alterar
                            </DropdownMenuItem>
                          </AdminPermissionGuard>

                          <AdminPermissionGuard
                            permission="admin.empresa.contato.excluir"
                            disableFallback={true}
                          >
                            <DropdownMenuItem
                              onClick={() => deletarContatoMutation({ id: item.id })}
                              variant="destructive"
                              className="flex items-center cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </AdminPermissionGuard>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
