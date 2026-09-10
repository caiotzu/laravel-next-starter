<?php

namespace App\Enums;

enum DashboardPeriodo: string
{
    case HOJE = 'hoje';
    case ULTIMOS_7_DIAS = 'ultimos_7_dias';
    case ULTIMOS_30_DIAS = 'ultimos_30_dias';
    case ULTIMOS_90_DIAS = 'ultimos_90_dias';
    case ESTE_ANO = 'este_ano';
    case PERSONALIZADO = 'personalizado';
}
