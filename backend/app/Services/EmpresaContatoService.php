<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Collection;

use App\Events\EmpresaDadosObrigatoriosAtualizados;

use App\Models\Empresa;
use App\Models\EmpresaContato;

use App\DTO\EmpresaContato\EmpresaContatoFiltroDTO;
use App\DTO\EmpresaContato\EmpresaContatoCadastroDTO;
use App\DTO\EmpresaContato\EmpresaContatoAtualizacaoDTO;

use App\Enums\ErrorCode;

use App\Exceptions\BusinessException;

class EmpresaContatoService {

    public function __construct(
        protected EscopoEntidadeService $escopoEntidade,
    ) {}

    /**
     * O escopo de entidade não é decidido aqui: validarAcessoEmpresa()
     * delega inteiramente para EscopoEntidadeService::aplicar(), que sabe
     * se o contexto atual é irrestrito (Admin fora de suporte) ou
     * restrito (Private, ou Admin em modo de suporte — respeitando a
     * entidade impersonada).
     */
    private function validarAcessoEmpresa(string $empresaId): Empresa
    {
        $query = $this->escopoEntidade->aplicar(Empresa::query());

        $empresa = $query->find($empresaId);

        if (!$empresa) {
            throw new BusinessException(
                'Empresa não encontrada.',
                ErrorCode::EMPRESA_NOT_FOUND->value
            );
        }

        return $empresa;
    }

    public function cadastrar(EmpresaContatoCadastroDTO $dto): EmpresaContato
    {
        return DB::transaction(function () use ($dto) {

            $empresa = $this->validarAcessoEmpresa($dto->empresa_id);

            $contato = EmpresaContato::create([
                'empresa_id' => $dto->empresa_id,
                'tipo' => $dto->tipo,
                'valor' => $dto->valor,
                'ativo' => $dto->ativo,
                'principal' => $dto->principal
            ]);

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $contato;
        });
    }

    public function atualizar(EmpresaContatoAtualizacaoDTO $dto): EmpresaContato
    {
        return DB::transaction(function () use ($dto) {

            $empresa = $this->validarAcessoEmpresa($dto->empresa_id);

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

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $contato;
        });
    }

    public function visualizar(string $empresaId, string $contatoId): EmpresaContato
    {
        return DB::transaction(function () use ($empresaId, $contatoId) {

            $this->validarAcessoEmpresa($empresaId);

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

            $empresa = $this->validarAcessoEmpresa($empresaId);

            $contato = EmpresaContato::where('empresa_id', $empresaId)->find($contatoId);

            if (!$contato) {
                throw new BusinessException(
                    'Contato não encontrado para exclusão.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            $contato->delete();
            $contato->fresh();

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));
        });
    }

    public function ativar(string $empresaId, string $contatoId): EmpresaContato
    {
        return DB::transaction(function () use ($empresaId, $contatoId) {

            $empresa = $this->validarAcessoEmpresa($empresaId);

            $contato = EmpresaContato::onlyTrashed()->where('empresa_id', $empresaId)->find($contatoId);

            if (!$contato) {
                throw new BusinessException(
                    'Contato não encontrado para ativação.',
                    ErrorCode::EMPRESA_CONTATO_NOT_FOUND->value
                );
            }

            $contato->restore();
            $contato->fresh();

            /**
             * Dispara o evento para verificar se a empresa pode ser ativada
             */
            event(new EmpresaDadosObrigatoriosAtualizados($empresa));

            return $contato;
        });
    }

    public function listar(EmpresaContatoFiltroDTO $filtro): Collection
    {
        $this->validarAcessoEmpresa($filtro->empresa_id);

        return EmpresaContato::query()
            ->when($filtro->empresa_id, fn ($q) =>
                $q->where('empresa_id', $filtro->empresa_id)
            )
            ->orderBy('created_at', 'DESC')
            ->get();
    }
}
