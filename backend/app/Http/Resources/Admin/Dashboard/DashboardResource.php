<?php

namespace App\Http\Resources\Admin\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'periodo' => $this['periodo'],
            'kpis' => $this['kpis'],
            'evolucao_chamados' => $this['evolucao_chamados'],
            'evolucao_empresas' => $this['evolucao_empresas'],
            'empresas_por_status' => $this['empresas_por_status'],
            'chamados_por_status' => $this['chamados_por_status'],
            'chamados_por_prioridade' => $this['chamados_por_prioridade'],
            'chamados_por_tipo' => $this['chamados_por_tipo'],
            'ranking_responsaveis' => $this['ranking_responsaveis'],
            'chamados_sem_responsavel' => $this['chamados_sem_responsavel'],
            'chamados_mais_antigos' => $this['chamados_mais_antigos'],
            'tempo_atendimento' => $this['tempo_atendimento'],
        ];
    }
}
