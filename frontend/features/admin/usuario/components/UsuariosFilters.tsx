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

import { Grupo } from "@/domains/admin/grupo/types/grupo.model";
import { ListarUsuariosRequest } from "@/domains/admin/usuario/types/usuario.requests";

interface Props {
  filters: ListarUsuariosRequest;
  setFilters: React.Dispatch<React.SetStateAction<ListarUsuariosRequest>>;
  grupos: Grupo[],
  isLoadingGrupos: boolean;
}

export function UsuariosFilters({
  filters,
  setFilters,
  grupos,
  isLoadingGrupos
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtros</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-4 items-end">

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            Nome
          </label>

          <Input
            value={filters.nome ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                nome: e.target.value,
                page: 1,
              }))
            }
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2 w-64">
          <Label>Grupo</Label>

          <Combobox
            items={grupos}
            value={grupos.find((g) => g.id === filters.grupo_id) ?? null}
            onValueChange={(g) => {
              setFilters((prev) => ({
                ...prev,
                grupo_id: g?.id ?? "",
                page: 1,
              }));
            }}
            itemToStringLabel={(g) => g?.descricao ?? ""}
          >
            <ComboboxInput
              value={grupos.find((g) => g.id === filters.grupo_id)?.descricao ?? ""}
              showClear
              onChange={(e) => {
                setFilters((prev) => ({
                  ...prev,
                  grupo_id: "",
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
                {(g) => (
                  <ComboboxItem key={g.id} value={g}>
                    {g.descricao}
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
            id="usuarios-excluidos"

            checked={filters.excluido ?? false}

            onCheckedChange={(checked) =>
              setFilters((prev) => ({
                ...prev,
                excluido: checked,
                page: 1,
              }))
            }
          />

          <Label htmlFor="usuarios-excluidos">
            Excluídos
          </Label>
        </div>

      </CardContent>
    </Card>
  );
}
