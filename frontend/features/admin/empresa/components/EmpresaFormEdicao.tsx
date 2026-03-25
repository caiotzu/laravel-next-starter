"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Loader2, MapPinned, Phone } from "lucide-react";
import { useFieldArray, useForm, UseFormSetError } from "react-hook-form";

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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  ESTADOS_LABELS,
  ESTADOS_MAP,
  getLabelByUF,
} from "@/constants/estados";
import { useEmpresas } from "@/domains/admin/empresa/hooks/useEmpresas";
import { maskCNPJ } from "@/lib/utils";

import {
  empresaContatoSchema,
  empresaEnderecoSchema,
  empresaSchemaEdicao,
  EmpresaContatoFormData,
  EmpresaEnderecoFormData,
  EmpresaFormDataEdicao,
} from "../schemas/empresa.schema";

import { EmpresaContatosTab } from "./EmpresaContatosTab";
import { EmpresaEnderecosTab } from "./EmpresaEnderecosTab";

interface MatrizOption {
  id: string;
  nome_fantasia: string;
}

interface EmpresaFormEdicaoProps {
  defaultValues?: EmpresaFormDataEdicao;
  grupoEmpresaNome?: string;
  matrizEmpresaNome?: string;
  onSubmit: (data: EmpresaFormDataEdicao) => Promise<void>;
  isLoading?: boolean;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
  registerSetError?: (fn: UseFormSetError<EmpresaFormDataEdicao>) => void;
}

function createEmptyEndereco(): EmpresaEnderecoFormData {
  return {
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
}

function createEmailContato(): EmpresaContatoFormData {
  return {
    tipo: "E",
    valor: "",
    principal: true,
    ativo: true,
  };
}

function mapFieldErrors<T extends object>(
  fieldErrors: Record<string, string[] | undefined>
): Partial<Record<keyof T, string>> {
  const nextErrors = {} as Partial<Record<keyof T, string>>;

  Object.entries(fieldErrors).forEach(([key, messages]) => {
    if (Array.isArray(messages) && messages[0]) {
      nextErrors[key as keyof T] = messages[0];
    }
  });

  return nextErrors;
}

export function EmpresaFormEdicao({
  defaultValues,
  grupoEmpresaNome = "",
  matrizEmpresaNome = "",
  onSubmit,
  isLoading = false,
  backendErrors = null,
  clearBackendErrors,
  registerSetError,
}: EmpresaFormEdicaoProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    setValue,
    watch,
    reset,
  } = useForm<EmpresaFormDataEdicao>({
    resolver: zodResolver(empresaSchemaEdicao),
    defaultValues,
  });

  const { append: appendEndereco, update: updateEndereco, remove: removeEndereco } =
    useFieldArray({
      control,
      name: "enderecos",
    });
  const { append: appendContato, update: updateContato, remove: removeContato } =
    useFieldArray({
      control,
      name: "contatos",
    });

  const [isInitialized, setIsInitialized] = useState(false);
  const [matrizNome, setMatrizNome] = useState(matrizEmpresaNome);
  const [matrizBusca, setMatrizBusca] = useState(matrizEmpresaNome);
  const [matrizSelecionada, setMatrizSelecionada] = useState<MatrizOption | null>(
    null
  );
  const [enderecoDraft, setEnderecoDraft] = useState<EmpresaEnderecoFormData>(
    createEmptyEndereco()
  );
  const [contatoDraft, setContatoDraft] = useState<EmpresaContatoFormData>(
    createEmailContato()
  );
  const [editingEnderecoIndex, setEditingEnderecoIndex] = useState<number | null>(
    null
  );
  const [editingContatoIndex, setEditingContatoIndex] = useState<number | null>(
    null
  );
  const [enderecoDraftErrors, setEnderecoDraftErrors] = useState<
    Partial<Record<keyof EmpresaEnderecoFormData, string>>
  >({});
  const [contatoDraftErrors, setContatoDraftErrors] = useState<
    Partial<Record<keyof EmpresaContatoFormData, string>>
  >({});
  const [enderecoGeneralError, setEnderecoGeneralError] = useState<string>();
  const [contatoGeneralError, setContatoGeneralError] = useState<string>();

  const cnpjRegister = register("cnpj");

  useEffect(() => {
    if (defaultValues && !isInitialized) {
      reset(defaultValues);
      setIsInitialized(true);
    }
  }, [defaultValues, isInitialized, reset]);

  useEffect(() => {
    if (registerSetError) {
      registerSetError(setError);
    }
  }, [registerSetError, setError]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMatrizBusca(matrizNome);
    }, 300);

    return () => clearTimeout(timeout);
  }, [matrizNome]);

  const { data: matrizesData, isLoading: isLoadingMatrizes } = useEmpresas({
    page: 1,
    nome_fantasia: matrizBusca || undefined,
    excluido: false,
    por_pagina: 10,
  });

  const matrizes = matrizesData?.data ?? [];
  const matrizItems = matrizSelecionada
    ? [
        matrizSelecionada,
        ...matrizes.filter((item) => item.id !== matrizSelecionada.id),
      ]
    : matrizes;

  const cnpj = watch("cnpj") ?? "";
  const uf = watch("uf");
  const ativo = watch("ativo");
  const enderecos = watch("enderecos") ?? [];
  const contatos = watch("contatos") ?? [];
  const selectedUfLabel = uf
    ? getLabelByUF(uf as Parameters<typeof getLabelByUF>[0])
    : null;

  function handleEnderecoDraftChange(
    key: keyof EmpresaEnderecoFormData,
    value: string | boolean
  ) {
    setEnderecoDraft((prev) => ({
      ...prev,
      [key]: value,
    }));
    setEnderecoDraftErrors((prev) => ({
      ...prev,
      [key]: undefined,
    }));
    setEnderecoGeneralError(undefined);
  }

  function handleContatoDraftChange(
    key: keyof EmpresaContatoFormData,
    value: string | boolean
  ) {
    setContatoDraft((prev) => {
      if (key === "tipo") {
        return {
          ...prev,
          tipo: value as EmpresaContatoFormData["tipo"],
          valor: "",
        };
      }

      return {
        ...prev,
        [key]: value,
      };
    });
    setContatoDraftErrors((prev) => ({
      ...prev,
      [key]: undefined,
    }));
    setContatoGeneralError(undefined);
  }

  function resetEnderecoDraft() {
    setEnderecoDraft(createEmptyEndereco());
    setEditingEnderecoIndex(null);
    setEnderecoDraftErrors({});
    setEnderecoGeneralError(undefined);
  }

  function resetContatoDraft(nextTipo: EmpresaContatoFormData["tipo"] = "E") {
    setContatoDraft(
      nextTipo === "T"
        ? {
            tipo: "T",
            valor: "",
            principal: false,
            ativo: true,
          }
        : createEmailContato()
    );
    setEditingContatoIndex(null);
    setContatoDraftErrors({});
    setContatoGeneralError(undefined);
  }

  function handleSaveEndereco() {
    const result = empresaEnderecoSchema.safeParse(enderecoDraft);

    if (!result.success) {
      setEnderecoDraftErrors(
        mapFieldErrors<EmpresaEnderecoFormData>(result.error.flatten().fieldErrors)
      );
      return;
    }

    if (
      enderecoDraft.principal &&
      enderecos.some(
        (item, index) => index !== editingEnderecoIndex && item.principal
      )
    ) {
      setEnderecoGeneralError("Nao pode existir mais de 1 endereco principal");
      return;
    }

    if (editingEnderecoIndex === null) {
      appendEndereco(result.data);
    } else {
      updateEndereco(editingEnderecoIndex, result.data);
    }

    resetEnderecoDraft();
  }

  function handleSaveContato() {
    const result = empresaContatoSchema.safeParse(contatoDraft);

    if (!result.success) {
      setContatoDraftErrors(
        mapFieldErrors<EmpresaContatoFormData>(result.error.flatten().fieldErrors)
      );
      return;
    }

    if (
      contatoDraft.principal &&
      contatos.some(
        (item, index) =>
          index !== editingContatoIndex &&
          item.tipo === contatoDraft.tipo &&
          item.principal
      )
    ) {
      setContatoGeneralError(
        contatoDraft.tipo === "E"
          ? "Nao pode existir mais de 1 e-mail principal"
          : "Nao pode existir mais de 1 telefone principal"
      );
      return;
    }

    if (editingContatoIndex === null) {
      appendContato(result.data);
    } else {
      updateContato(editingContatoIndex, result.data);
    }

    resetContatoDraft(contatoDraft.tipo);
  }

  function handleEditEndereco(index: number) {
    setEnderecoDraft(enderecos[index]);
    setEditingEnderecoIndex(index);
    setEnderecoDraftErrors({});
    setEnderecoGeneralError(undefined);
  }

  function handleRemoveEndereco(index: number) {
    removeEndereco(index);

    if (editingEnderecoIndex === index) {
      resetEnderecoDraft();
    } else if (
      editingEnderecoIndex !== null &&
      index < editingEnderecoIndex
    ) {
      setEditingEnderecoIndex(editingEnderecoIndex - 1);
    }
  }

  function handleEditContato(index: number) {
    setContatoDraft(contatos[index]);
    setEditingContatoIndex(index);
    setContatoDraftErrors({});
    setContatoGeneralError(undefined);
  }

  function handleRemoveContato(index: number) {
    const removedTipo = contatos[index]?.tipo ?? "E";
    removeContato(index);

    if (editingContatoIndex === index) {
      resetContatoDraft(removedTipo);
    } else if (
      editingContatoIndex !== null &&
      index < editingContatoIndex
    ) {
      setEditingContatoIndex(editingContatoIndex - 1);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Editar Empresa</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("matriz_id")} />
        <input type="hidden" {...register("uf")} />
        <input type="hidden" {...register("ativo")} />

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

          <Tabs defaultValue="dados" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dados">
                <Building2 className="h-4 w-4" />
                Dados da Empresa
              </TabsTrigger>
              <TabsTrigger value="enderecos">
                <MapPinned className="h-4 w-4" />
                Endereco
              </TabsTrigger>
              <TabsTrigger value="contatos">
                <Phone className="h-4 w-4" />
                Contato
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dados" className="pt-4">
              <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label htmlFor="grupo-empresa-nome">Grupo Empresa</Label>
                  <Input
                    id="grupo-empresa-nome"
                    value={grupoEmpresaNome}
                    disabled
                    readOnly
                  />
                </div>

                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label>Matriz <span className="text-red-600">*</span></Label>

                  <Combobox
                    items={matrizItems}
                    value={
                      matrizItems.find(
                        (item) => item.id === watch("matriz_id")
                      ) ?? null
                    }
                    onValueChange={(item) => {
                      if (!item) {
                        setMatrizNome("");
                        setMatrizSelecionada(null);
                        setValue("matriz_id", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        return;
                      }

                      setMatrizNome(item.nome_fantasia);
                      setMatrizSelecionada(item);
                      setValue("matriz_id", item.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    itemToStringLabel={(item) => item?.nome_fantasia ?? ""}
                  >
                    <ComboboxInput
                      placeholder="Digite o nome da matriz..."
                      value={matrizNome}
                      showClear
                      disabled={isLoading}
                      onChange={(e) => {
                        setMatrizNome(e.target.value);
                        setMatrizSelecionada(null);
                        setValue("matriz_id", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }}
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
                            {item.nome_fantasia}
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
                    disabled={isLoading}
                    {...cnpjRegister}
                    value={cnpj}
                    onChange={(e) => {
                      setValue("cnpj", maskCNPJ(e.target.value), {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
                    {...register("inscricao_municipal")}
                  />
                  {errors.inscricao_municipal && (
                    <p className="text-sm text-red-700">
                      {errors.inscricao_municipal.message}
                    </p>
                  )}
                </div>

                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label>UF <span className="text-red-600">*</span></Label>

                  <Combobox
                    items={ESTADOS_LABELS}
                    value={selectedUfLabel}
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
                      disabled={isLoading}
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

                <div className="col-span-12 md:col-span-3 space-y-2">
                  <Label>Ativo <span className="text-red-600">*</span></Label>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Switch
                      checked={!!ativo}
                      onCheckedChange={(value) =>
                        setValue("ativo", value, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={isLoading}
                    />
                    <span className="text-sm">Empresa ativa</span>
                  </div>
                  {errors.ativo && (
                    <p className="text-sm text-red-700">{errors.ativo.message}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="enderecos" className="pt-4">
              <EmpresaEnderecosTab
                draft={enderecoDraft}
                items={enderecos}
                draftErrors={enderecoDraftErrors}
                generalError={enderecoGeneralError ?? errors.enderecos?.message}
                editingIndex={editingEnderecoIndex}
                isLoading={isLoading}
                onDraftChange={handleEnderecoDraftChange}
                onSave={handleSaveEndereco}
                onEdit={handleEditEndereco}
                onRemove={handleRemoveEndereco}
              />
            </TabsContent>

            <TabsContent value="contatos" className="pt-4">
              <EmpresaContatosTab
                draft={contatoDraft}
                items={contatos}
                draftErrors={contatoDraftErrors}
                generalError={contatoGeneralError ?? errors.contatos?.message}
                editingIndex={editingContatoIndex}
                isLoading={isLoading}
                onDraftChange={handleContatoDraftChange}
                onSave={handleSaveContato}
                onEdit={handleEditContato}
                onRemove={handleRemoveContato}
              />
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/empresas" className="gap-2">
              Cancelar
            </Link>
          </Button>

          <Button type="submit" disabled={isLoading} className="cursor-pointer">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alteracoes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
