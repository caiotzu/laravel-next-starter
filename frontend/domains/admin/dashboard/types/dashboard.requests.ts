import { DashboardPeriodo } from "@/constants/dashboard-periodo";

export interface VisualizarDashboardRequest {
  periodo?: DashboardPeriodo;
  data_inicio?: string;
  data_fim?: string;
}
