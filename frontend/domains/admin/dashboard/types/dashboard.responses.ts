export interface DashboardKpis {
  total_empresas: number;
  empresas_no_periodo: number;
  empresas_variacao_percentual: number | null;

  chamados_abertos: number;

  chamados_no_periodo: number;
  chamados_variacao_percentual: number | null;

  chamados_fechados_no_periodo: number;
  chamados_fechados_variacao_percentual: number | null;

  tempo_medio_resolucao_segundos: number | null;
  tempo_medio_resolucao_variacao_percentual: number | null;
}

export interface DashboardEvolucaoChamadosPonto {
  data: string;
  abertos: number;
  fechados: number;
}

export interface DashboardEvolucaoEmpresasPonto {
  data: string;
  novas: number;
}

export interface DashboardRankingResponsavel {
  responsavel_id: string;
  responsavel_nome: string;
  total_encerrados: number;
  tempo_medio_segundos: number;
}

export interface DashboardChamadoResumo {
  id: string;
  ticket: string;
  assunto: string;
  status?: string;
  aberto_em: string;
  cliente_nome: string | null;
}

export interface DashboardChamadosSemResponsavel {
  total: number;
  chamados: DashboardChamadoResumo[];
}

export interface DashboardTempoAtendimento {
  resolucao: {
    media_segundos: number | null;
    mediana_segundos: number | null;
    amostras: number;
  };
  primeira_resposta: {
    media_segundos: number | null;
    amostras: number;
  };
}

export interface DashboardDataResponse {
  periodo: {
    inicio: string;
    fim: string;
  };
  kpis: DashboardKpis;
  evolucao_chamados: DashboardEvolucaoChamadosPonto[];
  evolucao_empresas: DashboardEvolucaoEmpresasPonto[];
  empresas_por_status: Record<string, number>;
  chamados_por_status: Record<string, number>;
  chamados_por_prioridade: Record<string, number>;
  chamados_por_tipo: Record<string, number>;
  ranking_responsaveis: DashboardRankingResponsavel[];
  chamados_sem_responsavel: DashboardChamadosSemResponsavel;
  chamados_mais_antigos: DashboardChamadoResumo[];
  tempo_atendimento: DashboardTempoAtendimento;
}

export interface DashboardResponse {
  data: DashboardDataResponse;
}
