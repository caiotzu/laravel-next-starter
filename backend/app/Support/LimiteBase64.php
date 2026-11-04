<?php

namespace App\Support;

/**
 * Tamanho máximo, em CARACTERES, de um campo base64 que representa um arquivo de até N bytes.
 *
 * Os uploads (avatar, anexos de chamado, imagens de banner) chegam como texto base64 dentro do
 * JSON. Conferir o limite só DEPOIS de `base64_decode` (SEC-008 / F-12) obrigava o servidor a
 * decodificar qualquer coisa que coubesse em `post_max_size` antes de recusar. Com este teto na
 * regra `max:` do próprio campo, a recusa acontece antes da decodificação.
 */
final class LimiteBase64
{
    /** Folga para quebras de linha (MIME põe 2 caracteres a cada 76) sem recusar arquivo legítimo. */
    private const FOLGA = 1.05;

    public static function maxCaracteres(int $bytes): int
    {
        return (int) ceil(((int) ceil($bytes / 3)) * 4 * self::FOLGA);
    }
}
