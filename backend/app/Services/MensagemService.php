<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Jobs\PopularDestinatariosMensagemJob;

use App\Models\Mensagem;
use App\Models\MensagemDirecionamento;

use App\DTO\Mensagem\MensagemFiltroDTO;
use App\DTO\Mensagem\MensagemCadastroDTO;

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

            MensagemDirecionamento::create([
                'mensagem_id' => $mensagem->id,
                'tipo' => $dto->direcionamento->tipo->value,
                'grupo_empresa_id' => $dto->direcionamento->grupo_empresa_id,
                'usuario_id' => $dto->direcionamento->usuario_id,
            ]);

            /**
             * A resolução dos destinatários (que pode envolver um volume
             * grande de usuários quando o direcionamento é por grupo de
             * empresa) é feita de forma assíncrona, em lote, após o commit
             * da transação, evitando travar a requisição de cadastro e
             * problemas de memória/performance.
             */
            DB::afterCommit(fn () => PopularDestinatariosMensagemJob::dispatch(
                $mensagem->id,
                $dto->direcionamento->tipo,
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
}
