"use client";

import { PerPage } from "@/components/data-tables/PerPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { BannerFiltros } from "@/domains/admin/banner/types/banner.filters";

interface Props {
  filters: BannerFiltros;
  setFilters: React.Dispatch<React.SetStateAction<BannerFiltros>>;
}

export function BannersFilters({ filters, setFilters }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Filtros</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap gap-4 items-end">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Título</label>
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
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status || "todos"}
            onValueChange={(value) =>
              setFilters((prev) => ({
                ...prev,
                status: value === "todos" ? "" : (value as BannerFiltros["status"]),
                page: 1,
              }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
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
