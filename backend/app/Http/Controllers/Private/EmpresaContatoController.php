<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaContatoService;

use App\Http\Requests\Private\EmpresaContato\CadastrarRequest;
use App\Http\Requests\Private\EmpresaContato\AtualizarRequest;

use App\DTO\EmpresaContato\EmpresaContatoFiltroDTO;
use App\DTO\EmpresaContato\EmpresaContatoCadastroDTO;
use App\DTO\EmpresaContato\EmpresaContatoAtualizacaoDTO;

use App\Http\Resources\Private\EmpresaContato\EmpresaContatoResource;

use App\Enums\EntidadeTipo;

class EmpresaContatoController extends Controller
{
    public function __construct(
        protected EmpresaContatoService $empresaContatoService,
    ) {}

    public function cadastrar(CadastrarRequest $request, string $empresaId): JsonResponse
    {
        $this->authorize('private.empresa.contato.cadastrar');

        $contato = $this->empresaContatoService->cadastrar(
            EmpresaContatoCadastroDTO::criarParaCadastro(
                $empresaId,
                dados: $request->validated()
            ),
            EntidadeTipo::PRIVATE
        );

        return EmpresaContatoResource::make($contato)->response()->setStatusCode(201);
    }

    public function atualizar(AtualizarRequest $request, string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('private.empresa.contato.atualizar');

        $contato = $this->empresaContatoService->atualizar(
            EmpresaContatoAtualizacaoDTO::criarParaAtualizacao(
                $empresaId,
                $contatoId,
                $request->validated()
            ),
            EntidadeTipo::PRIVATE
        );

        return EmpresaContatoResource::make($contato)->response()->setStatusCode(200);
    }

    public function visualizar(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('private.empresa.contato.visualizar');

        $contato = $this->empresaContatoService->visualizar($empresaId, $contatoId, EntidadeTipo::PRIVATE);

        return EmpresaContatoResource::make($contato)->response()->setStatusCode(200);
    }

    public function excluir(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('private.empresa.contato.excluir');

        $this->empresaContatoService->excluir($empresaId, $contatoId, EntidadeTipo::PRIVATE);

        return response()->json(null, 204);
    }

    public function ativar(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('private.empresa.contato.ativar');

        $contato = $this->empresaContatoService->ativar($empresaId, $contatoId, EntidadeTipo::PRIVATE);

        return EmpresaContatoResource::make($contato)->response()->setStatusCode(200);
    }

    public function listar(string $empresaId): JsonResponse
    {
        $this->authorize('private.empresa.contato.listar');

        $contatos = $this->empresaContatoService->listar(EmpresaContatoFiltroDTO::criarParaFiltro([
                'empresa_id' => $empresaId
            ]),
            EntidadeTipo::PRIVATE
        );

        return EmpresaContatoResource::collection($contatos)->response()->setStatusCode(200);
    }
}
