<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaEnderecoService;

use App\Http\Requests\Private\EmpresaEndereco\CadastrarRequest;
use App\Http\Requests\Private\EmpresaEndereco\AtualizarRequest;

use App\DTO\EmpresaEndereco\EmpresaEnderecoFiltroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoCadastroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoAtualizacaoDTO;

use App\Http\Resources\Private\EmpresaEndereco\EmpresaEnderecoResource;

use App\Enums\EntidadeTipo;

class EmpresaEnderecoController extends Controller
{
    public function __construct(
        protected EmpresaEnderecoService $empresaEnderecoService,
    ) {}

    public function cadastrar(CadastrarRequest $request, string $empresaId): JsonResponse
    {
        $this->authorize('private.empresa.endereco.cadastrar');

        $endereco = $this->empresaEnderecoService->cadastrar(
            EmpresaEnderecoCadastroDTO::criarParaCadastro(
                $empresaId,
                dados: $request->validated()
            ),
            EntidadeTipo::PRIVATE
        );

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(201);
    }

    public function atualizar(AtualizarRequest $request, string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('private.empresa.contato.atualizar');

        $endereco = $this->empresaEnderecoService->atualizar(
            EmpresaEnderecoAtualizacaoDTO::criarParaAtualizacao(
                $empresaId,
                $enderecoId,
                $request->validated()
            ),
            EntidadeTipo::PRIVATE
        );

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    public function visualizar(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('private.empresa.endereco.visualizar');

        $endereco = $this->empresaEnderecoService->visualizar($empresaId, $enderecoId, EntidadeTipo::PRIVATE);

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    public function excluir(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('private.empresa.endereco.excluir');

        $this->empresaEnderecoService->excluir($empresaId, $enderecoId, EntidadeTipo::PRIVATE);

        return response()->json(null, 204);
    }

    public function ativar(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('private.empresa.endereco.ativar');

        $endereco = $this->empresaEnderecoService->ativar($empresaId, $enderecoId, EntidadeTipo::PRIVATE);

        return EmpresaEnderecoResource::make($endereco)->response()->setStatusCode(200);
    }

    public function listar(string $empresaId): JsonResponse
    {
        $this->authorize('private.empresa.endereco.listar');

        $enderecos = $this->empresaEnderecoService->listar(EmpresaEnderecoFiltroDTO::criarParaFiltro([
                'empresa_id' => $empresaId
            ]),
            EntidadeTipo::PRIVATE
        );

        return EmpresaEnderecoResource::collection($enderecos)->response()->setStatusCode(200);
    }
}
