<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

use App\Models\EmpresaEndereco;

use App\DTO\EmpresaEndereco\EmpresaEnderecoFiltroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoCadastroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoAtualizacaoDTO;

use App\Enums\ErrorCode;

use App\Exceptions\BusinessException;

class EmpresaEnderecoService {
    public function cadastrar(EmpresaEnderecoCadastroDTO $dto): EmpresaEndereco
    {
        return DB::transaction(function () use ($dto) {
            $endereco = EmpresaEndereco::create([
                'empresa_id' => $dto->empresa_id,
                'tipo' => $dto->tipo,
                'municipio_id' => $dto->municipio_id,
                'ativo' => $dto->ativo,
                'principal' => $dto->principal,
                'cep' => $dto->cep,
                'logradouro' => $dto->logradouro,
                'numero' => $dto->numero,
                'bairro' => $dto->bairro,
                'complemento' => $dto->complemento
            ]);

            return $endereco;
        });
    }

    public function atualizar(EmpresaEnderecoAtualizacaoDTO $dto): EmpresaEndereco
    {
        return DB::transaction(function () use ($dto) {

            $endereco = EmpresaEndereco::where('id', $dto->endereco_id)
                ->where('empresa_id', $dto->empresa_id)
                ->first();

            if(!$endereco) {
                throw new BusinessException(
                    'Endereço não encontrada.',
                    ErrorCode::EMPRESA_ENDERECO_NOT_FOUND->value
                );
            }

            $endereco->update($dto->paraPersistencia());

            return $endereco;
        });
    }

    public function visualizar(string $empresaId, string $enderecoId): EmpresaEndereco
    {
        return DB::transaction(function () use ($empresaId, $enderecoId) {
            $endereco = EmpresaEndereco::with('municipio')->where('empresa_id', $empresaId)
                ->find($enderecoId);

            if (! $endereco) {
                throw new BusinessException(
                    'Endereço não encontrado.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            return $endereco;
        });
    }

    public function excluir(string $empresaId, string $enderecoId): void
    {
        DB::transaction(function () use ($empresaId, $enderecoId) {

            $endereco = EmpresaEndereco::where('empresa_id', $empresaId)->find($enderecoId);

            if (!$endereco) {
                throw new BusinessException(
                    'Endereço não encontrado para exclusão.',
                    ErrorCode::EMPRESA_ENDERECO_NOT_FOUND->value
                );
            }

            $endereco->delete();
            $endereco->fresh();
        });
    }

    public function ativar(string $empresaId, string $enderecoId): EmpresaEndereco
    {
        return DB::transaction(function () use ($empresaId, $enderecoId) {

            $endereco = EmpresaEndereco::onlyTrashed()->where('empresa_id', $empresaId)->find($enderecoId);

            if (!$endereco) {
                throw new BusinessException(
                    'Endereço não encontrado para ativação.',
                    ErrorCode::EMPRESA_ENDERECO_NOT_FOUND->value
                );
            }

            $endereco->restore();

            return $endereco->fresh();
        });
    }

    public function listar(EmpresaEnderecoFiltroDTO $filtro): Collection
    {
        return EmpresaEndereco::query()
            ->with('municipio')
            ->when($filtro->empresa_id, fn ($q) =>
                $q->where('empresa_id', $filtro->empresa_id)
            )
            ->orderBy('created_at', 'DESC')
            ->get();
    }
}
