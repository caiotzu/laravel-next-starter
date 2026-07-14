"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Loader2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
  EMPRESA_ENDERECO_TIPO_OPTIONS,
  EmpresaEnderecoTipo,
  getEmpresaEnderecoTipoLabel,
} from "@/constants/empresa-endereco-tipos";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { atualizarEmpresaEndereco, cadastrarEmpresaEndereco, excluirEmpresaEndereco } from "@/domains/admin/empresa-endereco/services/empresaEnderecoService";
import { EmpresaEndereco } from "@/domains/admin/empresa-endereco/types/empresaEndereco.model";
import { useMunicipios } from "@/domains/admin/lookup/hooks/useMunicipios";
import { consultarCep, listarMunicipios } from "@/domains/admin/lookup/services/lookupService";
import { ConsultarCepResponse, MunicipioLookupItem } from "@/domains/admin/lookup/types/lookup.responses";
import { maskCEP } from "@/lib/utils";

import { EmpresaEnderecoFormData, empresaEnderecoSchema } from "../../empresa-endereco/schemas/empresa-endereco.schema";

interface Props {
  empresa: Empresa;
  enderecos: EmpresaEndereco[];
}

const DEFAULT_VALUES: EmpresaEnderecoFormData = {
  id: "",
  tipo: "COMERCIAL",
  municipio_id: "",
  principal: false,
  ativo: true,
  cep: "",
  logradouro: "",
  numero: "",
  bairro: "",
  complemento: "",
};

export function EmpresaEnderecosTab({
  empresa,
  enderecos
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    reset
  } = useForm<EmpresaEnderecoFormData>({
    resolver: zodResolver(empresaEnderecoSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const queryClient = useQueryClient();

  const [municipioBusca, setMunicipioBusca] = useState("");
  const [cepLookupMessage, setCepLookupMessage] = useState("");
  const [municipioSelecionado, setMunicipioSelecionado] = useState<MunicipioLookupItem | null>(null);
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);
  const [editingEndereco, setEditingEndereco] = useState<EmpresaEndereco | null>(null);

  const { data: municipios, isLoading: isLoadingMunicipios } = useMunicipios({
    page: 1,
    nome: municipioBusca || undefined,
    por_pagina: 10,
  });

  const resetForm = () => {
    reset(DEFAULT_VALUES);
    setEditingEndereco(null);
    setMunicipioSelecionado(null);
    setMunicipioBusca("");
  };

  const { mutate: cadastrarEnderecoMutation, isPending: isPendingCadastrarEndereco } = useMutation<
    EmpresaEndereco,
    AxiosError<ApiErrorResponse>,
    EmpresaEnderecoFormData
  >({
    mutationFn: (data) => cadastrarEmpresaEndereco(empresa.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["empresa", empresa.id],
      });
      toast.success("Endereço cadastrado com sucesso");
      resetForm();
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao atualizar empresa."]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!messages || field === "business") return;

        setError(field as keyof EmpresaEnderecoFormData, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  const { mutate: atualizarEnderecoMutation, isPending: isPendingAtualizarEndereco } = useMutation<
    EmpresaEndereco,
    AxiosError<ApiErrorResponse>,
    {
      id: string;
      data: EmpresaEnderecoFormData
    }
  >({
    mutationFn: ({ id, data }) => atualizarEmpresaEndereco(empresa.id, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["empresa", empresa.id],
      });
      toast.success("Endereço atualizado com sucesso");
      resetForm();
    },
    onError: (error) => {
      const apiErrors = error.response?.data?.errors;

      if (!apiErrors) {
        setBackendErrors(["Erro ao atualizar empresa."]);
        return;
      }

      if (apiErrors.business) {
        setBackendErrors(apiErrors.business);
      }

      Object.entries(apiErrors).forEach(([field, messages]) => {
        if (!messages || field === "business") return;

        setError(field as keyof EmpresaEnderecoFormData, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  const { mutate: deletarEnderecoMutation } = useMutation({
    mutationFn: ({ id }: { id: string }) => excluirEmpresaEndereco(empresa.id, id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["empresa", empresa.id],
      });
      toast.success("Endereço excluído com sucesso");
      resetForm();
    },
    onError: () => {
      toast.error("Erro ao excluir o endereço.");
    },
  });

  const { mutate: consultarCepMutation, isPending: isLoadingCep } = useMutation<
    ConsultarCepResponse,
    AxiosError<ApiErrorResponse>,
    string
  >({
    mutationFn: consultarCep,
    onSuccess: async (response) => {
      setCepLookupMessage(
        response.provider
          ? `CEP encontrado via ${response.provider}.`
          : "CEP encontrado."
      );

      setValue("cep", maskCEP(response.cep ?? ""), {
        shouldDirty: true,
        shouldValidate: true,
      });

      setValue("logradouro", response.logradouro ?? "", {
        shouldDirty: true,
        shouldValidate: true,
      });

      setValue("bairro", response.bairro ?? "", {
        shouldDirty: true,
        shouldValidate: true,
      });

      const municipioQuery = response.ibge
        ? {
            codigo_ibge: response.ibge,
            uf: response.uf ?? undefined,
            por_pagina: 1,
          }
        : response.cidade
          ? {
              nome: response.cidade,
              uf: response.uf ?? undefined,
              por_pagina: 10,
            }
          : null;

      if (!municipioQuery) {
        return;
      }

      try {
        const municipiosEncontrados = await listarMunicipios(municipioQuery);

        const municipio =
          municipiosEncontrados.find((item) => {
            if (response.ibge && item.codigo_ibge === response.ibge) {
              return true;
            }

            if (!response.cidade) {
              return false;
            }

            const mesmoNome =
              item.nome.toLowerCase() === response.cidade.toLowerCase();

            const mesmaUf =
              !response.uf ||
              item.uf.toLowerCase() === response.uf.toLowerCase();

            return mesmoNome && mesmaUf;
          }) ?? municipiosEncontrados[0];

        if (!municipio) {
          return;
        }

        setMunicipioSelecionado(municipio);
        setMunicipioBusca("");

        setValue("municipio_id", municipio.id, {
          shouldDirty: true,
          shouldValidate: true,
        });

        clearErrors("municipio_id");
      } catch {
        // Mantém preenchimento manual caso o município não seja encontrado.
      }
    },

    onError: (error) => {
      setCepLookupMessage(
        error.response?.data?.errors?.business?.[0] ??
          "Não foi possível consultar o CEP."
      );
    },
  });

  const onSubmit = (data: EmpresaEnderecoFormData) => {
    if (editingEndereco) {
      atualizarEnderecoMutation({
        id: editingEndereco.id,
        data,
      });

      return;
    }

    cadastrarEnderecoMutation(data);
  };

  const onEdit = (endereco: EmpresaEndereco) => {
    setEditingEndereco(endereco);
    setMunicipioSelecionado((endereco.municipio as MunicipioLookupItem) ?? null);
    setMunicipioBusca("");

    reset({
      id: endereco.id,
      tipo: endereco.tipo,
      municipio_id: endereco.municipioId,
      principal: endereco.principal,
      ativo: endereco.ativo,
      cep: maskCEP(endereco.cep),
      logradouro: endereco.logradouro,
      numero: endereco.numero,
      bairro: endereco.bairro,
      complemento: endereco.complemento ?? "",
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
            {editingEndereco ? "Editar Endereço" : "Adicionar Endereço"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 md:col-span-3 space-y-2">
                <Label htmlFor="cep">CEP</Label>

                <Controller
                  name="cep"
                  control={control}
                  render={({ field }) => (
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const cep = maskCEP(e.target.value);

                        field.onChange(cep);

                        setCepLookupMessage("");
                      }}
                      onBlur={(e) => {
                        field.onBlur();

                        const cep = e.target.value.replace(/\D/g, "");

                        if (cep.length === 8) {
                          consultarCepMutation(cep);
                        }
                      }}
                    />
                  )}
                />

                {isLoadingCep && (
                  <p className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Consultando CEP...
                  </p>
                )}

                {!isLoadingCep && cepLookupMessage && (
                  <p className="text-sm text-muted-foreground">
                    {cepLookupMessage}
                  </p>
                )}

                {errors.cep && (
                  <p className="text-sm text-red-700">
                    {errors.cep.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-6 space-y-2">
                <Label htmlFor="logradouro">
                  Logradouro  
                </Label>
                <Input
                  id="logradouro"
                  placeholder="Digite o logradouro"
                  {... register("logradouro")}
                />
                {errors.logradouro && (
                  <p className="text-sm text-red-700">
                    {errors.logradouro.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-3 space-y-2">
                <Label htmlFor="numero">Número</Label>
                <Input
                  id="numero"
                  placeholder="Numero"
                  {... register("numero")}
                />
                {errors.numero && (
                  <p className="text-sm text-red-700">
                    {errors.numero.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  placeholder="Complemento"
                  {... register("complemento")}
                />
                {errors.complemento && (
                  <p className="text-sm text-red-700">
                    {errors.complemento.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input
                  id="bairro"
                  placeholder="Digite o bairro"
                  {... register("bairro")}
                />
                {errors.bairro && (
                  <p className="text-sm text-red-700">
                    {errors.bairro.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label>Município</Label>

                <Combobox
                  items={municipios}
                  value={municipioSelecionado}
                  onValueChange={(item) => {
                    setMunicipioSelecionado(item);

                    setValue("municipio_id", item ? item.id : "", {
                      shouldDirty: true,
                      shouldValidate: true,
                    });

                    if (!item) {
                      setMunicipioBusca("");
                    }
                  }}
                  itemToStringLabel={(item) => item ? `${item.nome} - ${item.uf}` : "" }
                >
                  <ComboboxInput
                    placeholder="Digite o nome do município"
                    value={
                      municipioSelecionado
                        ? `${municipioSelecionado.nome} - ${municipioSelecionado.uf}`
                        : municipioBusca
                    }
                    onChange={(e) => {
                      setMunicipioSelecionado(null);
                      setMunicipioBusca(e.target.value);
                    }}
                    showClear
                  />

                  <ComboboxContent>
                    <ComboboxEmpty>
                      {isLoadingMunicipios
                        ? "Carregando..."
                        : "Nenhuma município encontrado."}
                    </ComboboxEmpty>

                    <ComboboxList>
                      {(item) => (
                        <ComboboxItem key={item.id} value={item}>
                          {item.nome} - {item.uf}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                {errors.municipio_id && (
                  <p className="text-sm text-red-700">
                    {errors.municipio_id.message}
                  </p>
                )}
              </div>

              <div className="col-span-12 md:col-span-4 space-y-2">
                <Label>Tipo</Label>

                <Controller
                  name="tipo"
                  control={control}
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value: EmpresaEnderecoTipo) => field.onChange(value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>

                      <SelectContent>
                        {EMPRESA_ENDERECO_TIPO_OPTIONS.map((tipo) => (
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

              <div className="col-span-12 md:col-span-2 space-y-2 mt-6">
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

              <div className="col-span-12 md:col-span-2 space-y-2 mt-6 md:pl-4">
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

            <div className="flex justify-end gap-2">
              {editingEndereco && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  disabled={isPendingCadastrarEndereco || isPendingAtualizarEndereco}
                >
                  Cancelar
                </Button>
              )}

              <AdminPermissionGuard
                permission={
                  editingEndereco
                    ? "admin.empresa.endereco.atualizar"
                    : "admin.empresa.endereco.cadastrar"
                }
                disableFallback={true}
              >
                <Button
                  type="submit"
                  disabled={
                    isPendingCadastrarEndereco ||
                    isPendingAtualizarEndereco
                  }
                >
                  {(isPendingCadastrarEndereco || isPendingAtualizarEndereco) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}

                  {editingEndereco
                    ? "Salvar Alterações"
                    : "Adicionar Endereço"}
                </Button>
              </AdminPermissionGuard>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereços Adicionados</CardTitle>
        </CardHeader>

        <CardContent>
          {!enderecos.length ? (
            <p className="text-sm text-muted-foreground">
              Nenhum endereço adicionado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Município</TableHead>
                  <TableHead>CEP</TableHead>
                  <TableHead>Logradouro</TableHead>
                  <TableHead>Número</TableHead>
                  <TableHead>Complemento</TableHead>
                  <TableHead>Bairro</TableHead>
                  <TableHead>Principal</TableHead>
                  <TableHead>Ativo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {enderecos.map((item, index) => (
                  <TableRow key={`${item.tipo}-${item.municipioId}-${index}`}>
                    <TableCell>{getEmpresaEnderecoTipoLabel(item.tipo)}</TableCell>
                    <TableCell>{item.municipio?.nome} - {item.municipio?.uf}</TableCell>
                    <TableCell>{maskCEP(item.cep)}</TableCell>
                    <TableCell>{item.logradouro}</TableCell>
                    <TableCell>{item.numero}</TableCell>
                    <TableCell>{item.complemento || "---"}</TableCell>
                    <TableCell>{item.bairro}</TableCell>
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
                            permission="admin.empresa.endereco.atualizar"
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
                            permission="admin.empresa.endereco.excluir"
                            disableFallback={true}
                          >
                            <DropdownMenuItem
                              onClick={() => deletarEnderecoMutation({ id: item.id })}
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
