<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

use App\Models\Empresa;
use App\Models\EmpresaContato;
use App\Models\EmpresaEndereco;

use App\DTO\Empresa\EmpresaCadastroDTO;
use App\DTO\Empresa\EmpresaAtualizacaoDTO;
use App\DTO\Empresa\EmpresaFiltroDTO;

use App\Enums\ErrorCode;

use App\Exceptions\BusinessException;

class EmpresaService {

    public function cadastrar(EmpresaCadastroDTO $dto): Empresa
    {
        return DB::transaction(function () use ($dto) {
            $contatos = $dto->contatos;
            $enderecos = $dto->enderecos;

            $empresa = Empresa::create([
                'grupo_empresa_id' => $dto->grupo_empresa_id,
                'matriz_id' => $dto->matriz_id,
                'cnpj' => $dto->cnpj,
                'nome_fantasia' => $dto->nome_fantasia,
                'razao_social' => $dto->razao_social,
                'inscricao_estadual' => $dto->inscricao_estadual,
                'inscricao_municipal' => $dto->inscricao_municipal,
                'ativo' => true,
                'uf' => $dto->uf
            ]);

            foreach($contatos as $contato) {
                EmpresaContato::create([
                    'empresa_id' => $empresa->id,
                    'tipo' => $contato->tipo,
                    'valor' => $contato->valor,
                    'ativo' => $contato->ativo,
                    'principal' => $contato->principal
                ]);
            }

            foreach($enderecos as $endereco) {
                EmpresaEndereco::create([
                    'empresa_id' => $empresa->id,
                    'tipo' => $endereco->tipo,
                    'municipio_id' => $endereco->municipio_id,
                    'ativo' => $endereco->ativo,
                    'principal' => $endereco->principal,
                    'cep' => $endereco->cep,
                    'logradouro' => $endereco->logradouro,
                    'numero' => $endereco->numero,
                    'bairro' => $endereco->bairro,
                    'complemento'
                ]);
            }

            return $empresa;
        });
    }

    public function atualizar(string $id, EmpresaAtualizacaoDTO $dto): Empresa
    {
        return DB::transaction(function () use ($id, $dto) {

            $empresa = Empresa::find($id);
            if(!$empresa)
                throw new BusinessException('Empresa não encontrada.', ErrorCode::EMPRESA_NOT_FOUND->value);

            $empresa->update($dto->paraPersistencia());

            return $empresa;
        });
    }

    public function visualizar(string $id): Empresa
    {
        return DB::transaction(function () use ($id) {
            $empresa = Empresa::with([
                'grupoEmpresa',
                'contatos',
                'enderecos.municipio'
            ])->find($id);

            if (! $empresa) {
                throw new BusinessException(
                    'Empresa não encontrado.',
                    ErrorCode::EMPRESA_NOT_FOUND->value
                );
            }

            return $empresa;
        });
    }

    public function excluir(string $id): void
    {
        DB::transaction(function () use ($id) {

            $empresa = Empresa::find($id);

            if (!$empresa) {
                throw new BusinessException(
                    'Empresa não encontrado para exclusão.',
                    ErrorCode::EMPRESA_NOT_FOUND->value
                );
            }

            $empresa->delete();
            $empresa->fresh();
        });
    }

    public function ativar(string $id): Empresa
    {
        return DB::transaction(function () use ($id) {

            $empresa = Empresa::onlyTrashed()->find($id);


            if (!$empresa) {
                throw new BusinessException(
                    'Empresa não encontrado para ativação.',
                    ErrorCode::EMPRESA_NOT_FOUND->value
                );
            }

            $empresa->restore();

            return $empresa->fresh();
        });
    }

    public function listar(EmpresaFiltroDTO $filtro): LengthAwarePaginator
    {
        return Empresa::query()
            ->when($filtro->id, fn ($q) =>
                $q->where('id', $filtro->id)
            )
            ->when($filtro->grupo_empresa_id, fn ($q) =>
                $q->where('grupo_empresa_id', $filtro->grupo_empresa_id)
            )
            ->when($filtro->matriz_id, fn ($q) =>
                $q->where('matriz_id', $filtro->matriz_id)
            )
            ->when($filtro->cnpj, fn ($q) =>
                $q->where('cnpj', 'ilike', "%{$filtro->cnpj}%")
            )
            ->when($filtro->nome_fantasia, fn ($q) =>
                $q->where('nome_fantasia', 'ilike', "%{$filtro->nome_fantasia}%")
            )
            ->when($filtro->razao_social, fn ($q) =>
                $q->where('razao_social', 'ilike', "%{$filtro->razao_social}%")
            )
            ->when($filtro->inscricao_estadual, fn ($q) =>
                $q->where('inscricao_estadual', 'ilike', "%{$filtro->inscricao_estadual}%")
            )
            ->when($filtro->inscricao_municipal, fn ($q) =>
                $q->where('inscricao_municipal', 'ilike', "%{$filtro->inscricao_municipal}%")
            )
            ->when(! is_null($filtro->ativo), fn ($q) =>
                $q->where('ativo', $filtro->ativo)
            ) // When não funciona bem com boolean, então caso queira filtrar os inativos precisar ser assim
            ->when($filtro->uf, fn ($q) =>
                $q->where('uf', $filtro->uf)
            )
             ->when($filtro->excluido, fn ($q) =>
                $q->withTrashed()
            )
            ->orderBy('created_at', 'DESC')
            ->paginate($filtro->paginacao->por_pagina);
    }
}
