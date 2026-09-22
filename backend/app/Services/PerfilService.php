<?php

namespace App\Services;

use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Events\SenhaUsuarioAlterada;

use App\Models\Usuario;

use App\DTO\Perfil\PerfilAtualizacaoDTO;
use App\DTO\Perfil\PerfilAtualizacaoSenhaDTO;
use App\DTO\Perfil\PerfilAvatarBase64AtualizacaoDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class PerfilService {
    public function __construct(
        private TokenResetSenhaService $tokenResetSenhaService,
        private UsuarioService $usuarioService
    ) {}

    /**
     * Id da sessão (claim session_id do JWT) da requisição atual. Usado para preservar o
     * aparelho de quem está alterando os próprios dados de acesso.
     */
    private function sessaoAtualId(): ?string
    {
        try {
            return JWTAuth::parseToken()->getPayload()->get('session_id');
        } catch (\Throwable) {
            return null;
        }
    }

    public function atualizar(PerfilAtualizacaoDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {
            $usuario = $dto->usuario;
            if (! $usuario->exists) {
                throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);
            }

            $usuario->update($dto->paraPersistencia());

            // E-mail é credencial de recuperação de conta: ao mudar, encerra as demais sessões.
            if ($usuario->wasChanged('email')) {
                $this->usuarioService->encerrarSessoesDoUsuario($usuario, $this->sessaoAtualId());
            }

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

            // Mantém apenas a sessão atual; qualquer outro aparelho precisa autenticar de novo.
            $this->usuarioService->encerrarSessoesDoUsuario($usuario, $this->sessaoAtualId());

            $token = $this->tokenResetSenhaService->gerarToken($usuario);
            event(new SenhaUsuarioAlterada($usuario, $token));

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
