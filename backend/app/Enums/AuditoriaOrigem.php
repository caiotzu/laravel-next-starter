<?php

namespace App\Enums;

enum AuditoriaOrigem: string
{
    case API = 'api';
    case CONSOLE = 'console';
    case JOB = 'job';
    case SISTEMA = 'sistema';
}
