<?php

namespace App\DTO\AcessoSuporte;

final class AcessoSuporteConcessaoDTO
{
    public function __construct(
        public readonly string $entidade_tipo_id,
        public readonly string $entidade_id,
        public readonly string $usuario_concedente_id,
        public readonly string $usuario_admin_id,
        public readonly ?string $motivo,
        public readonly int $duracao_minutos,
        public readonly ?array $metadados = null,
    ) {}

    /**
     * @param string $entidadeTipoId entidade_tipos.id de quem está concedendo
     * @param string $entidadeId     id concreto (ex: grupo_empresa_id) dentro daquela entidade_tipo
     * @param string $usuarioConcedenteId usuário autenticado que está concedendo
     * @param array  $dados          dados já validados pelo Request específico da entidade
     */
    public static function criarParaCadastro(
        string $entidadeTipoId,
        string $entidadeId,
        string $usuarioConcedenteId,
        array $dados
    ): self {
        return new self(
            entidade_tipo_id: $entidadeTipoId,
            entidade_id: $entidadeId,
            usuario_concedente_id: $usuarioConcedenteId,
            usuario_admin_id: $dados['usuario_admin_id'],
            motivo: $dados['motivo'] ?? null,
            duracao_minutos: (int) $dados['duracao_minutos'],
            metadados: isset($dados['empresa_id']) ? ['empresa_id' => $dados['empresa_id']] : null,
        );
    }
}
