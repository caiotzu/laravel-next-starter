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

import { CHAMADO_PRIORIDADE_OPTIONS } from "@/constants/chamado-prioridade";
import { CHAMADO_STATUS_OPTIONS } from "@/constants/chamado-status";
import { CHAMADO_TIPO_OPTIONS } from "@/constants/chamado-tipo";
import { ListarChamadosRequest } from "@/domains/admin/chamado/types/chamado.requests";
import { AdministradorLookupItem } from "@/domains/admin/lookup/types/lookup.responses";

const TODOS_RESPONSAVEIS = "todos";

interface Props {
  filtros: ListarChamadosRequest;
  setFiltros: React.Dispatch<React.SetStateAction<ListarChamadosRequest>>;
  administradores: AdministradorLookupItem[];
  carregandoAdmins: boolean;
  buscaResponsavel: string;
  setBuscaResponsavel: React.Dispatch<React.SetStateAction<string>>;
}

export function ChamadosFilters({
  filtros,
  setFiltros,
  administradores,
  carregandoAdmins,
  buscaResponsavel,
  setBuscaResponsavel,
}: Props) {
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

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Prioridade</label>
          <Select
            value={filtros.prioridade ?? "todos"}
            onValueChange={(value) =>
              setFiltros((f) => ({
                ...f,
                page: 1,
                prioridade: value === "todos" ? undefined : (value as ListarChamadosRequest["prioridade"]),
              }))
            }
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as prioridades</SelectItem>
              {CHAMADO_PRIORIDADE_OPTIONS.map((opcao) => (
                <SelectItem key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Responsável</label>
          <Select
            value={filtros.responsavel_id ?? TODOS_RESPONSAVEIS}
            onValueChange={(value) =>
              setFiltros((f) => ({
                ...f,
                page: 1,
                responsavel_id: value === TODOS_RESPONSAVEIS ? undefined : value,
              }))
            }
          >
            <SelectTrigger className="w-56">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 pb-2">
                <input
                  value={buscaResponsavel}
                  onChange={(e) => setBuscaResponsavel(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-input/30"
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>

              <SelectItem value={TODOS_RESPONSAVEIS}>Todos os responsáveis</SelectItem>

              {carregandoAdmins && (
                <div className="px-2 py-2 text-sm text-muted-foreground">Buscando...</div>
              )}

              {administradores?.map((admin) => (
                <SelectItem key={admin.id} value={admin.id}>
                  {admin.nome} — {admin.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

       
      </CardContent>
    </Card>
  );
}
