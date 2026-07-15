"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Building2, Loader2, MapPinned, Phone } from "lucide-react";
import { useFieldArray, useForm, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";

import { ApiErrorResponse } from "@/types/errors";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

import { AppAlert } from "@/components/feedback/AppAlert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ESTADOS_LABELS,
  ESTADOS_MAP,
  getLabelByUF,
  UF,
} from "@/constants/estados";
import { useEmpresas } from "@/domains/admin/empresa/hooks/useEmpresas";
import { editarEmpresa } from "@/domains/admin/empresa/services/empresaService";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { maskCNPJ, onlyAlphaNumeric } from "@/lib/utils";

import {
  empresaSchemaEdicao,
  EmpresaFormDataEdicao,
} from "../schemas/empresa.schema";

import { EmpresaContatosTab } from "./EmpresaContatosTab";
import { EmpresaEnderecosTab } from "./EmpresaEnderecosTab";

interface EmpresaFormEdicaoProps {
  empresa: Empresa;
}

export function EmpresaFormEdit({ empresa }: EmpresaFormEdicaoProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    watch,
  } = useForm<EmpresaFormDataEdicao>({
    resolver: zodResolver(empresaSchemaEdicao),
    defaultValues: {
      grupo_empresa_id: empresa.grupoEmpresaId,
      matriz_id: empresa.matrizId ?? undefined,
      cnpj: maskCNPJ(empresa.cnpj),
      nome_fantasia: empresa.nomeFantasia,
      razao_social: empresa.razaoSocial,
      inscricao_estadual: empresa.inscricaoEstadual ?? undefined,
      inscricao_municipal: empresa.inscricaoMunicipal ?? undefined,
      uf: empresa.uf as UF,
    },
  });
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState("dados");
  const [matrizBusca, setMatrizBusca] = useState("");
  const [backendErrors, setBackendErrors] = useState<string[] | null>(null);

  const { data: matrizesData , isLoading: isLoadingMatrizes} = useEmpresas({
    page: 1,
    excluido: false,
    por_pagina: 10,
    id: matrizBusca ? undefined : empresa.matrizId ?? undefined,
    nome_fantasia: matrizBusca || undefined,
  });
  const matrizes = (matrizesData?.data ?? []) as Empresa[];
  const matrizSelecionada = matrizes.find((item) => item.id === watch("matriz_id")) ?? null;

  const { mutate: atualizarEmpresaMutation, isPending: isPendingAtualizarEmpresa } = useMutation<
    Empresa,
    AxiosError<ApiErrorResponse>,
    EmpresaFormDataEdicao
  >({
    mutationFn: (data) => editarEmpresa(empresa.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["empresa", empresa.id],
      });

      toast.success("Empresa atualizada com sucesso");
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

        setError(field as keyof EmpresaFormDataEdicao, {
          type: "server",
          message: messages[0],
        });
      });
    },
  });

  const onSubmitEmpresa = (data: EmpresaFormDataEdicao) => {
    atualizarEmpresaMutation({
      ...data,
      cnpj: onlyAlphaNumeric(data.cnpj),
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Editar Empresa</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {backendErrors && backendErrors.length > 0 && (
          <AppAlert
            variant="error"
            subtitle="Ocorreu um erro durante a operação"
            messages={backendErrors}
            onClose={() => setBackendErrors(null)}
            className="mb-6"
          />
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="dados">
              <Building2 className="h-4 w-4" />
              Dados da Empresa
            </TabsTrigger>
            <TabsTrigger value="enderecos">
              <MapPinned className="h-4 w-4" />
              Enderecos
            </TabsTrigger>
            <TabsTrigger value="contatos">
              <Phone className="h-4 w-4" />
              Contatos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="pt-4">
            <form onSubmit={handleSubmit(onSubmitEmpresa)}>
              <div className="rounded-xl border p-6 space-y-6">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label htmlFor="grupo-empresa-nome">Grupo Empresa</Label>
                    <Input
                      id="grupo-empresa-nome"
                      value={empresa.grupoEmpresa?.nome}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label>Matriz</Label>

                    <Combobox
                      items={matrizes}
                      value={matrizSelecionada}
                      onValueChange={(item) => {
                        setValue("matriz_id", item?.id ?? undefined, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });

                        if (!item) {
                          setMatrizBusca("");
                        }
                      }}
                      itemToStringLabel={(item) => item?.nomeFantasia ?? ""}
                    >
                      <ComboboxInput
                        placeholder="Digite o nome da matriz..."
                        value={matrizSelecionada?.nomeFantasia ?? matrizBusca}
                        onChange={(e) => setMatrizBusca(e.target.value)}
                        showClear
                      />

                      <ComboboxContent>
                        <ComboboxEmpty>
                          {isLoadingMatrizes
                            ? "Carregando..."
                            : "Nenhuma matriz encontrada."}
                        </ComboboxEmpty>

                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item.id} value={item}>
                              {item.nomeFantasia}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>

                    {errors.matriz_id && (
                      <p className="text-sm text-red-700">
                        {errors.matriz_id.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label htmlFor="cnpj">
                      CNPJ <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      {...register("cnpj", {
                        onChange: (e) => {
                          e.target.value = maskCNPJ(e.target.value);
                        },
                      })}
                    />
                    {errors.cnpj && (
                      <p className="text-sm text-red-700">{errors.cnpj.message}</p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label htmlFor="nome_fantasia">
                      Nome Fantasia <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="nome_fantasia"
                      placeholder="Digite o nome fantasia"
                      {...register("nome_fantasia")}
                    />
                    {errors.nome_fantasia && (
                      <p className="text-sm text-red-700">
                        {errors.nome_fantasia.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label htmlFor="razao_social">
                      Razao Social <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="razao_social"
                      placeholder="Digite a razao social"
                      {...register("razao_social")}
                    />
                    {errors.razao_social && (
                      <p className="text-sm text-red-700">
                        {errors.razao_social.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label htmlFor="inscricao_estadual">Inscricao Estadual</Label>
                    <Input
                      id="inscricao_estadual"
                      placeholder="Digite a inscricao estadual"
                      {...register("inscricao_estadual")}
                    />
                    {errors.inscricao_estadual && (
                      <p className="text-sm text-red-700">
                        {errors.inscricao_estadual.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label htmlFor="inscricao_municipal">Inscricao Municipal</Label>
                    <Input
                      id="inscricao_municipal"
                      placeholder="Digite a inscricao municipal"
                      {...register("inscricao_municipal")}
                    />
                    {errors.inscricao_municipal && (
                      <p className="text-sm text-red-700">
                        {errors.inscricao_municipal.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label>
                      UF <span className="text-red-600">*</span>
                    </Label>

                    <Combobox
                      items={ESTADOS_LABELS}
                      value={
                        watch("uf")
                          ? getLabelByUF(watch("uf")!)
                          : null
                      }
                      onValueChange={(label) =>
                        setValue(
                          "uf",
                          (label
                            ? ESTADOS_MAP.get(label)
                            : undefined) as EmpresaFormDataEdicao["uf"],
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        )
                      }
                    >
                      <ComboboxInput
                        placeholder="Selecione a UF"
                        showClear
                      />

                      <ComboboxContent>
                        <ComboboxEmpty>Nenhum estado encontrado.</ComboboxEmpty>

                        <ComboboxList>
                          {(item) => (
                            <ComboboxItem key={item} value={item}>
                              {item}
                            </ComboboxItem>
                          )}
                        </ComboboxList>
                      </ComboboxContent>
                    </Combobox>

                    {errors.uf && (
                      <p className="text-sm text-red-700">{errors.uf.message}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <AdminPermissionGuard 
                    permission="admin.empresa.atualizar"
                    disableFallback={true}
                  >
                    <Button
                      type="submit"
                      disabled={isPendingAtualizarEmpresa}
                      className="cursor-pointer"
                    >
                      {isPendingAtualizarEmpresa && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Salvar Empresa
                    </Button>
                  </AdminPermissionGuard>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="enderecos" className="pt-4">
            <AdminPermissionGuard 
							permissions={[
								"admin.empresa.endereco.atualizar",
								"admin.empresa.endereco.cadastrar",
								"admin.empresa.endereco.excluir",
								"admin.empresa.endereco.listar",
								"admin.empresa.endereco.visualizar",
              ]}
						>
              <EmpresaEnderecosTab
                empresa={empresa}
                enderecos={empresa.enderecos ?? []}
              />
            </AdminPermissionGuard>
          </TabsContent>

          <TabsContent value="contatos" className="pt-4">
            <AdminPermissionGuard 
							permissions={[
								"admin.empresa.contato.atualizar",
								"admin.empresa.contato.cadastrar",
								"admin.empresa.contato.excluir",
								"admin.empresa.contato.listar",
								"admin.empresa.contato.visualizar",
              ]}
						>
              <EmpresaContatosTab
                empresa={empresa}
                contatos={empresa.contatos ?? []}
              />
            </AdminPermissionGuard>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}