import qs from "qs";

import { proxyAdminRequest } from "@/lib/proxy-admin";

import { VisualizarDashboardRequest } from "../types/dashboard.requests";
import { DashboardDataResponse, DashboardResponse } from "../types/dashboard.responses";

export async function visualizarDashboard(params?: VisualizarDashboardRequest): Promise<DashboardDataResponse> {
  const query = qs.stringify(params ?? {}, { skipNulls: true });

  const response = await proxyAdminRequest<DashboardResponse>({
    url: `/admin/dashboard?${query}`,
    method: "GET",
  });

  return response.data.data;
}
