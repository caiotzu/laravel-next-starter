export const DASHBOARD_PERIODO = {
  hoje: "Hoje",
  ultimos_7_dias: "Últimos 7 dias",
  ultimos_30_dias: "Últimos 30 dias",
  ultimos_90_dias: "Últimos 90 dias",
  este_ano: "Este ano",
  personalizado: "Personalizado",
} as const;

export type DashboardPeriodo = keyof typeof DASHBOARD_PERIODO;

export const DASHBOARD_PERIODO_OPTIONS = Object.entries(DASHBOARD_PERIODO).map(
  ([value, label]) => ({ value: value as DashboardPeriodo, label })
);
