<?php

namespace App\Support;

/**
 * "De quem são os dados" numa requisição: o tipo de entidade (admin, private, ...) e a
 * entidade (ex.: o grupo_empresa) EFETIVOS do contexto atual — já considerando o modo de
 * suporte (ver App\AcessoSuporte\AcessoSuporteContexto).
 *
 * É a única forma de um Repository de dados com dono (Grupo, Usuario) receber o contexto:
 * todo método dele exige este objeto e aplica o filtro por conta própria. Assim uma consulta
 * nova não consegue "esquecer" a entidade e vazar dados de uma empresa para outra.
 *
 * Só se obtém por EscopoEntidadeService::atual() (ou, em jobs/testes, construindo de forma
 * explícita). Nunca derive de Auth::user()->grupo diretamente.
 */
final readonly class EscopoEntidade
{
    public function __construct(
        public ?string $entidadeTipoId,
        public ?string $entidadeId,
    ) {}
}
