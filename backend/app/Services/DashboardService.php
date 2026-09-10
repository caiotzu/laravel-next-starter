<?php

namespace App\Services;

use App\Models\Chamado;
use App\Models\Empresa;

use App\DTO\Dashboard\DashboardFiltroDTO;

use App\Enums\ChamadoStatus;

/**
 * Todas as métricas aqui são calculadas com dados que já existem
 * (chamados, empresas) — nenhuma estrutura nova foi criada para o
 * dashboard. "Chamados por empresa" não existe como relação direta no
 * sistema (Chamado->usuario->grupo aponta para um GrupoEmpresa, que pode
 * ter várias Empresas) — por isso as métricas usam "cliente" (o usuário
 * que abriu o chamado), não "empresa".
 */
class DashboardService
{
    private const ENCERRADOS = [ChamadoStatus::FECHADO, ChamadoStatus::CANCELADO];

    public function kpis(DashboardFiltroDTO $filtro): array
    {
        $totalEmpresas = Empresa::count();
        $empresasNoPeriodo = Empresa::whereBetween('created_at', [$filtro->inicio, $filtro->fim])->count();
        $empresasPeriodoAnterior = Empresa::whereBetween('created_at', [$filtro->inicioAnterior, $filtro->fimAnterior])->count();

        $chamadosAbertos = Chamado::whereNotIn('status', self::encerradosValues())->count();

        $chamadosNoPeriodo = Chamado::whereBetween('aberto_em', [$filtro->inicio, $filtro->fim])->count();
        $chamadosPeriodoAnterior = Chamado::whereBetween('aberto_em', [$filtro->inicioAnterior, $filtro->fimAnterior])->count();

        $chamadosFechadosNoPeriodo = Chamado::whereIn('status', self::encerradosValues())
            ->whereBetween('fechado_em', [$filtro->inicio, $filtro->fim])
            ->count();
        $chamadosFechadosPeriodoAnterior = Chamado::whereIn('status', self::encerradosValues())
            ->whereBetween('fechado_em', [$filtro->inicioAnterior, $filtro->fimAnterior])
            ->count();

        $tempoMedioResolucaoSegundos = Chamado::whereIn('status', self::encerradosValues())
            ->whereBetween('fechado_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (fechado_em - aberto_em))) as media')
            ->value('media');

        $tempoMedioResolucaoAnteriorSegundos = Chamado::whereIn('status', self::encerradosValues())
            ->whereBetween('fechado_em', [$filtro->inicioAnterior, $filtro->fimAnterior])
            ->selectRaw('AVG(EXTRACT(EPOCH FROM (fechado_em - aberto_em))) as media')
            ->value('media');

        return [
            'total_empresas' => $totalEmpresas,
            'empresas_no_periodo' => $empresasNoPeriodo,
            'empresas_variacao_percentual' => $this->variacaoPercentual($empresasNoPeriodo, $empresasPeriodoAnterior),

            'chamados_abertos' => $chamadosAbertos,

            'chamados_no_periodo' => $chamadosNoPeriodo,
            'chamados_variacao_percentual' => $this->variacaoPercentual($chamadosNoPeriodo, $chamadosPeriodoAnterior),

            'chamados_fechados_no_periodo' => $chamadosFechadosNoPeriodo,
            'chamados_fechados_variacao_percentual' => $this->variacaoPercentual($chamadosFechadosNoPeriodo, $chamadosFechadosPeriodoAnterior),

            'tempo_medio_resolucao_segundos' => $tempoMedioResolucaoSegundos ? (float) $tempoMedioResolucaoSegundos : null,
            'tempo_medio_resolucao_variacao_percentual' => $this->variacaoPercentual(
                $tempoMedioResolucaoSegundos,
                $tempoMedioResolucaoAnteriorSegundos,
                menorEhMelhor: true,
            ),
        ];
    }

    /**
     * Série diária de chamados abertos x fechados no período — base do
     * gráfico de evolução.
     */
    public function evolucaoChamados(DashboardFiltroDTO $filtro): array
    {
        $abertosPorDia = Chamado::whereBetween('aberto_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw("to_char(date_trunc('day', aberto_em), 'YYYY-MM-DD') as dia, COUNT(*) as total")
            ->groupBy('dia')
            ->pluck('total', 'dia');

        $fechadosPorDia = Chamado::whereIn('status', self::encerradosValues())
            ->whereBetween('fechado_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw("to_char(date_trunc('day', fechado_em), 'YYYY-MM-DD') as dia, COUNT(*) as total")
            ->groupBy('dia')
            ->pluck('total', 'dia');

        return $this->combinarSeriesPorDia($filtro, [
            'abertos' => $abertosPorDia,
            'fechados' => $fechadosPorDia,
        ]);
    }

    public function evolucaoEmpresas(DashboardFiltroDTO $filtro): array
    {
        $novasPorDia = Empresa::whereBetween('created_at', [$filtro->inicio, $filtro->fim])
            ->selectRaw("to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as dia, COUNT(*) as total")
            ->groupBy('dia')
            ->pluck('total', 'dia');

        return $this->combinarSeriesPorDia($filtro, ['novas' => $novasPorDia]);
    }

    public function empresasPorStatus(): array
    {
        return Empresa::selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();
    }

    public function chamadosPorStatus(DashboardFiltroDTO $filtro): array
    {
        return Chamado::whereBetween('aberto_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw('status, COUNT(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();
    }

    public function chamadosPorPrioridade(DashboardFiltroDTO $filtro): array
    {
        return Chamado::whereBetween('aberto_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw('prioridade, COUNT(*) as total')
            ->groupBy('prioridade')
            ->pluck('total', 'prioridade')
            ->toArray();
    }

    public function chamadosPorTipo(DashboardFiltroDTO $filtro): array
    {
        return Chamado::whereBetween('aberto_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw('tipo, COUNT(*) as total')
            ->groupBy('tipo')
            ->pluck('total', 'tipo')
            ->toArray();
    }

    /**
     * Top N — funcionários que mais encerraram chamados no período, com
     * tempo médio de fechamento de cada um.
     */
    public function rankingResponsaveis(DashboardFiltroDTO $filtro, int $limite = 5): array
    {
        return Chamado::query()
            ->join('usuarios', 'usuarios.id', '=', 'chamados.responsavel_id')
            ->whereIn('chamados.status', self::encerradosValues())
            ->whereBetween('chamados.fechado_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw('
                usuarios.id as responsavel_id,
                usuarios.nome as responsavel_nome,
                COUNT(*) as total_encerrados,
                AVG(EXTRACT(EPOCH FROM (chamados.fechado_em - chamados.aberto_em))) as tempo_medio_segundos
            ')
            ->groupBy('usuarios.id', 'usuarios.nome')
            ->orderByDesc('total_encerrados')
            ->limit($limite)
            ->get()
            ->map(fn ($linha) => [
                'responsavel_id' => $linha->responsavel_id,
                'responsavel_nome' => $linha->responsavel_nome,
                'total_encerrados' => (int) $linha->total_encerrados,
                'tempo_medio_segundos' => (float) $linha->tempo_medio_segundos,
            ])
            ->toArray();
    }

    /**
     * Chamados ativos (não encerrados) sem ninguém responsável — ponto de
     * atenção explícito pedido na seção "quarta linha" do layout.
     */
    public function chamadosSemResponsavel(int $limite = 5): array
    {
        $total = Chamado::whereNotIn('status', self::encerradosValues())
            ->whereNull('responsavel_id')
            ->count();

        $lista = Chamado::with('usuario')
            ->whereNotIn('status', self::encerradosValues())
            ->whereNull('responsavel_id')
            ->orderBy('aberto_em')
            ->limit($limite)
            ->get(['id', 'ticket', 'assunto', 'aberto_em', 'usuario_id'])
            ->map(fn ($chamado) => [
                'id' => $chamado->id,
                'ticket' => $chamado->ticket,
                'assunto' => $chamado->assunto,
                'aberto_em' => $chamado->aberto_em,
                'cliente_nome' => $chamado->usuario?->nome,
            ]);

        return ['total' => $total, 'chamados' => $lista];
    }

    /**
     * Chamados ainda em aberto há mais tempo — outro ponto de atenção.
     */
    public function chamadosMaisAntigos(int $limite = 5): array
    {
        return Chamado::with('usuario')
            ->whereNotIn('status', self::encerradosValues())
            ->orderBy('aberto_em')
            ->limit($limite)
            ->get(['id', 'ticket', 'assunto', 'status', 'aberto_em', 'usuario_id'])
            ->map(fn ($chamado) => [
                'id' => $chamado->id,
                'ticket' => $chamado->ticket,
                'assunto' => $chamado->assunto,
                'status' => $chamado->status,
                'aberto_em' => $chamado->aberto_em,
                'cliente_nome' => $chamado->usuario?->nome,
            ])
            ->toArray();
    }

    /**
     * Tempo médio, mediano (PERCENTILE_CONT — nativo do Postgres) e tempo
     * médio até a primeira resposta. Só considera chamados que realmente
     * possuem a data em questão preenchida (fechado_em / primeira_resposta_em),
     * nunca mistura chamados ainda abertos nessas médias.
     */
    public function tempoAtendimento(DashboardFiltroDTO $filtro): array
    {
        $resolucao = Chamado::whereIn('status', self::encerradosValues())
            ->whereBetween('fechado_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw('
                AVG(EXTRACT(EPOCH FROM (fechado_em - aberto_em))) as media_segundos,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (fechado_em - aberto_em))) as mediana_segundos,
                COUNT(*) as amostras
            ')
            ->first();

        $primeiraResposta = Chamado::whereNotNull('primeira_resposta_em')
            ->whereBetween('aberto_em', [$filtro->inicio, $filtro->fim])
            ->selectRaw('
                AVG(EXTRACT(EPOCH FROM (primeira_resposta_em - aberto_em))) as media_segundos,
                COUNT(*) as amostras
            ')
            ->first();

        return [
            'resolucao' => [
                'media_segundos' => $resolucao?->media_segundos ? (float) $resolucao->media_segundos : null,
                'mediana_segundos' => $resolucao?->mediana_segundos ? (float) $resolucao->mediana_segundos : null,
                'amostras' => (int) ($resolucao?->amostras ?? 0),
            ],
            'primeira_resposta' => [
                'media_segundos' => $primeiraResposta?->media_segundos ? (float) $primeiraResposta->media_segundos : null,
                'amostras' => (int) ($primeiraResposta?->amostras ?? 0),
            ],
        ];
    }

    /**
     * Preenche os dias sem dado com zero, para o gráfico não "pular" datas
     * — sem isso, um dia sem nenhum chamado simplesmente não apareceria no
     * eixo X.
     */
    private function combinarSeriesPorDia(DashboardFiltroDTO $filtro, array $series): array
    {
        $resultado = [];
        $cursor = $filtro->inicio->copy()->startOfDay();
        $fim = $filtro->fim->copy()->startOfDay();

        while ($cursor->lte($fim)) {
            $chave = $cursor->format('Y-m-d');

            $linha = ['data' => $chave];
            foreach ($series as $nome => $valores) {
                $linha[$nome] = (int) ($valores[$chave] ?? 0);
            }

            $resultado[] = $linha;
            $cursor->addDay();
        }

        return $resultado;
    }

    private function variacaoPercentual(?float $atual, ?float $anterior, bool $menorEhMelhor = false): ?float
    {
        if ($anterior === null || $atual === null || (float) $anterior === 0.0) {
            return null;
        }

        $variacao = (($atual - $anterior) / $anterior) * 100;

        // Para métricas de tempo, uma redução é positiva — inverte o sinal
        // para que o frontend sempre trate "+ é bom" de forma consistente
        // no componente de badge de tendência.
        return $menorEhMelhor ? round(-$variacao, 1) : round($variacao, 1);
    }

    private static function encerradosValues(): array
    {
        return array_map(fn ($status) => $status->value, self::ENCERRADOS);
    }
}
