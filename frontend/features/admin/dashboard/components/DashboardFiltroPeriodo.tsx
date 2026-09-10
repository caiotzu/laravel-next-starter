"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DASHBOARD_PERIODO_OPTIONS, DashboardPeriodo } from "@/constants/dashboard-periodo";
import { VisualizarDashboardRequest } from "@/domains/admin/dashboard/types/dashboard.requests";

interface Props {
  filtro: VisualizarDashboardRequest;
  onChange: (filtro: VisualizarDashboardRequest) => void;
}

export function DashboardFiltroPeriodo({ filtro, onChange }: Props) {
  const periodo = filtro.periodo ?? "ultimos_30_dias";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">Período</label>
        <Select
          value={periodo}
          onValueChange={(value) =>
            onChange({
              ...filtro,
              periodo: value as DashboardPeriodo,
              // Limpa as datas customizadas ao trocar para um período padrão.
              data_inicio: value === "personalizado" ? filtro.data_inicio : undefined,
              data_fim: value === "personalizado" ? filtro.data_fim : undefined,
            })
          }
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DASHBOARD_PERIODO_OPTIONS.map((opcao) => (
              <SelectItem key={opcao.value} value={opcao.value}>
                {opcao.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {periodo === "personalizado" && (
        <>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">De</label>
            <input
              type="date"
              value={filtro.data_inicio ?? ""}
              onChange={(e) => onChange({ ...filtro, data_inicio: e.target.value })}
              className="h-9 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-input/30"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Até</label>
            <input
              type="date"
              value={filtro.data_fim ?? ""}
              onChange={(e) => onChange({ ...filtro, data_fim: e.target.value })}
              className="h-9 rounded-md border bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring dark:bg-input/30"
            />
          </div>
        </>
      )}
    </div>
  );
}
