<?php

namespace App\DTO\GrupoEmpresa;

/**
 * DTO usado para criar o usuário inicial no cadastro de um GrupoEmpresa.
 * O grupo_id e a senha são gerados automaticamente pelo service.
 */
final class UsuarioOnboardingDTO
{
    public function __construct(
        public readonly string $nome,
        public readonly string $email
    ) {}

    public static function criarParaCadastro(array $dados): self
    {
        return new self(
            nome: $dados['nome'],
            email: $dados['email'],
        );
    }
}
