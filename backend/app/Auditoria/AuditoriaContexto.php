<?php

namespace App\Auditoria;

use Illuminate\Support\Facades\Auth;

use App\Enums\AuditoriaOrigem;
use App\AcessoSuporte\AcessoSuporteContexto;

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

    /**
     * Quando a ação ocorre durante um Acesso de Suporte válido, marca o
     * registro de auditoria com o id da concessão. `usuarioId()` acima
     * continua retornando o Admin real — este campo é um complemento, não
     * uma substituição, permitindo filtrar/isolar tudo que foi feito
     * durante um suporte específico sem nunca perder de vista quem
     * realmente executou a ação.
     */
    public function acessoSuporteId(): ?string
    {
        return app(AcessoSuporteContexto::class)->id();
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
