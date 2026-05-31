"use client";

import { PerPage } from "@/components/data-tables/PerPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

import { ListarGrupoEmpresasRequest } from "@/domains/admin/grupo-empresa/types/grupoEmpresa.requests";

interface Props {
  filters: ListarGrupoEmpresasRequest;
  setFilters: React.Dispatch<React.SetStateAction<ListarGrupoEmpresasRequest>>;
}

export function GrupoEmpresasFilters({
  filters,
  setFilters,
}: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtros</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nome</label>
          <Input
            value={filters.nome}
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

        <PerPage 
          perPage={filters.por_pagina ?? 10}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              por_pagina: value,
              page: 1
            }))
          }}
        />

        <div className="flex items-center space-x-2">
          <Switch
            id="grupos-empresas-excluidos"
            checked={filters.excluido}
            onCheckedChange={(checked) => {
              setFilters((prev) => ({
                ...prev,
                excluido: checked,
                page: 1
              }))
            }}
            
          />
          <Label htmlFor="grupos-empresas-excluidos">
            Excluídos
          </Label>
        </div>
      </CardContent>
    </Card>
  );
}
