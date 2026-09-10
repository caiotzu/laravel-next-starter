<?php

namespace App\DTO\Dashboard;

use Carbon\Carbon;

use App\Enums\DashboardPeriodo;

final class DashboardFiltroDTO
{
    private function __construct(
        public readonly DashboardPeriodo $periodo,
        public readonly Carbon $inicio,
        public readonly Carbon $fim,
        // Janela imediatamente anterior, de mesma duração — usada para o
        // comparativo "+12% em relação ao período anterior" (ver seção 8
        // do pedido). Ex: se o período é "últimos 30 dias", o anterior são
        // os 30 dias antes desse.
        public readonly Carbon $inicioAnterior,
        public readonly Carbon $fimAnterior,
    ) {}

    public static function criarParaFiltro(array $dados): self
    {
        $periodo = DashboardPeriodo::from($dados['periodo'] ?? DashboardPeriodo::ULTIMOS_30_DIAS->value);

        [$inicio, $fim] = match ($periodo) {
            DashboardPeriodo::HOJE => [now()->startOfDay(), now()->endOfDay()],
            DashboardPeriodo::ULTIMOS_7_DIAS => [now()->subDays(6)->startOfDay(), now()->endOfDay()],
            DashboardPeriodo::ULTIMOS_30_DIAS => [now()->subDays(29)->startOfDay(), now()->endOfDay()],
            DashboardPeriodo::ULTIMOS_90_DIAS => [now()->subDays(89)->startOfDay(), now()->endOfDay()],
            DashboardPeriodo::ESTE_ANO => [now()->startOfYear(), now()->endOfDay()],
            DashboardPeriodo::PERSONALIZADO => [
                Carbon::parse($dados['data_inicio'])->startOfDay(),
                Carbon::parse($dados['data_fim'])->endOfDay(),
            ],
        };

        // Janela anterior de duração idêntica, terminando exatamente onde
        // a atual começa.
        $duracaoEmSegundos = $inicio->diffInSeconds($fim);
        $fimAnterior = (clone $inicio)->subSecond();
        $inicioAnterior = (clone $fimAnterior)->subSeconds($duracaoEmSegundos);

        return new self(
            periodo: $periodo,
            inicio: $inicio,
            fim: $fim,
            inicioAnterior: $inicioAnterior,
            fimAnterior: $fimAnterior,
        );
    }
}
