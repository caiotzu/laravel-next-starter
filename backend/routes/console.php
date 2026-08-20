<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('usuario-sessao:limpar-expiradas')->everyTenMinutes();

/**
 * Duração mínima de um acesso de suporte é de 5 minutos (ver
 * AcessoSuporteService::DURACAO_MINIMA_MINUTOS) — roda a cada minuto para
 * que o status gravado no banco não fique defasado por muito tempo em
 * relação à expiração real.
 */
Schedule::command('acesso-suporte:expirar-vencidos')->everyMinute();
