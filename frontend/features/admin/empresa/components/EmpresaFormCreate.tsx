"use client";

import { useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, MapPinned, Phone } from "lucide-react";
import { useForm } from "react-hook-form";

import { AdminPermissionGuard } from "@/app/admin/_components/guard/AdminPermissionGuard";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ESTADOS_LABELS,
  ESTADOS_MAP,
  getLabelByUF,
} from "@/constants/estados";
import { useEmpresas } from "@/domains/admin/empresa/hooks/useEmpresas";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";
import { maskCNPJAlfanumerico } from "@/lib/utils";

import {
  empresaSchemaCadastro,
  EmpresaFormDataCadastro,
} from "../schemas/empresa.schema";

import { EmpresaFormCreateSkeleton } from "./EmpresaFormCreateSkeleton";

interface EmpresaFormCadastroProps {
  onSubmit: (data: EmpresaFormDataCadastro) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
}

export function EmpresaFormCreate({
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors
}: EmpresaFormCadastroProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EmpresaFormDataCadastro>({
    resolver: zodResolver(empresaSchemaCadastro),
    defaultValues: {
      grupo_empresa_id: undefined,
      matriz_id: undefined,
      cnpj: "",
      nome_fantasia: "",
      razao_social: "",
      inscricao_estadual: "",
      inscricao_municipal: "",
      uf: undefined,
    },
  });

  const [activeTab, setActiveTab] = useState("dados");
  const [matrizBusca, setMatrizBusca] = useState("");
  const [grupoEmpresaBusca, setGrupoEmpresaBusca] = useState("");
  
  const { data: matrizesData , isLoading: isLoadingMatrizes} = useEmpresas({
    page: 1,
    excluido: false,
    por_pagina: 10,
    nome_fantasia: matrizBusca || undefined,
  });
  const matrizes = (matrizesData?.data ?? []) as Empresa[];
  const matrizSelecionada = matrizes.find((item) => item.id === watch("matriz_id")) ?? null;

  const { data: gruposData , isLoading: isLoadingGrupos} = useGrupoEmpresas({
    page: 1,
    excluido: false,
    por_pagina: 10,
    nome: grupoEmpresaBusca || undefined,
  });
  const grupos = (gruposData?.data ?? []) as GrupoEmpresa[];
  const grupoSelecionado = grupos.find((item) => item.id === watch("grupo_empresa_id")) ?? null;
 
  if(isLoadingMatrizes || isLoadingGrupos)
    return (<EmpresaFormCreateSkeleton />);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastrar Empresa</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6 pt-6">
          {backendErrors && backendErrors.length > 0 && (
            <AppAlert
              variant="error"
              subtitle="Ocorreu um erro durante a operacao"
              messages={backendErrors}
              onClose={clearBackendErrors}
              className="mb-6"
            />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dados">
                <Building2 className="h-4 w-4" />
                Dados da Empresa
              </TabsTrigger>
              <TabsTrigger value="enderecos" disabled={true}>
                <MapPinned className="h-4 w-4" />
                Endereços
              </TabsTrigger>
              <TabsTrigger value="contatos" disabled={true}>
                <Phone className="h-4 w-4" />
                Contatos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="pt-4">
              <div className="rounded-xl border p-6">
                <div className="grid grid-cols-12 gap-6">
                  <div className="col-span-12 md:col-span-4 space-y-2">
                    <Label>Grupo Empresa <span className="text-red-600">*</span></Label>

                    <Combobox
                      items={grupos}
                      value={grupoSelecionado}
                      onValueChange={(item) => {
                        if (item) {
                          setValue("grupo_empresa_id", item.id, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        } else {
                          setValue("grupo_empresa_id", "", {
                            shouldDirty: true,
                            shouldValidate: true,
                          });

                          setGrupoEmpresaBusca("");
                        }
                      }}
                      itemToStringLabel={(item) => item?.nome ?? ""}
                    >
                      <ComboboxInput
                        placeholder="Digite o nome da grupo empresa..."
                        value={grupoSelecionado?.nome ?? grupoEmpresaBusca}
                        onChange={(e) => setGrupoEmpresaBusca(e.target.value)}
                        showClear
                      />

                      <ComboboxContent>
                        <ComboboxEmpty>
                          {isLoadingGrupos
                            ? "Carregando..."
                            : "Nenhum grupo empresa encontrado."}
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
                          e.target.value = maskCNPJAlfanumerico(e.target.value);
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
                            : undefined) as EmpresaFormDataCadastro["uf"],
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
              </div>
            </TabsContent>

            <TabsContent value="enderecos" className="pt-4">
            </TabsContent>

            <TabsContent value="contatos" className="pt-4">
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-end gap-5 pt-6">
          <Button asChild variant="outline">
            <Link href="/admin/empresas" className="gap-2">
              Cancelar
            </Link>
          </Button>

          <AdminPermissionGuard
            permission="admin.empresa.cadastrar"
            disableFallback={true}
          >
            <Button type="submit" disabled={isLoading} className="cursor-pointer">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar Empresa
            </Button>
          </AdminPermissionGuard>
          
        </CardFooter>
      </form>
    </Card>
  );
}