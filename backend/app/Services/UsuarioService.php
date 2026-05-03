<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Grupo;
use App\Models\Usuario;

use App\DTO\Usuario\UsuarioFiltroDTO;
use App\DTO\Usuario\UsuarioCadastroDTO;
use App\DTO\Usuario\UsuarioAtualizacaoDTO;

use App\Enums\ErrorCode;
use App\Enums\EntidadeTipo;
use App\Enums\UsuarioStatus;


use App\Exceptions\BusinessException;

class UsuarioService {

    public function cadastrar(UsuarioCadastroDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {
            /**
             * Consulta o Grupo do usuário autenticado para verificar se o ID
             * do grupo passado está dentro da mesma regra
             */
            $user = Auth::user();

            $grupo = Grupo::where('entidade_tipo_id', $user->grupo->entidade_tipo_id)
                ->where('entidade_id', $user->grupo->entidade_id)
                ->find($dto->grupo_id);
            if(!$grupo)
                throw new BusinessException('O grupo selecionado não é válido para este cadastro.', ErrorCode::GRUPO_REQUIRED->value);

            /**
             * Por enquanto a senha vai ser gerada fixa, até a implementação
             * dos métodos de envio de e-mail
             */
            $senhaCriptografada = bcrypt("123Mudar@");

            $usuario = Usuario::create([
                'grupo_id' => $dto->grupo_id,
                'nome' => $dto->nome,
                'email' => $dto->email,
                'senha' => $senhaCriptografada,
                'status' => UsuarioStatus::CONVIDADO->value
            ]);

            return $usuario;
        });
    }

    public function atualizar(UsuarioAtualizacaoDTO $dto): Usuario
    {
        return DB::transaction(function () use ($dto) {
            /**
             * Consulta o Grupo do usuário autenticado para verificar se o ID
             * do grupo passado está dentro da mesma regra
             */
            $user = Auth::user();

            $grupo = Grupo::where('entidade_tipo_id', $user->grupo->entidade_tipo_id)
                ->where('entidade_id', $user->grupo->entidade_id)
                ->find($dto->grupo_id);
            if(!$grupo)
                throw new BusinessException('O grupo selecionado não é válido para este cadastro.', ErrorCode::GRUPO_REQUIRED->value);

            $usuario = Usuario::find($dto->id);
            dd($usuario);
            if(!$usuario)
                throw new BusinessException('Usuário não encontrado.', ErrorCode::USUARIO_NOT_FOUND->value);

            if (! $dto->temAlteracoes())
                throw new BusinessException('Nenhum dado informado para atualização.', ErrorCode::USUARIO_REQUIRED->value);

            $usuario->update($dto->paraPersistencia());

            return $usuario;
        });
    }

    public function visualizar(string $id): Usuario
    {
        return DB::transaction(function () use ($id) {
            /**
             * Para listar o usuário precisa ser do mesmo tipo de entidade. Ex: admin, private
             * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
             */
            $user = Auth::user();

            $usuario = Usuario::query()
                ->with('grupo')
                ->whereHas('grupo', function (Builder $query) use ($user) {
                    return $query->where('entidade_tipo_id', $user->grupo->entidade_tipo_id)
                        ->where('entidade_id', $user->grupo->entidade_id);
                })
                ->find($id);

            if (! $usuario) {
                throw new BusinessException(
                    'Usuário não encontrado.',
                    ErrorCode::USUARIO_NOT_FOUND->value
                );
            }

            return $usuario;
        });
    }

    public function excluir(string $id): void
    {
        DB::transaction(function () use ($id) {

            $usuario = Usuario::find($id);
            if (!$usuario) {
                throw new BusinessException(
                    'Usuário não encontrado para exclusão.',
                    ErrorCode::USUARIO_NOT_FOUND->value
                );
            }

            /**
             * Consulta o Grupo do usuário autenticado para verificar se o ID
             * do grupo passado está dentro da mesma regra
             */
            $user = Auth::user();

            $grupo = Grupo::where('entidade_tipo_id', $user->grupo->entidade_tipo_id)
                ->where('entidade_id', $user->grupo->entidade_id)
                ->find($usuario->grupo_id);
            if(!$grupo)
                throw new BusinessException('Usuário não encontrado ou não disponível para exclusão.', ErrorCode::USUARIO_NOT_FOUND->value);

            $usuario->delete();
            $usuario->fresh();
        });
    }

    public function ativar(string $id): Usuario
    {
        return DB::transaction(function () use ($id) {

            $usuario = Usuario::onlyTrashed()
                ->find($id);
            if (!$usuario) {
                throw new BusinessException(
                    'Usuário não encontrado para ativação.',
                    ErrorCode::USUARIO_NOT_FOUND->value
                );
            }

            /**
             * Consulta o Grupo do usuário autenticado para verificar se o ID
             * do grupo passado está dentro da mesma regra
             */
            $user = Auth::user();

            $grupo = Grupo::where('entidade_tipo_id', $user->grupo->entidade_tipo_id)
                ->where('entidade_id', $user->grupo->entidade_id)
                ->find($usuario->grupo_id);
            if(!$grupo)
                throw new BusinessException('Usuário não encontrado ou não disponível para exclusão.', ErrorCode::USUARIO_NOT_FOUND->value);

            $usuario->restore();
            return $usuario->fresh();
        });
    }

    public function listar(UsuarioFiltroDTO $filtro): LengthAwarePaginator
    {
        /**
         * Para listar o usuário precisa ser do mesmo tipo de entidade. Ex: admin, private
         * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
         */
        $user = Auth::user();

        return Usuario::query()
            ->with('grupo')
            ->whereHas('grupo', function (Builder $query) use ($user) {
                return $query->where('entidade_tipo_id', $user->grupo->entidade_tipo_id)
                    ->where('entidade_id', $user->grupo->entidade_id);
            })
            ->when($filtro->id, fn ($q) =>
                $q->where('id', $filtro->id)
            )
            ->when($filtro->nome, fn ($q) =>
                $q->where('nome', 'ilike', "%{$filtro->nome}%")
            )
            ->when($filtro->grupo_id, fn ($q) =>
                $q->where('grupo_id', $filtro->grupo_id)
            )
             ->when($filtro->excluido, fn ($q) =>
                $q->withTrashed()
            )
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

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
            ->where('status', UsuarioStatus::ATIVO->value)
            ->first();
    }

    public function obterUsuarioAtivoPorId(string $id, EntidadeTipo $entidadeTipo): Usuario | null
    {
        return Usuario::with('grupo.entidadeTipo')
            ->whereHas('grupo.entidadeTipo', function (Builder $query) use ($entidadeTipo) {
                return $query->where('chave', $entidadeTipo->value);
            })
            ->where('id', $id)
            ->where('status', UsuarioStatus::ATIVO->value)
            ->first();
    }
}
