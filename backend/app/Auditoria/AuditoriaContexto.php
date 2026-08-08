<?php

namespace App\Auditoria;

use Illuminate\Support\Facades\Auth;

use App\Enums\AuditoriaOrigem;

/**
 * Registrado como singleton (ver AppServiceProvider). Permite que jobs,
 * commands e listeners "avisem" que a ação atual não partiu de uma requisição
 * HTTP comum, sobrescrevendo a origem detectada automaticamente.
 */
class AuditoriaContexto
{
    private ?AuditoriaOrigem $origemForcada = null;

    public function definirOrigem(AuditoriaOrigem $origem): void
    {
        $this->origemForcada = $origem;
    }

    public function limparOrigem(): void
    {
        $this->origemForcada = null;
    }

    public function usuarioId(): ?string
    {
        return Auth::check() ? (string) Auth::id() : null;
    }

    public function origem(): AuditoriaOrigem
    {
        if ($this->origemForcada) {
            return $this->origemForcada;
        }

        if (Auth::check()) {
            return AuditoriaOrigem::API;
        }

        if (app()->runningInConsole()) {
            return AuditoriaOrigem::CONSOLE;
        }

        return AuditoriaOrigem::SISTEMA;
    }

    public function ip(): ?string
    {
        return request()?->ip();
    }

    public function userAgent(): ?string
    {
        return request()?->userAgent();
    }
}
