"use client";

import { PerPage } from "@/components/data-tables/PerPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ListarMensagensRequest } from "@/domains/admin/mensagem/types/mensagem.requests";

interface Props {
  filters: ListarMensagensRequest;
  setFilters: React.Dispatch<React.SetStateAction<ListarMensagensRequest>>;
}

export function MensagensFilters({ filters, setFilters }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtros</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <Label>Título</Label>
          <Input
            value={filters.titulo ?? ""}
            onChange={(e) =>
              setFilters((prev) => ({
                ...prev,
                titulo: e.target.value,
                page: 1,
              }))
            }
            className="w-64"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label>Origem</Label>
          <Select
            value={filters.origem ?? "todas"}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                origem: value === "todas" ? undefined : (value as "sistema" | "admin"),
                page: 1,
              }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="sistema">Sistema</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <PerPage
          perPage={filters.por_pagina ?? 10}
          onChange={(value) => {
            setFilters((prev) => ({
              ...prev,
              por_pagina: value,
              page: 1,
            }));
          }}
        />
      </CardContent>
    </Card>
  );
}
