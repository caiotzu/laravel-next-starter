<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\MensagemDestinatario;

use App\DTO\Mensagem\MensagemConsultaFiltroDTO;

use App\Enums\ErrorCode;

use App\Exceptions\BusinessException;

class MensagemPrivateService {

    public function listar(MensagemConsultaFiltroDTO $filtro, string $usuarioId): LengthAwarePaginator
    {
        return MensagemDestinatario::query()
            ->doUsuario($usuarioId)
            ->with('mensagem')
            ->when($filtro->lida === true, fn ($q) => $q->lidas())
            ->when($filtro->lida === false, fn ($q) => $q->naoLidas())
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }

    public function marcarComoLida(string $mensagemId, string $usuarioId): MensagemDestinatario
    {
        return DB::transaction(function () use ($mensagemId, $usuarioId) {

            // O destinatário é sempre buscado filtrando pelo usuário
            // autenticado: um usuário nunca consegue marcar como lida uma
            // mensagem que não seja destinada a ele, independente do que
            // for informado pelo frontend.
            $destinatario = MensagemDestinatario::query()
                ->where('mensagem_id', $mensagemId)
                ->doUsuario($usuarioId)
                ->first();

            if (! $destinatario) {
                throw new BusinessException(
                    'Mensagem não encontrada.',
                    ErrorCode::MENSAGEM_NOT_FOUND->value
                );
            }

            if (! $destinatario->lida_em) {
                $destinatario->update(['lida_em' => now()]);
            }

            return $destinatario->fresh('mensagem');
        });
    }

    public function marcarTodasComoLidas(string $usuarioId): int
    {
        return MensagemDestinatario::query()
            ->doUsuario($usuarioId)
            ->naoLidas()
            ->update(['lida_em' => now()]);
    }

    public function contarNaoLidas(string $usuarioId): int
    {
        return MensagemDestinatario::query()
            ->doUsuario($usuarioId)
            ->naoLidas()
            ->count();
    }
}
