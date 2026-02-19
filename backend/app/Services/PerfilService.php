<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

use App\Models\Usuario;

use App\DTO\Perfil\PerfilAtualizacaoDTO;
use App\DTO\Perfil\PerfilAtualizacaoSenhaDTO;
use App\DTO\Perfil\PerfilAvatarBase64AtualizacaoDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class PerfilService {

    public function atualizar(PerfilAtualizacaoDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {
            $usuario = $dto->usuario;
            if (! $usuario->exists) {
                throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);
            }

            $usuario->update($dto->paraPersistencia());

            return $usuario;
        });
    }

    public function atualizarSenha(PerfilAtualizacaoSenhaDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {
            $usuario = $dto->usuario;
            if (! $usuario->exists) {
                throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);
            }

            $usuario->update([
                'senha' => Hash::make($dto->senha_nova)
            ]);

            return $usuario->fresh();
        });
    }

    public function atualizarAvatarBase64(PerfilAvatarBase64AtualizacaoDTO $dto): Usuario
    {
        $usuario =$dto->usuario;
        if (! $usuario->exists) {
            throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);
        }

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
}
