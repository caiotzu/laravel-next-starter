"use client";

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
import { Switch } from "@/components/ui/switch";

import {
  ESTADOS_LABELS,
  ESTADOS_MAP,
  getLabelByUF,
} from "@/constants/estados";
import { EmpresaFilters } from "@/domains/admin/empresa/types/empresa.filters";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";

interface Props {
  filters: EmpresaFilters;
  setFilters: React.Dispatch<React.SetStateAction<EmpresaFilters>>;
  grupos: GrupoEmpresa[];
  isLoadingGrupos: boolean;
  matrizes: Empresa[];
  isLoadingMatrizes: boolean;
}

export function EmpresasFilters({
  filters,
  setFilters,
  grupos,
  isLoadingGrupos,
  matrizes,
  isLoadingMatrizes,
}: Props) {
  function updateFilter<K extends keyof EmpresaFilters>(
    key: K,
    value: EmpresaFilters[K]
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

      <CardContent className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2 w-64">
          <Label>Grupo Empresa</Label>

          <Combobox
            items={grupos}
            value={grupos.find((item) => item.id === filters.grupo_empresa_id) ?? null}
            onValueChange={(item) => {
              if (!item) {
                updateFilter("grupo_empresa_nome", "");
                updateFilter("grupo_empresa_id", "");
                return;
              }

              setFilters((prev) => ({
                ...prev,
                grupo_empresa_nome: item.nome,
                grupo_empresa_id: item.id,
                page: 1,
              }));
            }}
            itemToStringLabel={(item) => item?.nome ?? ""}
          >
            <ComboboxInput
              value={filters.grupo_empresa_nome ?? ""}
              showClear
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  grupo_empresa_nome: e.target.value,
                  grupo_empresa_id: "",
                  page: 1,
                }));
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
        </div>

        <div className="flex flex-col gap-2 w-64">
          <Label>Matriz</Label>

          <Combobox
            items={matrizes}
            value={matrizes.find((item) => item.id === filters.matriz_id) ?? null}
            onValueChange={(item) => {
              if (!item) {
                updateFilter("matriz_nome", "");
                updateFilter("matriz_id", "");
                return;
              }

              setFilters((prev) => ({
                ...prev,
                matriz_nome: item.nomeFantasia,
                matriz_id: item.id,
                page: 1,
              }));
            }}
            itemToStringLabel={(item) => item?.nomeFantasia ?? ""}
          >
            <ComboboxInput
              value={filters.matriz_nome ?? ""}
              showClear
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  matriz_nome: e.target.value,
                  matriz_id: "",
                  page: 1,
                }));
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
        </div>

        <div className="flex flex-col gap-2 w-64">
          <Label>CNPJ</Label>
          <Input
            value={filters.cnpj ?? ""}
            onChange={(e) => {
              updateFilter("cnpj", e.target.value);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Nome Fantasia</Label>
          <Input
            value={filters.nome_fantasia ?? ""}
            onChange={(e) => updateFilter("nome_fantasia", e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Razão Social</Label>
          <Input
            value={filters.razao_social ?? ""}
            onChange={(e) => updateFilter("razao_social", e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Inscrição Estadual</Label>
          <Input
            value={filters.inscricao_estadual ?? ""}
            onChange={(e) => updateFilter("inscricao_estadual", e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Inscrição Municipal</Label>
          <Input
            value={filters.inscricao_municipal ?? ""}
            onChange={(e) =>
              updateFilter("inscricao_municipal", e.target.value)
            }
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2 w-64">
          <Label>UF</Label>

          <Combobox
            items={ESTADOS_LABELS}
            value={filters.uf ? getLabelByUF(filters.uf) : null}
            onValueChange={(label) =>
              updateFilter("uf", label ? ESTADOS_MAP.get(label) : undefined)
            }
          >
            <ComboboxInput placeholder="Selecione a UF" showClear />

            <ComboboxContent>
              <ComboboxEmpty>
                Nenhum estado encontrado.
              </ComboboxEmpty>

              <ComboboxList>
                {(item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

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

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.excluido ?? false}
            onCheckedChange={(value) => updateFilter("excluido", value)}
          />
          <Label>Excluídas</Label>
        </div>
      </CardContent>
    </Card>
  );
}
