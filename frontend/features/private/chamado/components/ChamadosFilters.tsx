"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CHAMADO_STATUS_OPTIONS } from "@/constants/chamado-status";
import { CHAMADO_TIPO_OPTIONS } from "@/constants/chamado-tipo";
import { ListarChamadosRequest } from "@/domains/private/chamado/types/chamado.requests";

interface Props {
  filtros: ListarChamadosRequest;
  setFiltros: React.Dispatch<React.SetStateAction<ListarChamadosRequest>>;
}

export function ChamadosFilters({ filtros, setFiltros }: Props) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Ticket</label>
          <Input
            value={filtros.ticket ?? ""}
            onChange={(e) =>
              setFiltros((f) => ({
                ...f,
                page: 1,
                ticket: e.target.value || undefined,
              }))
            }
            placeholder="Ex.: SUP-2026-000123"
            className="w-56"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filtros.status ?? "todos"}
            onValueChange={(value) =>
              setFiltros((f) => ({
                ...f,
                page: 1,
                status: value === "todos" ? undefined : (value as ListarChamadosRequest["status"]),
              }))
            }
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {CHAMADO_STATUS_OPTIONS.map((opcao) => (
                <SelectItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Tipo</label>
          <Select
            value={filtros.tipo ?? "todos"}
            onValueChange={(value) =>
              setFiltros((f) => ({
                ...f,
                page: 1,
                tipo: value === "todos" ? undefined : (value as ListarChamadosRequest["tipo"]),
              }))
            }
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {CHAMADO_TIPO_OPTIONS.map((opcao) => (
                <SelectItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
