<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Jobs\PopularDestinatariosMensagemJob;

use App\Models\Mensagem;
use App\Models\MensagemDirecionamento;
use App\Models\EntidadeTipo as EntidadeTipoModel;
use App\Models\Usuario;

use App\DTO\Mensagem\MensagemFiltroDTO;
use App\DTO\Mensagem\MensagemCadastroDTO;
use App\DTO\Mensagem\MensagemBuscaUsuarioFiltroDTO;

use App\Enums\ErrorCode;
use App\Enums\MensagemOrigem;

use App\Exceptions\BusinessException;

class MensagemService {

    public function cadastrar(MensagemCadastroDTO $dto): Mensagem
    {
        return DB::transaction(function () use ($dto) {

            $mensagem = Mensagem::create([
                'titulo' => $dto->titulo,
                'conteudo' => $dto->conteudo,
                'origem' => MensagemOrigem::ADMIN->value,
                'remetente_id' => Auth::id(),
            ]);

            /**
             * A tabela `mensagem_direcionamentos` reaproveita `entidade_tipos`
             * (mesma tabela já usada em `grupos.entidade_tipo_id`) para o
             * direcionamento por Entidade (ex: ADMIN, PRIVATE).
             */
            $entidadeTipoId = $dto->direcionamento->entidade_tipo
                ? EntidadeTipoModel::where('chave', $dto->direcionamento->entidade_tipo->value)->value('id')
                : null;

            if ($dto->direcionamento->entidade_tipo && ! $entidadeTipoId) {
                throw new BusinessException(
                    'A entidade selecionada não foi encontrada.',
                    ErrorCode::MENSAGEM_DIRECIONAMENTO_INVALIDO->value
                );
            }

            MensagemDirecionamento::create([
                'mensagem_id' => $mensagem->id,
                'tipo' => $dto->direcionamento->tipo->value,
                'entidade_tipo_id' => $entidadeTipoId,
                'grupo_empresa_id' => $dto->direcionamento->grupo_empresa_id,
                'usuario_id' => $dto->direcionamento->usuario_id,
            ]);

            /**
             * A resolução dos destinatários (que pode envolver um volume
             * grande de usuários quando o direcionamento é Geral, por
             * Entidade ou por grupo de empresa) é feita de forma
             * assíncrona, em lote, após o commit da transação, evitando
             * travar a requisição de cadastro e problemas de
             * memória/performance.
             */
            DB::afterCommit(fn () => PopularDestinatariosMensagemJob::dispatch(
                $mensagem->id,
                $dto->direcionamento->tipo,
                $entidadeTipoId,
                $dto->direcionamento->grupo_empresa_id,
                $dto->direcionamento->usuario_id,
            ));

            return $mensagem;
        });
    }

    public function visualizar(string $id): Mensagem
    {
        $mensagem = Mensagem::with([
                'remetente',
                'direcionamento.entidadeTipo',
                'direcionamento.grupoEmpresa',
                'direcionamento.usuario',
            ])
            ->withCount([
                'destinatarios',
                'destinatarios as destinatarios_lidos_count' => fn ($q) => $q->whereNotNull('lida_em'),
            ])
            ->find($id);

        if (! $mensagem) {
            throw new BusinessException(
                'Mensagem não encontrada.',
                ErrorCode::MENSAGEM_NOT_FOUND->value
            );
        }

        return $mensagem;
    }

    public function listar(MensagemFiltroDTO $filtro): LengthAwarePaginator
    {
        return Mensagem::query()
            ->with([
                'remetente',
                'direcionamento.entidadeTipo',
                'direcionamento.grupoEmpresa',
                'direcionamento.usuario',
            ])
            ->withCount([
                'destinatarios',
                'destinatarios as destinatarios_lidos_count' => fn ($q) => $q->whereNotNull('lida_em'),
            ])
            ->when($filtro->id, fn ($q) =>
                $q->where('id', $filtro->id)
            )
            ->when($filtro->titulo, fn ($q) =>
                $q->where('titulo', 'ilike', "%{$filtro->titulo}%")
            )
            ->when($filtro->origem, fn ($q) =>
                $q->where('origem', $filtro->origem->value)
            )
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

    /**
     * Busca usuários em TODO o sistema (qualquer entidade/grupo/empresa),
     * usada exclusivamente para o direcionamento individual ("Usuário") no
     * cadastro de mensagem. Diferente de `UsuarioService::listar`, aqui não
     * há escopo pela entidade do usuário autenticado, pois o Admin precisa
     * poder selecionar qualquer usuário do sistema como destinatário.
     *
     * Retorna poucos campos e uma quantidade limitada de resultados (estilo
     * autocomplete), para não carregar todos os usuários de uma vez.
     */
    public function buscarUsuarios(MensagemBuscaUsuarioFiltroDTO $filtro): LengthAwarePaginator
    {
        return Usuario::query()
            ->select(['id', 'nome', 'email'])
            ->when($filtro->nome, fn ($q) =>
                $q->where('nome', 'ilike', "%{$filtro->nome}%")
            )
            ->orderBy('nome')
            ->paginate($filtro->paginacao->por_pagina);
    }
}
