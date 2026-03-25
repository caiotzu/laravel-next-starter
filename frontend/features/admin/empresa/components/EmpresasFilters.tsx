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

interface Grupo {
  id: string;
  nome: string;
}

interface EmpresaOption {
  id: string;
  nome_fantasia: string;
}

export interface EmpresaFilters {
  id?: string;
  grupoEmpresaNome?: string;
  grupoEmpresaId?: string;
  matrizNome?: string;
  matrizId?: string;
  cnpj?: string;
  nomeFantasia?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  uf?: UF;
  ativo: boolean;
  excluido: boolean;
}

interface Props {
  filters: EmpresaFilters;
  updateFilter: <K extends keyof EmpresaFilters>(
    key: K,
    value: EmpresaFilters[K]
  ) => void;
  grupos: Grupo[];
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
          <Label>ID</Label>
          <Input
            placeholder="UUID da empresa..."
            value={filters.id ?? ""}
            onChange={(e) => updateFilter("id", e.target.value || undefined)}
          />
        </div>

        {/* Grupo Empresa */}
        <div className="flex flex-col gap-2 w-64">
          <Label>Grupo Empresa</Label>

          <Combobox
            items={grupos}
            value={grupos.find((item) => item.id === filters.grupoEmpresaId) ?? null}
            onValueChange={(item) => {
              if (!item) {
                updateFilter("grupoEmpresaNome", undefined);
                updateFilter("grupoEmpresaId", undefined);
                return;
              }

              updateFilter("grupoEmpresaNome", item.nome);
              updateFilter("grupoEmpresaId", item.id);
            }}
            itemToStringLabel={(item) => item?.nome ?? ""}
          >
            <ComboboxInput
              placeholder="Digite o nome do grupo..."
              value={filters.grupoEmpresaNome ?? ""}
              showClear
              onChange={(e) => {
                updateFilter("grupoEmpresaNome", e.target.value || undefined);
                updateFilter("grupoEmpresaId", undefined);
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
            value={matrizes.find((item) => item.id === filters.matrizId) ?? null}
            onValueChange={(item) => {
              if (!item) {
                updateFilter("matrizNome", undefined);
                updateFilter("matrizId", undefined);
                return;
              }

              updateFilter("matrizNome", item.nome_fantasia);
              updateFilter("matrizId", item.id);
            }}
            itemToStringLabel={(item) => item?.nome_fantasia ?? ""}
          >
            <ComboboxInput
              placeholder="Digite o nome da matriz..."
              value={filters.matrizNome ?? ""}
              showClear
              onChange={(e) => {
                updateFilter("matrizNome", e.target.value || undefined);
                updateFilter("matrizId", undefined);
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
            placeholder="Digite o CNPJ (14 dígitos)..."
            value={filters.cnpj ?? ""}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "").slice(0, 14);
              updateFilter("cnpj", value || undefined);
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Nome Fantasia</Label>
          <Input
            placeholder="Digite o nome fantasia..."
            value={filters.nomeFantasia ?? ""}
            onChange={(e) => updateFilter("nomeFantasia", e.target.value || undefined)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Razão Social</Label>
          <Input
            placeholder="Digite a razão social..."
            value={filters.razaoSocial ?? ""}
            onChange={(e) => updateFilter("razaoSocial", e.target.value || undefined)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Inscrição Estadual</Label>
          <Input
            placeholder="Digite a inscrição estadual..."
            value={filters.inscricaoEstadual ?? ""}
            onChange={(e) => updateFilter("inscricaoEstadual", e.target.value || undefined)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Inscrição Municipal</Label>
          <Input
            placeholder="Digite a inscrição municipal..."
            value={filters.inscricaoMunicipal ?? ""}
            onChange={(e) =>
              updateFilter("inscricaoMunicipal", e.target.value || undefined)
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
            checked={filters.ativo}
            onCheckedChange={(value) => updateFilter("ativo", value)}
          />
          <Label>Ativas</Label>
        </div>

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
