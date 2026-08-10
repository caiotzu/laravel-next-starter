"use client";

import { useEffect, useState } from "react";

import { PerPage } from "@/components/data-tables/PerPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"

import { AUDITORIA_ACAO_OPTIONS } from "@/constants/auditoria-acao";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { useAuditoriaEntidadeRegistros } from "@/domains/admin/auditoria/hooks/useAuditoriaEntidadeRegistros";
import {
  AuditoriaEntidadeOption,
  AuditoriaEntidadeRegistro,
} from "@/domains/admin/auditoria/types/auditoria-entidade";
import { AuditoriaFilters } from "@/domains/admin/auditoria/types/auditoria.filters";

interface Props {
  filters: AuditoriaFilters;
  setFilters: React.Dispatch<React.SetStateAction<AuditoriaFilters>>;
  usuarios: AuditoriaEntidadeRegistro[];
  isLoadingUsuarios: boolean;
  entidades: AuditoriaEntidadeOption[];
}

export function AuditoriasFilters({
  filters,
  setFilters,
  usuarios,
  isLoadingUsuarios,
  entidades,
}: Props) {
  // Só a busca (parâmetro enviado à API) é debounced; o valor exibido no
  // input continua instantâneo (filters.entidade_nome), evitando disparar
  // uma requisição a cada tecla digitada.
  const buscaRegistroDebounced = useDebouncedValue(filters.entidade_nome, 1000);

  const { data: registrosEntidade, isLoading: isLoadingRegistrosEntidade } =
    useAuditoriaEntidadeRegistros(
      filters.entidade_tabela || undefined,
      { busca: buscaRegistroDebounced, por_pagina: 10 },
    );

  // Guardamos o item selecionado localmente, desacoplado da lista de
  // sugestões (que é refeita a cada busca) para que o valor exibido no
  // Combobox não "suma" quando a nova busca não retorna o mesmo item.
  const [selectedRegistro, setSelectedRegistro] =
    useState<AuditoriaEntidadeRegistro | null>(null);
  const [selectedUsuario, setSelectedUsuario] =
    useState<AuditoriaEntidadeRegistro | null>(null);

  // Sincroniza a seleção inicial (ex: filtros vindos da URL) assim que a
  // lista estiver disponível.
  useEffect(() => {
    if (filters.entidade_id && !selectedRegistro) {
      const found = registrosEntidade?.find(
        (item) => item.id === filters.entidade_id
      );
      if (found) setSelectedRegistro(found);
    }
  }, [registrosEntidade, filters.entidade_id, selectedRegistro]);

  useEffect(() => {
    if (filters.usuario_id && !selectedUsuario) {
      const found = usuarios.find((item) => item.id === filters.usuario_id);
      if (found) setSelectedUsuario(found);
    }
  }, [usuarios, filters.usuario_id, selectedUsuario]);

  function updateFilter<K extends keyof AuditoriaFilters>(
    key: K,
    value: AuditoriaFilters[K]
  ) {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1,
    }));
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtros</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-12 items-end gap-4">
        <div className="col-span-12 flex flex-col gap-2 sm:col-span-6 md:col-span-3">
          <Label>Entidade</Label>

          <Select
            value={filters.entidade_tabela ?? "todas"}
            onValueChange={(value) => {
              setSelectedRegistro(null);
              setFilters((prev) => ({
                ...prev,
                entidade_tabela: value === "todas" ? "" : value,
                entidade_id: "",
                entidade_nome: "",
                page: 1,
              }));
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>

              {entidades.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-12 flex flex-col gap-2 sm:col-span-6 md:col-span-6">
          <Label>Registro</Label>
          <Combobox
            items={registrosEntidade ?? []}
            value={selectedRegistro}
            disabled={!filters.entidade_tabela}
            onValueChange={(item) => {
              setSelectedRegistro(item);

              if (!item) {
                updateFilter("entidade_nome", "");
                updateFilter("entidade_id", "");
                return;
              }

              setFilters((prev) => ({
                ...prev,
                entidade_id: item.id,
                entidade_nome: item.label,
                page: 1,
              }));
            }}
            itemToStringLabel={(item) => item?.label ?? ""}
          >
            <ComboboxInput
              className="w-full"
              placeholder="Pesquise um registro..."
              value={filters.entidade_nome ?? ""}
              disabled={!filters.entidade_tabela}
              showClear
              onChange={(e) => {
                setSelectedRegistro(null);
                setFilters((prev) => ({
                  ...prev,
                  entidade_nome: e.target.value,
                  entidade_id: "",
                  page: 1,
                }));
              }}
            />

            <ComboboxContent>
              <ComboboxEmpty>
                {isLoadingRegistrosEntidade
                  ? "Carregando..."
                  : "Nenhum registro encontrado."}
              </ComboboxEmpty>

              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item.id} value={item}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="col-span-12 flex flex-col gap-2 sm:col-span-6 md:col-span-3">
          <Label>Ação</Label>

          <Select
            value={filters.acao ?? "todas"}
            onValueChange={(value) =>
              updateFilter("acao", value === "todas" ? "" : value)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>

              {AUDITORIA_ACAO_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-12 flex flex-col gap-2 sm:col-span-6 md:col-span-6">
          <Label>Usuário</Label>

          <Combobox
            items={usuarios}
            value={selectedUsuario}
            onValueChange={(item) => {
              setSelectedUsuario(item);

              if (!item) {
                updateFilter("usuario_nome", "");
                updateFilter("usuario_id", "");
                return;
              }

              setFilters((prev) => ({
                ...prev,
                usuario_nome: item.label,
                usuario_id: item.id,
                page: 1,
              }));
            }}
            itemToStringLabel={(item) => item?.label ?? ""}
          >
            <ComboboxInput
              className="w-full"
              value={filters.usuario_nome ?? ""}
              showClear
              onChange={(e) => {
                setSelectedUsuario(null);
                setFilters((prev) => ({
                  ...prev,
                  usuario_nome: e.target.value,
                  usuario_id: "",
                  page: 1,
                }));
              }}
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
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="col-span-12 flex flex-col gap-2 sm:col-span-6 md:col-span-2">
          <Label>Data Início</Label>
          <Input
            type="date"
            value={filters.data_inicio ?? ""}
            onChange={(e) => updateFilter("data_inicio", e.target.value)}
            className="w-full"
          />
        </div>

        <div className="col-span-12 flex flex-col gap-2 sm:col-span-6 md:col-span-2">
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={filters.data_fim ?? ""}
            onChange={(e) => updateFilter("data_fim", e.target.value)}
            className="w-full"
          />
        </div>

        <div className="col-span-12 flex flex-col gap-2 sm:col-span-3 md:col-span-2">
          <PerPage
            perPage={filters.por_pagina ?? 10}
            onChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                por_pagina: value,
                page: 1,
              }))
            }
          />
        </div>

        <div className="col-span-12 flex items-center space-x-2 sm:col-span-6 md:col-span-4">
          <Switch
            id="auditoria-incluir-dependentes"
            checked={filters.incluir_dependentes}
            onCheckedChange={(checked) => {
              setFilters((prev) => ({
                ...prev,
                incluir_dependentes: checked,
                page: 1
              }))
            }}
            
          />
          <Label htmlFor="auditoria-incluir-dependentes">
            Incluir dependentes
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}