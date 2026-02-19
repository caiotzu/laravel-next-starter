<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;

use App\Models\Usuario;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class UsuarioService {
    public function registrarLogin(Usuario $usuario, ?string $ip): void
    {
        if (! $usuario->exists) {
            throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);
        }

        $usuario->update([
            'ultimo_login_em' => now(),
            'ultimo_ip' => $ip,
        ]);
    }

    public function obterUsuarioAtivoPorEmail(string $email, EntidadeTipo $entidadeTipo): Usuario | null
    {
        return Usuario::with('grupo.entidadeTipo')
            ->whereHas('grupo.entidadeTipo', function (Builder $query) use ($entidadeTipo) {
                return $query->where('chave', $entidadeTipo->value);
            })
            ->where('email', $email)
            ->where('ativo', true)
            ->first();
    }

    public function obterUsuarioAtivoPorId(string $id, EntidadeTipo $entidadeTipo): Usuario | null
    {
        return Usuario::with('grupo.entidadeTipo')
            ->whereHas('grupo.entidadeTipo', function (Builder $query) use ($entidadeTipo) {
                return $query->where('chave', $entidadeTipo->value);
            })
            ->where('id', $id)
            ->where('ativo', true)
            ->first();
    }
}
