<?php

namespace App\Services;


use Illuminate\Support\Facades\DB;

use Tymon\JWTAuth\Facades\JWTAuth;

use App\Models\UsuarioSessao;

use App\Models\Usuario;

use App\DTO\UsuarioSessao\UsuarioSessaoCadastroDTO;
use App\DTO\UsuarioSessao\UsuarioSessaoAtualizacaoDTO;

use App\Enums\ErrorCode;

use App\Exceptions\BusinessException;

class UsuarioSessaoService {

    public function cadastrar(UsuarioSessaoCadastroDTO $dto): UsuarioSessao
    {
        return DB::transaction(function () use ($dto) {
            return UsuarioSessao::create($dto->paraPersistencia());
        });
    }

    public function atualizar(UsuarioSessaoAtualizacaoDTO $dto): UsuarioSessao
    {
        return DB::transaction(function () use ($dto) {

            $sessao = UsuarioSessao::find($dto->id);

            if (!$sessao) {
                throw new BusinessException('Sessão do usuário não encontrada.', ErrorCode::USUARIO_SESSAO_NOT_FOUND->value);
            }

            $sessao->update($dto->paraPersistencia());

            return $sessao;
        });
    }

    public function validarSessaoAtiva(string $id): void
    {
        $sessao = UsuarioSessao::find($id);

        if (!$sessao || !$sessao->ativo || $sessao->logout_em) {
            throw new BusinessException(
                'Sessão inválida ou encerrada.',
                ErrorCode::USUARIO_SESSAO_NOT_FOUND->value
            );
        }

        /**
         * Expiração por inatividade (ex: 30 minutos)
         */
        $tempoInatividade = 30; // minutos

        if (
            !$sessao->ultimo_acesso_em ||
            $sessao->ultimo_acesso_em->diffInMinutes(now()) > $tempoInatividade
        ) {

            // Encerra a sessão automaticamente
            $sessao->update([
                'ativo' => false,
                'logout_em' => now(),
            ]);

            throw new BusinessException(
                'Sessão expirada por inatividade.',
                ErrorCode::USUARIO_SESSAO_UNAUTHORIZED->value
            );
        }

        /**
         * Atualiza último acesso
         * (se quiser otimizar, pode fazer a cada 5 min)
         */
        $sessao->update([
            'ultimo_acesso_em' => now(),
        ]);
    }

    public function encerrarSessao(Usuario $user, string $id): void
    {
        $sessao = $user->usuarioSessoes()->where('id', $id)->firstOrFail();

        $sessao->update([
            'ativo' => false,
            'logout_em' => now(),
        ]);
    }

    public function listarSessoesAtivas(Usuario $usuario)
    {
        $sessionIdAtual = null;

        try {
            $payload = JWTAuth::parseToken()->getPayload();
            $sessionIdAtual = $payload->get('session_id');
        } catch (\Exception $e) {
            throw new BusinessException(
                'Sessão expirada ou inválida.',
                ErrorCode::USUARIO_SESSAO_UNAUTHORIZED->value
            );
        }

        $query = $usuario->usuarioSessoes()
            ->where('ativo', true);

        if ($sessionIdAtual) {
            $query->orderByRaw('id = ? DESC', [$sessionIdAtual]);
        }

        return $query->get()->map(function ($sessao) use ($sessionIdAtual) {
            $sessao->atual = $sessao->id === $sessionIdAtual;
            return $sessao;
        });
    }
}
