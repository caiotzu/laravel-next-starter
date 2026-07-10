"use client";

import { useEffect, useState } from "react";

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
import { atualizarEmpresaContato, cadastrarEmpresaContato, excluirEmpresaContato } from "@/domains/admin/empresa-contato/services/empresaContatoService";
import { EmpresaContatoRequest } from "@/domains/admin/empresa-contato/types/empresaContato.requests";
import { EmpresaContatoResponse } from "@/domains/admin/empresa-contato/types/empresaContato.responses";
import { atualizarEmpresaEndereco, cadastrarEmpresaEndereco, excluirEmpresaEndereco } from "@/domains/admin/empresa-endereco/services/empresaEnderecoService";
import { EmpresaEnderecoRequest } from "@/domains/admin/empresa-endereco/types/empresaEndereco.requests";
import { EmpresaEnderecoResponse } from "@/domains/admin/empresa-endereco/types/empresaEndereco.responses";
import { useMunicipios } from "@/domains/admin/lookup/hooks/useMunicipios";
import {
  consultarCep,
  listarMunicipios,
} from "@/domains/admin/lookup/services/lookupService";
import {
  ConsultarCepResponse,
  MunicipioLookupItem,
} from "@/domains/admin/lookup/types/lookup.responses";
import { maskCEP, maskCNPJ, maskPhone, onlyDigits } from "@/lib/utils";

import { EmpresaContatoFormData, empresaContatoSchema } from "../../empresa-contato/schemas/empresa-contato.schema";
import { EmpresaEnderecoFormData, empresaEnderecoSchema } from "../../empresa-endereco/schemas/empresa-endereco.schema";
import {
  empresaSchemaEdicao,
  EmpresaFormDataEdicao,
} from "../schemas/empresa.schema";

import { EmpresaContatosTab } from "./EmpresaContatosTab";
import { EmpresaEnderecosTab } from "./EmpresaEnderecosTab";

interface EmpresaFormEdicaoProps {
  empresaId: string;
  defaultValues?: EmpresaFormDataEdicao;
  grupoEmpresaNome?: string;
  matrizEmpresaNome?: string;
  initialMunicipios?: Array<MunicipioLookupItem | null>;
  successMessage?: string;
  onDismissSuccessMessage?: () => void;
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

function createTelefoneContato(): EmpresaContatoFormData {
  return {
    tipo: "T",
    valor: "",
    principal: false,
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
  empresaId,
  defaultValues,
  grupoEmpresaNome = "",
  matrizEmpresaNome = "",
  initialMunicipios = [],
  successMessage,
  onDismissSuccessMessage,
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
    clearErrors,
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
  const [activeTab, setActiveTab] = useState(successMessage ? "enderecos" : "dados");
  const [isSavingEndereco, setIsSavingEndereco] = useState(false);
  const [isSavingContato, setIsSavingContato] = useState(false);
  const [matrizNome, setMatrizNome] = useState(matrizEmpresaNome);
  const [matrizBusca, setMatrizBusca] = useState(matrizEmpresaNome);
  const [matrizSelecionada, setMatrizSelecionada] = useState<Empresa | null>(null);
  const [grupoEmpresaNomeAtual, setGrupoEmpresaNomeAtual] = useState(
    grupoEmpresaNome
  );
  const [municipioNome, setMunicipioNome] = useState("");
  const [municipioBusca, setMunicipioBusca] = useState("");
  const [municipioSelecionado, setMunicipioSelecionado] =
    useState<MunicipioLookupItem | null>(null);
  const [enderecosMunicipios, setEnderecosMunicipios] = useState<
    Array<MunicipioLookupItem | null>
  >(initialMunicipios);
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
  const [shouldLookupCep, setShouldLookupCep] = useState(false);

  const cnpjRegister = register("cnpj");

  useEffect(() => {
    if (defaultValues && !isInitialized) {
      reset(defaultValues);
      setEnderecosMunicipios(initialMunicipios);
      setIsInitialized(true);
    }
  }, [defaultValues, initialMunicipios, isInitialized, reset]);

  useEffect(() => {
    if (registerSetError) {
      registerSetError(setError);
    }
  }, [registerSetError, setError]);

  useEffect(() => {
    setMatrizNome(matrizEmpresaNome);
    setMatrizBusca(matrizEmpresaNome);
  }, [matrizEmpresaNome]);

  useEffect(() => {
    setGrupoEmpresaNomeAtual(grupoEmpresaNome);
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
      por_pagina: 10,
    },
    true
  );

  const matrizes = matrizesData?.data ?? [];
  const municipios = municipiosData ?? [];
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

      const nextCep = maskCEP(response.cep ?? "");
      const nextLogradouro = response.logradouro ?? "";
      const nextBairro = response.bairro ?? "";

      setEnderecoDraft((prev) => ({
        ...prev,
        cep: nextCep,
        logradouro: nextLogradouro,
        bairro: nextBairro,
      }));

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

            const mesmoNome = item.nome.toLowerCase() === response.cidade.toLowerCase();
            const mesmaUf = !response.uf || item.uf.toLowerCase() === response.uf.toLowerCase();

            return mesmoNome && mesmaUf;
          }) ?? municipiosEncontrados[0];

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
    if (!shouldLookupCep || enderecoCepDigits.length !== 8) {
      setCepLookupMessage(undefined);
      return;
    }

    const timeout = setTimeout(() => {
      consultarCepMutation(enderecoCepDigits);
    }, 400);

    return () => clearTimeout(timeout);
  }, [consultarCepMutation, enderecoCepDigits, shouldLookupCep]);

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
      setShouldLookupCep(true);
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
    setShouldLookupCep(false);
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
        const enderecoSalvo = await cadastrarEmpresaEndereco(empresaId, payload);

        appendEndereco(mapEnderecoResponseToForm(enderecoSalvo));
        setEnderecosMunicipios((prev) => [
          ...prev,
          enderecoSalvo.municipio
            ? mapMunicipioToLookup(enderecoSalvo.municipio)
            : municipioSelecionado,
        ]);
      } else {
        const enderecoAtual = enderecos[editingEnderecoIndex];
        const enderecoSalvo = enderecoAtual?.id
          ? await atualizarEmpresaEndereco(empresaId, enderecoAtual.id, payload)
          : await cadastrarEmpresaEndereco(empresaId, payload);

        updateEndereco(editingEnderecoIndex, mapEnderecoResponseToForm(enderecoSalvo));
        setEnderecosMunicipios((prev) =>
          prev.map((item, index) =>
            index === editingEnderecoIndex
              ? enderecoSalvo.municipio
                ? mapMunicipioToLookup(enderecoSalvo.municipio)
                : municipioSelecionado
              : item
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
        fallbackMessage: "Erro ao salvar endereco.",
      });
    } finally {
      setIsSavingEndereco(false);
    }
  }

  async function handleSaveContato() {
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
        const contatoSalvo = await cadastrarEmpresaContato(empresaId, payload);

        appendContato(mapContatoResponseToForm(contatoSalvo));
      } else {
        const contatoAtual = contatos[editingContatoIndex];
        const contatoSalvo = contatoAtual?.id
          ? await atualizarEmpresaContato(empresaId, contatoAtual.id, payload)
          : await cadastrarEmpresaContato(empresaId, payload);

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
    setShouldLookupCep(false);
    setActiveTab("enderecos");
  }

  async function handleRemoveEndereco(index: number) {
    const endereco = enderecos[index];

    if (!endereco?.id) {
      return;
    }

    try {
      setIsSavingEndereco(true);
      await excluirEmpresaEndereco(empresaId, endereco.id);

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
        fallbackMessage: "Erro ao excluir endereco.",
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
    setActiveTab("contatos");
  }

  async function handleRemoveContato(index: number) {
    const contato = contatos[index];

    if (!contato?.id) {
      return;
    }

    try {
      setIsSavingContato(true);
      await excluirEmpresaContato(empresaId, contato.id);

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
        <CardTitle>Editar Empresa</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
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

          {successMessage && (
            <AppAlert
              variant="success"
              subtitle={successMessage}
              onClose={onDismissSuccessMessage}
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
              <div className="rounded-xl border p-6 space-y-6">
                <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label htmlFor="grupo-empresa-nome">Grupo Empresa</Label>
                  <Input
                    id="grupo-empresa-nome"
                    value={grupoEmpresaNomeAtual}
                    disabled
                    readOnly
                  />
                </div>

                <div className="col-span-12 md:col-span-4 space-y-2">
                  <Label>Matriz</Label>

                  <Combobox
                    items={matrizItems}
                    value={
                      matrizItems.find((item) => item.id === watch("matriz_id")) ?? null
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

                      setMatrizNome(item.nomeFantasia);
                      setMatrizSelecionada(item);
                      setValue("matriz_id", item.id, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    itemToStringLabel={(item) => item?.nomeFantasia ?? ""}
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
                    disabled={isLoading}
                    {...cnpjRegister}
                    value={cnpj}
                    onChange={(e) => {
                      setValue("cnpj", maskCNPJ(e.target.value ?? ""), {
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
                  <Label>
                    UF <span className="text-red-600">*</span>
                  </Label>

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
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isLoading} className="cursor-pointer">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Empresa
                  </Button>
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
                isLoading={isLoading || isSavingEndereco}
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
                isLoading={isLoading || isSavingContato}
                onDraftChange={handleContatoDraftChange}
                onSave={handleSaveContato}
                onEdit={handleEditContato}
                onRemove={handleRemoveContato}
              />
            </TabsContent>
          </Tabs>
        </CardContent>

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

function mapMunicipioToLookup(
  municipio: NonNullable<EmpresaEnderecoResponse["municipio"]>
): MunicipioLookupItem {
  return {
    id: municipio.id,
    nome: municipio.nome,
    uf: municipio.uf,
    codigo_ibge: "",
    codigo_siafi: "",
    created_at: "",
    updated_at: null,
    deleted_at: null,
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
