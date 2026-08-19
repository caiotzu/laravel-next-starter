<?php

namespace App\AcessoSuporte;

use App\Models\AcessoSuporte;
use App\Models\Usuario;

/**
 * Registrado como singleton (ver AppServiceProvider), vive apenas durante a
 * requisição HTTP atual. Guarda, quando aplicável, qual Acesso de Suporte
 * está sendo usado nesta requisição.
 *
 * IMPORTANTE — este é o único lugar do sistema que sabe que uma requisição
 * está em "modo de suporte". `Auth::user()` NUNCA é alterado por causa
 * disso: o Admin autenticado continua sendo ele mesmo do início ao fim.
 * O que muda é apenas o escopo de dados que os Services consultam, através
 * de entidadeTipoId()/entidadeId() abaixo — que substituem, quando há um
 * acesso de suporte ativo, a leitura direta de `Auth::user()->grupo->...`
 * que os Services já faziam.
 *
 * Esta classe é 100% agnóstica de qual entidade concedeu o acesso (Private,
 * Despachante, Revenda...) — ela só repassa o que já está gravado no
 * `AcessoSuporte` validado pelo Middleware. Nenhuma entidade é conhecida
 * por nome aqui.
 */
class AcessoSuporteContexto
{
    private ?AcessoSuporte $acessoSuporte = null;

    public function ativar(AcessoSuporte $acessoSuporte): void
    {
        $this->acessoSuporte = $acessoSuporte;
    }

    public function ativo(): bool
    {
        return $this->acessoSuporte !== null;
    }

    public function acesso(): ?AcessoSuporte
    {
        return $this->acessoSuporte;
    }

    public function id(): ?string
    {
        return $this->acessoSuporte?->id;
    }

    /**
     * entidade_tipo_id a ser usado para escopar consultas. Em modo de
     * suporte, é sempre o da entidade concedente do acesso validado — nunca
     * o do próprio Admin (que nem possui uma entidade concedente própria).
     * Fora do modo de suporte, usa o do próprio usuário autenticado.
     */
    public function entidadeTipoId(Usuario $usuarioAutenticado): ?string
    {
        if ($this->ativo()) {
            return $this->acessoSuporte->entidade_tipo_id;
        }

        return $usuarioAutenticado->grupo->entidade_tipo_id;
    }

    /**
     * entidade_id a ser usado para escopar consultas. Em modo de suporte, é
     * sempre o gravado no Acesso de Suporte — nunca outro, independente de
     * qualquer parâmetro enviado na requisição (rota, query string ou body).
     */
    public function entidadeId(Usuario $usuarioAutenticado): ?string
    {
        if ($this->ativo()) {
            return $this->acessoSuporte->entidade_id;
        }

        return $usuarioAutenticado->grupo->entidade_id;
    }

    /**
     * Chave (ex: 'private', 'despachante') da entidade concedente do acesso
     * ativo — usada pelo Gate::before para liberar dinamicamente o
     * namespace de permissão correspondente, sem qualquer referência
     * hardcoded a um tipo de entidade específico.
     */
    public function entidadeTipoChave(): ?string
    {
        return $this->acessoSuporte?->entidadeTipo?->chave->value;
    }
}
