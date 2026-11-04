<?php

namespace App\Http\Resources\Lookup\Administrador;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdministradorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'email' => $request->attributes->get('mascarar_email', false)
                ? self::mascararEmail((string) $this->email)
                : $this->email,
        ];
    }

    /** `maria.souza@empresa.com` → `ma***@empresa.com` (sem o domínio, nada é revelado). */
    public static function mascararEmail(string $email): string
    {
        $posicao = mb_strrpos($email, '@');

        if ($posicao === false || $posicao === 0) {
            return '***';
        }

        return mb_substr($email, 0, min(2, $posicao)).'***'.mb_substr($email, $posicao);
    }
}
