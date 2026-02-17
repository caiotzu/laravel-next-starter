<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Database\Eloquent\Builder;

use App\Models\Usuario;

use App\DTO\Usuario\UsuarioAtualizacaoDTO;
use App\DTO\Usuario\UsuarioAvatarBase64AtualizacaoDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class UsuarioService {

    public function atualizar(UsuarioAtualizacaoDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {

            $usuario = Usuario::find($dto->id);

            if (!$usuario) {
                throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);
            }

            $usuario->update($dto->paraPersistencia());

            return $usuario;
        });
    }

    public function atualizarAvatarBase64(UsuarioAvatarBase64AtualizacaoDTO $dto): Usuario
    {
        $usuario = Usuario::findOrFail($dto->usuarioId);

        $decoded = base64_decode($dto->base64);

        $mime = finfo_buffer(finfo_open(), $decoded, FILEINFO_MIME_TYPE);

        $extension = match ($mime) {
            'image/png'  => 'png',
            'image/jpeg' => 'jpg',
            default      => throw new \Exception('Formato inválido'),
        };

        // Remove antigo
        if ($usuario->avatar) {
            Storage::disk('public')->delete($usuario->avatar);
        }

        $path = 'avatars/' . Str::uuid() . '.' . $extension;

        Storage::disk('public')->put($path, $decoded);

        $usuario->update([
            'avatar' => $path,
        ]);

        return $usuario->fresh();
    }

    public function registrarLogin(Usuario $usuario, ?string $ip): void
    {
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
