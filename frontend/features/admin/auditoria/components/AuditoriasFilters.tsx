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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch"

import { AUDITORIA_ACAO_OPTIONS } from "@/constants/auditoria-acao";
import { AUDITORIA_ENTIDADE_OPTIONS } from "@/constants/auditoria-entidade";
import { AuditoriaFilters } from "@/domains/admin/auditoria/types/auditoria.filters";
import { Usuario } from "@/domains/admin/usuario/types/usuario.model";

interface Props {
  filters: AuditoriaFilters;
  setFilters: React.Dispatch<React.SetStateAction<AuditoriaFilters>>;
  usuarios: Usuario[];
  isLoadingUsuarios: boolean;
}

export function AuditoriasFilters({
  filters,
  setFilters,
  usuarios,
  isLoadingUsuarios,
}: Props) {
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

      <CardContent className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2 w-64">
          <Label>Entidade</Label>

          <Select
            value={filters.entidade_tabela ?? "todas"}
            onValueChange={(value) => {
              setFilters((prev) => ({
                ...prev,
                entidade_tabela: value === "todas" ? "" : value,
                entidade_id: "",
                page: 1,
              }));
            }}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>

            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>

              {AUDITORIA_ENTIDADE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>ID da Entidade</Label>
          <Input
            value={filters.entidade_id ?? ""}
            disabled={!filters.entidade_tabela}
            onChange={(e) => updateFilter("entidade_id", e.target.value)}
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2 w-64">
          <Label>Ação</Label>

          <Select
            value={filters.acao ?? "todas"}
            onValueChange={(value) =>
              updateFilter("acao", value === "todas" ? "" : value)
            }
          >
            <SelectTrigger className="w-64">
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

        <div className="flex flex-col gap-2 w-64">
          <Label>Usuário</Label>

          <Combobox
            items={usuarios}
            value={usuarios.find((item) => item.id === filters.usuario_id) ?? null}
            onValueChange={(item) => {
              if (!item) {
                updateFilter("usuario_nome", "");
                updateFilter("usuario_id", "");
                return;
              }

              setFilters((prev) => ({
                ...prev,
                usuario_nome: item.nome,
                usuario_id: item.id,
                page: 1,
              }));
            }}
            itemToStringLabel={(item) => item?.nome ?? ""}
          >
            <ComboboxInput
              value={filters.usuario_nome ?? ""}
              showClear
              onChange={(e) => {
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
                    {item.nome}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Data Início</Label>
          <Input
            type="date"
            value={filters.data_inicio ?? ""}
            onChange={(e) => updateFilter("data_inicio", e.target.value)}
            className="w-44"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Data Fim</Label>
          <Input
            type="date"
            value={filters.data_fim ?? ""}
            onChange={(e) => updateFilter("data_fim", e.target.value)}
            className="w-44"
          />
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
