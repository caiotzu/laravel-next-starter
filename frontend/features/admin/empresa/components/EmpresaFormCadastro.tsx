"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { Building2, Loader2, MapPinned, Phone } from "lucide-react";
import { useFieldArray, useForm, UseFormSetError } from "react-hook-form";

import { ApiErrorResponse } from "@/types/errors";

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
import {
  cadastrarEmpresaContato,
  cadastrarEmpresaEndereco,
  atualizarEmpresaContato,
  atualizarEmpresaEndereco,
  excluirEmpresaContato,
  excluirEmpresaEndereco,
} from "@/domains/admin/empresa/services/empresaService";
import {
  EmpresaContatoRequest,
  EmpresaEnderecoRequest,
} from "@/domains/admin/empresa/types/empresa.requests";
import {
  CadastrarEmpresaResponse,
  EmpresaContatoResponse,
  EmpresaEnderecoResponse,
} from "@/domains/admin/empresa/types/empresa.responses";
import { useGrupoEmpresas } from "@/domains/admin/grupo-empresa/hooks/useGrupoEmpresas";
import { useMunicipios } from "@/domains/admin/lookup/hooks/useMunicipios";
import { consultarCep, listarMunicipios } from "@/domains/admin/lookup/services/lookupService";
import { ConsultarCepResponse, MunicipioLookupItem } from "@/domains/admin/lookup/types/lookup.responses";
import { maskCEP, maskCNPJ, maskPhone, onlyDigits } from "@/lib/utils";

import {
  empresaContatoSchema,
  empresaEnderecoSchema,
  empresaSchemaCadastro,
  EmpresaContatoFormData,
  EmpresaEnderecoFormData,
  EmpresaFormDataCadastro,
} from "../schemas/empresa.schema";

import { EmpresaContatosTab } from "./EmpresaContatosTab";
import { EmpresaEnderecosTab } from "./EmpresaEnderecosTab";

interface GrupoOption {
  id: string;
  nome: string;
}

interface MatrizOption {
  id: string;
  nome_fantasia: string;
}

interface EmpresaFormCadastroProps {
  onSubmit: (data: EmpresaFormDataCadastro) => Promise<void>;
  isLoading?: boolean;
  empresaCriada?: CadastrarEmpresaResponse | null;
  backendErrors?: string[] | null;
  clearBackendErrors?: () => void;
  registerSetError?: (fn: UseFormSetError<EmpresaFormDataCadastro>) => void;
  onCloseCadastro?: () => void;
}

function createEmptyEndereco(): EmpresaEnderecoFormData {
  return {
    tipo: "COMERCIAL",
    municipio_id: "",
    principal: true,
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

function createTelefoneContato(): EmpresaContatoFormData {
  return {
    tipo: "T",
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

export function EmpresaFormCadastro({
  onSubmit,
  isLoading = false,
  empresaCriada = null,
  backendErrors = null,
  clearBackendErrors,
  registerSetError,
  onCloseCadastro,
}: EmpresaFormCadastroProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    setError,
    clearErrors,
    setValue,
    watch,
  } = useForm<EmpresaFormDataCadastro>({
    resolver: zodResolver(empresaSchemaCadastro),
    defaultValues: {
      grupo_empresa_id: "",
      matriz_id: undefined,
      cnpj: "",
      nome_fantasia: "",
      razao_social: "",
      inscricao_estadual: "",
      inscricao_municipal: "",
      uf: undefined,
      enderecos: [],
      contatos: [],
    },
  });

  const [activeTab, setActiveTab] = useState("dados");
  const [isSavingEndereco, setIsSavingEndereco] = useState(false);
  const [isSavingContato, setIsSavingContato] = useState(false);

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

  const [grupoEmpresaNome, setGrupoEmpresaNome] = useState("");
  const [matrizNome, setMatrizNome] = useState("");
  const [grupoEmpresaBusca, setGrupoEmpresaBusca] = useState("");
  const [matrizBusca, setMatrizBusca] = useState("");
  const [municipioNome, setMunicipioNome] = useState("");
  const [municipioBusca, setMunicipioBusca] = useState("");
  const [grupoSelecionado, setGrupoSelecionado] = useState<GrupoOption | null>(
    null
  );
  const [matrizSelecionada, setMatrizSelecionada] = useState<MatrizOption | null>(
    null
  );
  const [municipioSelecionado, setMunicipioSelecionado] =
    useState<MunicipioLookupItem | null>(null);
  const [enderecosMunicipios, setEnderecosMunicipios] = useState<
    Array<MunicipioLookupItem | null>
  >([]);

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
  const [cepLookupMessage, setCepLookupMessage] = useState<string>();
  const isEmpresaCriada = !!empresaCriada;
  const isDadosDisabled = isLoading || isEmpresaCriada;
  const isTabsRelacionadasDisabled = !isEmpresaCriada;

  const cnpjRegister = register("cnpj");

  useEffect(() => {
    if (registerSetError) {
      registerSetError(setError);
    }
  }, [registerSetError, setError]);

  useEffect(() => {
    if (empresaCriada) {
      setActiveTab("enderecos");
    }
  }, [empresaCriada]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setGrupoEmpresaBusca(grupoEmpresaNome);
    }, 300);

    return () => clearTimeout(timeout);
  }, [grupoEmpresaNome]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setMatrizBusca(matrizNome);
    }, 300);

    return () => clearTimeout(timeout);
  }, [matrizNome]);

  useEffect(() => {
    const nextBusca =
      municipioSelecionado &&
      municipioNome === `${municipioSelecionado.nome} - ${municipioSelecionado.uf}`
        ? municipioSelecionado.nome
        : municipioNome.trim();

    const timeout = setTimeout(() => {
      setMunicipioBusca(nextBusca);
    }, 300);

    return () => clearTimeout(timeout);
  }, [municipioNome, municipioSelecionado]);

  const { data: gruposData, isLoading: isLoadingGrupos } = useGrupoEmpresas({
    page: 1,
    nome: grupoEmpresaBusca || undefined,
    excluido: false,
    por_pagina: 10,
  });

  const { data: matrizesData, isLoading: isLoadingMatrizes } = useEmpresas({
    page: 1,
    nome_fantasia: matrizBusca || undefined,
    excluido: false,
    por_pagina: 10,
  });
  const { data: municipiosData, isLoading: isLoadingMunicipios } = useMunicipios(
    {
      page: 1,
      nome: municipioBusca || undefined,
      uf: watch("uf") || undefined,
      por_pagina: 10,
    },
    municipioBusca.length > 0
  );

  const grupos = extractCollectionItems<GrupoOption>(gruposData);
  const matrizes = extractCollectionItems<MatrizOption>(matrizesData);
  const municipios = extractCollectionItems<MunicipioLookupItem>(municipiosData);
  const grupoItems = grupoSelecionado
    ? [grupoSelecionado, ...grupos.filter((item) => item.id !== grupoSelecionado.id)]
    : grupos;
  const matrizItems = matrizSelecionada
    ? [
        matrizSelecionada,
        ...matrizes.filter((item) => item.id !== matrizSelecionada.id),
      ]
    : matrizes;
  const municipioItems = municipioSelecionado
    ? [
        municipioSelecionado,
        ...municipios.filter((item) => item.id !== municipioSelecionado.id),
      ]
    : municipios;

  const cnpj = watch("cnpj") ?? "";
  const uf = watch("uf");
  const enderecos = watch("enderecos") ?? [];
  const contatos = watch("contatos") ?? [];
  const selectedUfLabel = uf
    ? getLabelByUF(uf as Parameters<typeof getLabelByUF>[0])
    : null;
  const enderecoCepDigits = onlyDigits(enderecoDraft.cep);

  const { mutate: consultarCepMutation, isPending: isConsultandoCep } = useMutation<
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

      setEnderecoDraft((prev) => ({
        ...prev,
        cep: maskCEP(response.cep),
        logradouro: response.logradouro ?? prev.logradouro,
        bairro: response.bairro ?? prev.bairro,
      }));

      if (!response.ibge) {
        return;
      }

      try {
        const municipiosPorIbge = await listarMunicipios({
          codigo_ibge: response.ibge,
          uf: response.uf ?? undefined,
          por_pagina: 1,
        });
        const municipio = extractCollectionItems<MunicipioLookupItem>(
          municipiosPorIbge
        )[0];

        if (!municipio) {
          return;
        }

        setMunicipioSelecionado(municipio);
        setMunicipioNome(`${municipio.nome} - ${municipio.uf}`);
        setMunicipioBusca(municipio.nome);
        setEnderecoDraft((prev) => ({
          ...prev,
          municipio_id: municipio.id,
        }));
        setEnderecoDraftErrors((prev) => ({
          ...prev,
          municipio_id: undefined,
        }));
      } catch {
        // Mantem preenchimento manual caso o municipio nao seja encontrado no lookup.
      }
    },
    onError: (error) => {
      setCepLookupMessage(
        error.response?.data?.errors?.business?.[0] ??
          "Nao foi possivel consultar o CEP."
      );
    },
  });

  useEffect(() => {
    if (enderecoCepDigits.length !== 8) {
      setCepLookupMessage(undefined);
      return;
    }

    const timeout = setTimeout(() => {
      consultarCepMutation(enderecoCepDigits);
    }, 400);

    return () => clearTimeout(timeout);
  }, [consultarCepMutation, enderecoCepDigits]);

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

    if (key === "cep") {
      setCepLookupMessage(undefined);
    }
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
    setMunicipioNome("");
    setMunicipioBusca("");
    setMunicipioSelecionado(null);
    setEditingEnderecoIndex(null);
    setEnderecoDraftErrors({});
    setEnderecoGeneralError(undefined);
    setCepLookupMessage(undefined);
  }

  function resetContatoDraft(nextTipo: EmpresaContatoFormData["tipo"] = "E") {
    setContatoDraft(
      nextTipo === "T" ? createTelefoneContato() : createEmailContato()
    );
    setEditingContatoIndex(null);
    setContatoDraftErrors({});
    setContatoGeneralError(undefined);
  }

  async function handleSaveEndereco() {
    if (!empresaCriada) {
      setEnderecoGeneralError("Cadastre a empresa antes de adicionar endereços.");
      setActiveTab("dados");
      return;
    }

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

    const payload = toEmpresaEnderecoRequest(result.data);

    try {
      setIsSavingEndereco(true);
      clearErrors("enderecos");

      if (editingEnderecoIndex === null) {
        const enderecoSalvo = await cadastrarEmpresaEndereco(empresaCriada.id, payload);

        appendEndereco(
          mapEnderecoResponseToForm(enderecoSalvo)
        );
        setEnderecosMunicipios((prev) => [...prev, municipioSelecionado]);
      } else {
        const enderecoAtual = enderecos[editingEnderecoIndex];
        const enderecoSalvo = enderecoAtual?.id
          ? await atualizarEmpresaEndereco(empresaCriada.id, enderecoAtual.id, payload)
          : await cadastrarEmpresaEndereco(empresaCriada.id, payload);

        updateEndereco(
          editingEnderecoIndex,
          mapEnderecoResponseToForm(enderecoSalvo)
        );
        setEnderecosMunicipios((prev) =>
          prev.map((item, index) =>
            index === editingEnderecoIndex ? municipioSelecionado : item
          )
        );
      }

      resetEnderecoDraft();
    } catch (error) {
      applyItemErrors<EmpresaEnderecoFormData>({
        error,
        validKeys: [
          "tipo",
          "municipio_id",
          "principal",
          "ativo",
          "cep",
          "logradouro",
          "numero",
          "bairro",
          "complemento",
        ],
        setFieldErrors: setEnderecoDraftErrors,
        setGeneralError: setEnderecoGeneralError,
        fallbackMessage: "Erro ao salvar endereço.",
      });
    } finally {
      setIsSavingEndereco(false);
    }
  }

  async function handleSaveContato() {
    if (!empresaCriada) {
      setContatoGeneralError("Cadastre a empresa antes de adicionar contatos.");
      setActiveTab("dados");
      return;
    }

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

    const payload = toEmpresaContatoRequest(result.data);

    try {
      setIsSavingContato(true);
      clearErrors("contatos");

      if (editingContatoIndex === null) {
        const contatoSalvo = await cadastrarEmpresaContato(empresaCriada.id, payload);

        appendContato(mapContatoResponseToForm(contatoSalvo));
      } else {
        const contatoAtual = contatos[editingContatoIndex];
        const contatoSalvo = contatoAtual?.id
          ? await atualizarEmpresaContato(empresaCriada.id, contatoAtual.id, payload)
          : await cadastrarEmpresaContato(empresaCriada.id, payload);

        updateContato(editingContatoIndex, mapContatoResponseToForm(contatoSalvo));
      }

      resetContatoDraft(contatoDraft.tipo);
    } catch (error) {
      applyItemErrors<EmpresaContatoFormData>({
        error,
        validKeys: ["tipo", "valor", "principal", "ativo"],
        setFieldErrors: setContatoDraftErrors,
        setGeneralError: setContatoGeneralError,
        fallbackMessage: "Erro ao salvar contato.",
      });
    } finally {
      setIsSavingContato(false);
    }
  }

  function handleEditEndereco(index: number) {
    setEnderecoDraft(enderecos[index]);
    const municipio = enderecosMunicipios[index] ?? null;
    setMunicipioSelecionado(municipio);
    setMunicipioNome(municipio ? `${municipio.nome} - ${municipio.uf}` : "");
    setMunicipioBusca(municipio?.nome ?? "");
    setEditingEnderecoIndex(index);
    setEnderecoDraftErrors({});
    setEnderecoGeneralError(undefined);
    setCepLookupMessage(undefined);
  }

  async function handleRemoveEndereco(index: number) {
    const endereco = enderecos[index];

    if (!empresaCriada || !endereco?.id) {
      return;
    }

    try {
      setIsSavingEndereco(true);
      await excluirEmpresaEndereco(empresaCriada.id, endereco.id);

      removeEndereco(index);
      setEnderecosMunicipios((prev) => prev.filter((_, itemIndex) => itemIndex !== index));

      if (editingEnderecoIndex === index) {
        resetEnderecoDraft();
      } else if (
        editingEnderecoIndex !== null &&
        index < editingEnderecoIndex
      ) {
        setEditingEnderecoIndex(editingEnderecoIndex - 1);
      }
    } catch (error) {
      applyItemErrors<EmpresaEnderecoFormData>({
        error,
        validKeys: [],
        setFieldErrors: setEnderecoDraftErrors,
        setGeneralError: setEnderecoGeneralError,
        fallbackMessage: "Erro ao excluir endereço.",
      });
    } finally {
      setIsSavingEndereco(false);
    }
  }

  function handleMunicipioInputChange(value: string) {
    setMunicipioNome(value);
    setMunicipioSelecionado(null);
    setEnderecoDraft((prev) => ({
      ...prev,
      municipio_id: "",
    }));
    setEnderecoDraftErrors((prev) => ({
      ...prev,
      municipio_id: undefined,
    }));
    setEnderecoGeneralError(undefined);
  }

  function handleMunicipioSelect(item: MunicipioLookupItem | null) {
    if (!item) {
      handleMunicipioInputChange("");
      return;
    }

    setMunicipioSelecionado(item);
    setMunicipioNome(`${item.nome} - ${item.uf}`);
    setMunicipioBusca(item.nome);
    setEnderecoDraft((prev) => ({
      ...prev,
      municipio_id: item.id,
    }));
    setEnderecoDraftErrors((prev) => ({
      ...prev,
      municipio_id: undefined,
    }));
  }

  function handleEditContato(index: number) {
    setContatoDraft(contatos[index]);
    setEditingContatoIndex(index);
    setContatoDraftErrors({});
    setContatoGeneralError(undefined);
  }

  async function handleRemoveContato(index: number) {
    const contato = contatos[index];

    if (!empresaCriada || !contato?.id) {
      return;
    }

    try {
      setIsSavingContato(true);
      await excluirEmpresaContato(empresaCriada.id, contato.id);

      const removedTipo = contato.tipo ?? "E";
      removeContato(index);

      if (editingContatoIndex === index) {
        resetContatoDraft(removedTipo);
      } else if (
        editingContatoIndex !== null &&
        index < editingContatoIndex
      ) {
        setEditingContatoIndex(editingContatoIndex - 1);
      }
    } catch (error) {
      applyItemErrors<EmpresaContatoFormData>({
        error,
        validKeys: [],
        setFieldErrors: setContatoDraftErrors,
        setGeneralError: setContatoGeneralError,
        fallbackMessage: "Erro ao excluir contato.",
      });
    } finally {
      setIsSavingContato(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cadastrar Empresa</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <input type="hidden" {...register("grupo_empresa_id")} />
        <input type="hidden" {...register("matriz_id")} />
        <input type="hidden" {...register("uf")} />

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

          {isEmpresaCriada && (
            <AppAlert
              variant="success"
              subtitle="A empresa foi cadastrada. Agora você já pode adicionar endereços e contatos."
              className="mb-6"
            />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="dados">
                <Building2 className="h-4 w-4" />
                Dados da Empresa
              </TabsTrigger>
              <TabsTrigger value="enderecos" disabled={isTabsRelacionadasDisabled}>
                <MapPinned className="h-4 w-4" />
                Endereços
              </TabsTrigger>
              <TabsTrigger value="contatos" disabled={isTabsRelacionadasDisabled}>
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
                    items={grupoItems}
                    value={
                      grupoItems.find(
                        (item) => item.id === watch("grupo_empresa_id")
                      ) ?? null
                    }
                    onValueChange={(item) => {
                      if (!item) {
                        setGrupoEmpresaNome("");
                        setGrupoSelecionado(null);
                        setValue("grupo_empresa_id", "", {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        return;
                      }

                      setGrupoEmpresaNome(item.nome);
                      setGrupoSelecionado(item);
                      setValue("grupo_empresa_id", item.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    itemToStringLabel={(item) => item?.nome ?? ""}
                  >
                    <ComboboxInput
                      placeholder="Digite o nome do grupo..."
                      value={grupoEmpresaNome}
                      showClear
                      disabled={isDadosDisabled}
                      onChange={(e) => {
                        setGrupoEmpresaNome(e.target.value);
                        setGrupoSelecionado(null);
                        setValue("grupo_empresa_id", "", {
                          shouldDirty: true,
                          shouldValidate: true,
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
                        setValue("matriz_id", undefined, {
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
                      disabled={isDadosDisabled}
                      onChange={(e) => {
                        setMatrizNome(e.target.value);
                        setMatrizSelecionada(null);
                        setValue("matriz_id", undefined, {
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
                    disabled={isDadosDisabled}
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
                    disabled={isDadosDisabled}
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
                    Razão Social <span className="text-red-600">*</span>
                  </Label>
                  <Input
                    id="razao_social"
                    placeholder="Digite a razao social"
                    disabled={isDadosDisabled}
                    {...register("razao_social")}
                  />
                  {errors.razao_social && (
                    <p className="text-sm text-red-700">
                      {errors.razao_social.message}
                    </p>
                  )}
                </div>

                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                  <Input
                    id="inscricao_estadual"
                    placeholder="Digite a inscricao estadual"
                    disabled={isDadosDisabled}
                    {...register("inscricao_estadual")}
                  />
                  {errors.inscricao_estadual && (
                    <p className="text-sm text-red-700">
                      {errors.inscricao_estadual.message}
                    </p>
                  )}
                </div>

                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                  <Input
                    id="inscricao_municipal"
                    placeholder="Digite a inscricao municipal"
                    disabled={isDadosDisabled}
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
                      disabled={isDadosDisabled}
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
              <EmpresaEnderecosTab
                draft={enderecoDraft}
                items={enderecos}
                municipioInputValue={municipioNome}
                selectedMunicipio={municipioSelecionado}
                municipioItems={municipioItems}
                municipiosByIndex={enderecosMunicipios}
                isLoadingMunicipios={isLoadingMunicipios}
                isLoadingCep={isConsultandoCep}
                cepLookupMessage={cepLookupMessage}
                draftErrors={enderecoDraftErrors}
                generalError={enderecoGeneralError ?? errors.enderecos?.message}
                editingIndex={editingEnderecoIndex}
                isLoading={isSavingEndereco}
                onDraftChange={handleEnderecoDraftChange}
                onMunicipioInputChange={handleMunicipioInputChange}
                onMunicipioSelect={handleMunicipioSelect}
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
                isLoading={isSavingContato}
                onDraftChange={handleContatoDraftChange}
                onSave={handleSaveContato}
                onEdit={handleEditContato}
                onRemove={handleRemoveContato}
              />
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex justify-end gap-5 pt-6">
          <Button asChild variant="outline">
            <Link href="/admin/empresas" className="gap-2">
              Cancelar
            </Link>
          </Button>

          {!isEmpresaCriada ? (
            <Button type="submit" disabled={isLoading} className="cursor-pointer">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar Empresa
            </Button>
          ) : (
            <Button
              type="button"
              onClick={onCloseCadastro}
              className="cursor-pointer"
            >
              Concluir Cadastro
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}

function toEmpresaEnderecoRequest(
  data: EmpresaEnderecoFormData
): EmpresaEnderecoRequest {
  return {
    tipo: data.tipo,
    municipio_id: data.municipio_id,
    principal: data.principal,
    ativo: data.ativo,
    cep: onlyDigits(data.cep),
    logradouro: data.logradouro,
    numero: data.numero,
    bairro: data.bairro,
    complemento: data.complemento || undefined,
  };
}

function toEmpresaContatoRequest(
  data: EmpresaContatoFormData
): EmpresaContatoRequest {
  return {
    tipo: data.tipo,
    valor: data.tipo === "T" ? onlyDigits(data.valor) : data.valor,
    principal: data.principal,
    ativo: data.ativo,
  };
}

function mapEnderecoResponseToForm(
  response: EmpresaEnderecoResponse
): EmpresaEnderecoFormData {
  return {
    id: response.id,
    tipo: response.tipo as EmpresaEnderecoFormData["tipo"],
    municipio_id: response.municipio_id,
    principal: response.principal,
    ativo: response.ativo,
    cep: maskCEP(response.cep),
    logradouro: response.logradouro,
    numero: response.numero,
    bairro: response.bairro,
    complemento: response.complemento ?? "",
  };
}

function mapContatoResponseToForm(
  response: EmpresaContatoResponse
): EmpresaContatoFormData {
  return {
    id: response.id,
    tipo: response.tipo as EmpresaContatoFormData["tipo"],
    valor: response.tipo === "T" ? maskPhone(response.valor) : response.valor,
    principal: response.principal,
    ativo: response.ativo,
  };
}

function applyItemErrors<T extends object>({
  error,
  validKeys,
  setFieldErrors,
  setGeneralError,
  fallbackMessage,
}: {
  error: unknown;
  validKeys: Array<keyof T>;
  setFieldErrors: (value: Partial<Record<keyof T, string>>) => void;
  setGeneralError: (value: string | undefined) => void;
  fallbackMessage: string;
}) {
  if (!error || !(error instanceof AxiosError)) {
    setGeneralError(fallbackMessage);
    return;
  }

  const apiErrors = error.response?.data?.errors as
    | Record<string, string[] | undefined>
    | undefined;

  if (!apiErrors) {
    setGeneralError(fallbackMessage);
    return;
  }

  const nextFieldErrors = {} as Partial<Record<keyof T, string>>;
  const generalMessages: string[] = [];

  Object.entries(apiErrors).forEach(([field, messages]) => {
    if (!messages?.[0]) {
      return;
    }

    if (field === "business") {
      generalMessages.push(...messages);
      return;
    }

    if (validKeys.includes(field as keyof T)) {
      nextFieldErrors[field as keyof T] = messages[0];
      return;
    }

    generalMessages.push(messages[0]);
  });

  setFieldErrors(nextFieldErrors);
  setGeneralError(generalMessages[0] ?? fallbackMessage);
}

function extractCollectionItems<T>(payload: unknown): T[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const directData = (payload as { data?: unknown }).data;

  if (Array.isArray(directData)) {
    return directData as T[];
  }

  if (directData && typeof directData === "object") {
    const nestedData = (directData as { data?: unknown }).data;

    if (Array.isArray(nestedData)) {
      return nestedData as T[];
    }
  }

  return [];
}
