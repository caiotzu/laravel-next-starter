<?php

namespace App\DTO\Email;

final class EmailResultadoDTO
{
    public function __construct(
        public readonly string $provider,
        public readonly bool $sucesso,
        public readonly ?string $mensagem_id,
        public readonly ?string $mensagem
    ) {}
}
