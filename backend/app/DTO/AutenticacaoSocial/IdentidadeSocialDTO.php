<?php

namespace App\DTO\AutenticacaoSocial;

/**
 * Identidade de um usuário em um provedor social, já normalizada.
 *
 * `id` é o identificador ESTÁVEL do provedor (ex.: `sub` do Google). O e-mail pode mudar; o `id`,
 * não — por isso o vínculo com o usuário é feito por ele depois do primeiro login.
 */
final class IdentidadeSocialDTO
{
    public function __construct(
        public readonly string $provedor,
        public readonly string $id,
        public readonly string $email,
        public readonly bool $emailVerificado,
        public readonly ?string $nome = null,
    ) {}
}
