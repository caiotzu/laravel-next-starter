<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

use App\Models\EmpresaContato;

use App\DTO\EmpresaContato\EmpresaContatoFiltroDTO;
use App\DTO\EmpresaContato\EmpresaContatoCadastroDTO;
use App\DTO\EmpresaContato\EmpresaContatoAtualizacaoDTO;

use App\Enums\ErrorCode;

use App\Exceptions\BusinessException;

class EmpresaContatoService {
    public function cadastrar(EmpresaContatoCadastroDTO $dto): EmpresaContato
    {
        return DB::transaction(function () use ($dto) {
            $contato = EmpresaContato::create([
                'empresa_id' => $dto->empresa_id,
                'tipo' => $dto->tipo,
                'valor' => $dto->valor,
                'ativo' => $dto->ativo,
                'principal' => $dto->principal
            ]);

            return $contato;
        });
    }

    public function atualizar(EmpresaContatoAtualizacaoDTO $dto): EmpresaContato
    {
        return DB::transaction(function () use ($dto) {

            $contato = EmpresaContato::where('id', $dto->contato_id)
                ->where('empresa_id', $dto->empresa_id)
                ->first();

            if(!$contato) {
                throw new BusinessException(
                    'Contato não encontrada.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            $contato->update($dto->paraPersistencia());

            return $contato;
        });
    }

    public function visualizar(string $empresaId, string $contatoId): EmpresaContato
    {
        return DB::transaction(function () use ($empresaId, $contatoId) {
            $contato = EmpresaContato::where('empresa_id', $empresaId)
                ->find($contatoId);

            if (! $contato) {
                throw new BusinessException(
                    'Contato não encontrado.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            return $contato;
        });
    }

    public function excluir(string $empresaId, string $contatoId): void
    {
        DB::transaction(function () use ($empresaId, $contatoId) {

            $contato = EmpresaContato::where('empresa_id', $empresaId)->find($contatoId);

            if (!$contato) {
                throw new BusinessException(
                    'Contato não encontrado para exclusão.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            $contato->delete();
            $contato->fresh();
        });
    }

    public function ativar(string $empresaId, string $contatoId): EmpresaContato
    {
        return DB::transaction(function () use ($empresaId, $contatoId) {

            $contato = EmpresaContato::onlyTrashed()->where('empresa_id', $empresaId)->find($contatoId);


            if (!$contato) {
                throw new BusinessException(
                    'Contato não encontrado para ativação.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            $contato->restore();

            return $contato->fresh();
        });
    }

    public function listar(EmpresaContatoFiltroDTO $filtro): Collection
    {
        return EmpresaContato::query()
            ->when($filtro->empresaId, fn ($q) =>
                $q->where('empresa_id', $filtro->empresaId)
            )
            ->orderBy('created_at', 'DESC')
            ->get();
    }
}
