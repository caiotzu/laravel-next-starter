"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ListarReleasesRequest } from "@/domains/admin/release/types/release.requests";

interface Props {
  filtros: ListarReleasesRequest;
  setFiltros: React.Dispatch<React.SetStateAction<ListarReleasesRequest>>;
}

export function ReleasesGerenciarFilters({ filtros, setFiltros }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Contexto</label>
          <Select
            value={filtros.contexto ?? "todos"}
            onValueChange={(value) =>
              setFiltros((f) => ({
                ...f,
                page: 1,
                contexto: value === "todos" ? undefined : (value as ListarReleasesRequest["contexto"]),
              }))
            }
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Contexto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os contextos</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filtros.status ?? "todos"}
            onValueChange={(value) =>
              setFiltros((f) => ({
                ...f,
                page: 1,
                status: value === "todos" ? undefined : (value as ListarReleasesRequest["status"]),
              }))
            }
          >
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
