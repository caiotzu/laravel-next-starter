<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Events\GrupoExcluido;

use App\Models\Grupo;
use App\Models\Permissao;

use App\DTO\Grupo\GrupoFiltroDTO;
use App\DTO\Grupo\GrupoCadastroDTO;
use App\DTO\Grupo\GrupoAtualizacaoDTO;
use App\DTO\Grupo\SincronizarPermissoesDTO;

use App\Enums\ErrorCode;
use App\Enums\AuditoriaAcao;

use App\Exceptions\BusinessException;

use App\Repositories\GrupoRepository;

/**
 * Todo grupo pertence a um tipo de entidade (Ex: admin, private) e a um identificador da
 * entidade (Ex: null para admin, grupo_empresas para private). O "de quem são os dados" vem
 * SEMPRE de EscopoEntidadeService::atual() — a fonte da verdade, que já considera o modo de
 * suporte — e é aplicado pelo GrupoRepository, nunca montado aqui.
 */
class GrupoService {

    public function __construct(
        private GrupoRepository $grupos,
        private EscopoEntidadeService $escopoEntidade,
    ) {}

    public function cadastrar(GrupoCadastroDTO $dto): Grupo
    {
        return DB::transaction(function () use ($dto) {

            $escopo = $this->escopoEntidade->atual();

            if ($this->grupos->existeComDescricaoNoEscopo($escopo, $dto->descricao)) {
                throw new BusinessException(
                    'Já existe um grupo com essa descrição.',
                    ErrorCode::GRUPO_ALREADY_EXISTS->value
                );
            }

            return $this->grupos->criarNoEscopo($escopo, $dto->descricao);
        });
    }

    public function atualizar(GrupoAtualizacaoDTO $dto): Grupo
    {
        return DB::transaction(function () use ($dto) {
            /**
             * Para atualizar o grupo precisa ser do mesmo tipo de entidade.
             * Ex: admin, private
             *
             * E também deve pertencer ao mesmo identificador da entidade.
             * Ex: null (admin), grupo_empresas.
             */
            $escopo = $this->escopoEntidade->atual();

            $grupo = $this->grupos->buscarNoEscopo($escopo, $dto->id);

            if (!$grupo) {
                throw new BusinessException(
                    'Grupo não encontrado.',
                    ErrorCode::GRUPO_NOT_FOUND->value
                );
            }

            if (!$dto->temAlteracoes()) {
                throw new BusinessException(
                    'Nenhum dado informado para atualização.',
                    ErrorCode::GRUPO_REQUIRED->value
                );
            }

            // Verifica duplicidade somente se a descrição estiver sendo alterada
            if ($dto->descricao !== null) {

                if ($this->grupos->existeComDescricaoNoEscopo($escopo, $dto->descricao, $grupo->id)) {
                    throw new BusinessException(
                        'Já existe um grupo com essa descrição.',
                        ErrorCode::GRUPO_ALREADY_EXISTS->value
                    );
                }
            }

            $grupo->update($dto->paraPersistencia());

            return $grupo;
        });
    }

    public function visualizar(string $id): Grupo
    {
        return DB::transaction(function () use ($id) {
            /**
             * Para visualizar o grupo precisa ser do mesmo tipo de entidade. Ex: admin, private
             * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
             */
            $grupo = $this->grupos->buscarComPermissoesNoEscopo($this->escopoEntidade->atual(), $id);

            if (! $grupo) {
                throw new BusinessException(
                    'Grupo não encontrado.',
                    ErrorCode::GRUPO_NOT_FOUND->value
                );
            }

            return $grupo;
        });
    }

    public function excluir(string $id): void
    {
        DB::transaction(function () use ($id) {
            /**
             * Para excluir o grupo precisa ser do mesmo tipo de entidade. Ex: admin, private
             * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
             */
            $grupo = $this->grupos->buscarNoEscopo($this->escopoEntidade->atual(), $id);

            if (!$grupo) {
                throw new BusinessException(
                    'Grupo não encontrado para exclusão.',
                    ErrorCode::GRUPO_NOT_FOUND->value
                );
            }

            $grupo->delete();
            $grupo->fresh();

            event(new GrupoExcluido($grupo));
        });
    }

    public function ativar(string $id): Grupo
    {
        return DB::transaction(function () use ($id) {
            /**
             * Para ativar o grupo precisa ser do mesmo tipo de entidade. Ex: admin, private
             * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
             */
            $grupo = $this->grupos->buscarExcluidoNoEscopo($this->escopoEntidade->atual(), $id);

            if (!$grupo) {
                throw new BusinessException(
                    'Grupo não encontrado para ativação.',
                    ErrorCode::GRUPO_NOT_FOUND->value
                );
            }

            $grupo->restore();

            return $grupo->fresh();
        });
    }

    public function listar(GrupoFiltroDTO $filtro): LengthAwarePaginator
    {
        /**
         * Para listar o grupo precisa ser do mesmo tipo de entidade. Ex: admin, private
         * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
         */
        return $this->grupos->listarNoEscopo($this->escopoEntidade->atual(), $filtro);
    }

    public function sincronizarPermissoes(SincronizarPermissoesDTO $dto)
    {
        return DB::transaction(function () use ($dto) {

            /**
             * Verifica se todas as permissões passadas são do tipo para
             * poder efetuar a atualização
             */
            $permissoesInvalidas = Permissao::whereIn('id', $dto->permissoes)
                ->where('chave', 'not like', $dto->permissao_tipo->value . '%')
                ->exists();

            if ($permissoesInvalidas) {
                 throw new BusinessException(
                    'Existem permissões incompatíveis com o tipo do grupo.',
                    ErrorCode::GRUPO_NOT_FOUND->value
                );
            }

            /**
             * Para sincronizar o grupo precisa ser do mesmo tipo de entidade. Ex: admin, private
             * e também deve pertencer ao mesmo identificador da entidade. Ex: null (admin), grupo_empresas.
             */
            $grupo = $this->grupos->buscarComPermissoesNoEscopoOuFalhar($this->escopoEntidade->atual(), $dto->grupo_id);

            /**
             * sync() altera a tabela pivô grupo_permissoes diretamente, sem
             * disparar eventos do Model — por isso capturamos o antes/depois
             * manualmente aqui e registramos a auditoria explicitamente.
             */
            $permissoesAntes = $grupo->permissoes()->pluck('chave')->sort()->values()->all();

            $grupo->permissoes()->sync($dto->permissoes);

            $permissoesDepois = $grupo->permissoes()->pluck('chave')->sort()->values()->all();

            if ($permissoesAntes !== $permissoesDepois) {
                $grupo->registrarAuditoriaManual(
                    AuditoriaAcao::ATUALIZACAO,
                    ['permissoes' => $permissoesAntes],
                    ['permissoes' => $permissoesDepois]
                );
            }

            /**
             * Força o disparo do evento 'updating' do Grupo
             * Isso fará com que o seu static::updating incremente a versão
             */
            $grupo->touch();

            return $grupo->refresh();
        });
    }
}
