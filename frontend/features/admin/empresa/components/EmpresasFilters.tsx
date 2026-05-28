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
  type UF,
} from "@/constants/estados";
import { EmpresaFilters } from "@/domains/admin/empresa/types/empresa.filters";
import { Empresa } from "@/domains/admin/empresa/types/empresa.model";
import { GrupoEmpresa } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.model";

interface EmpresaOption {
  id: string;
  nome_fantasia: string;
}

interface Props {
  filters: EmpresaFilters;
  updateFilter: <K extends keyof EmpresaFilters>(
    key: K,
    value: EmpresaFilters[K]
  ) => void;
  grupos: GrupoEmpresa[];
  isLoadingGrupos: boolean;
  matrizes: EmpresaOption[];
  isLoadingMatrizes: boolean;
  porPagina: number;
  setPorPagina: (value: number) => void;
}

export function EmpresasFilters({
  filters,
  updateFilter,
  grupos,
  isLoadingGrupos,
  matrizes,
  isLoadingMatrizes,
  porPagina,
  setPorPagina,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
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
                updateFilter("grupo_empresa_nome", undefined);
                updateFilter("grupo_empresa_id", undefined);
                return;
              }

              updateFilter("grupo_empresa_nome", item.nome);
              updateFilter("grupo_empresa_id", item.id);
            }}
            itemToStringLabel={(item) => item?.nome ?? ""}
          >
            <ComboboxInput
              value={filters.grupo_empresa_nome ?? ""}
              showClear
              onChange={(e) => {
                updateFilter("grupo_empresa_nome", e.target.value || undefined);
                updateFilter("grupo_empresa_id", undefined);
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
                updateFilter("matriz_nome", undefined);
                updateFilter("matriz_id", undefined);
                return;
              }

              updateFilter("matriz_nome", item.nome_fantasia);
              updateFilter("matriz_id", item.id);
            }}
            itemToStringLabel={(item) => item?.nome_fantasia ?? ""}
          >
            <ComboboxInput
              value={filters.matriz_nome ?? ""}
              showClear
              onChange={(e) => {
                updateFilter("matriz_nome", e.target.value || undefined);
                updateFilter("matriz_id", undefined);
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
        </div>

        <div className="flex flex-col gap-2 w-64">
          <Label>CNPJ</Label>
          <Input
            value={filters.cnpj ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              updateFilter("cnpj", value || undefined);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Nome Fantasia</Label>
          <Input
            value={filters.nome_fantasia ?? ""}
            onChange={(e) => updateFilter("nome_fantasia", e.target.value || undefined)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Razão Social</Label>
          <Input
            value={filters.razao_social ?? ""}
            onChange={(e) => updateFilter("razao_social", e.target.value || undefined)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Inscrição Estadual</Label>
          <Input
            value={filters.inscricao_estadual ?? ""}
            onChange={(e) => updateFilter("inscricao_estadual", e.target.value || undefined)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Inscrição Municipal</Label>
          <Input
            value={filters.inscricao_municipal ?? ""}
            onChange={(e) =>
              updateFilter("inscricao_municipal", e.target.value || undefined)
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

        <PerPage perPage={porPagina} onChange={setPorPagina} />

        <div className="flex items-center space-x-2">
          <Switch
            checked={filters.excluido}
            onCheckedChange={(value) => updateFilter("excluido", value)}
          />
          <Label>Excluídas</Label>
        </div>
      </CardContent>
    </Card>
  );
}
