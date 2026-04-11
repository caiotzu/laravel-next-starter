<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaContatoService;

use App\Http\Requests\Admin\EmpresaContato\CadastrarRequest;
use App\Http\Requests\Admin\EmpresaContato\AtualizarRequest;

use App\DTO\EmpresaContato\EmpresaContatoFiltroDTO;
use App\DTO\EmpresaContato\EmpresaContatoCadastroDTO;
use App\DTO\EmpresaContato\EmpresaContatoAtualizacaoDTO;

class EmpresaContatoController extends Controller
{
    public function __construct(
        protected EmpresaContatoService $empresaContatoService,
    ) {}

    public function cadastrar(CadastrarRequest $request, string $empresaId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.cadastrar');

        $contato = $this->empresaContatoService->cadastrar(
            EmpresaContatoCadastroDTO::criarParaCadastro(
                $empresaId,
                dados: $request->validated()
            )
        );

        return response()->json($contato, 201);
    }

    public function atualizar(AtualizarRequest $request, string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.atualizar');

        $contato = $this->empresaContatoService->atualizar(
            EmpresaContatoAtualizacaoDTO::criarParaAtualizacao(
                $empresaId,
                $contatoId,
                $request->validated()
            )
        );

        return response()->json($contato, 200);
    }

    public function visualizar(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.visualizar');

        $contato = $this->empresaContatoService->visualizar($empresaId, $contatoId);

        return response()->json($contato, 200);
    }

    public function excluir(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.excluir');

        $this->empresaContatoService->excluir($empresaId, $contatoId);

        return response()->json(null, 204);
    }

    public function ativar(string $empresaId, string $contatoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.ativar');

        $contato = $this->empresaContatoService->ativar($empresaId, $contatoId);

        return response()->json($contato, 200);
    }

    public function listar(string $empresaId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.listar');

        $contatos = $this->empresaContatoService->listar(EmpresaContatoFiltroDTO::criarParaFiltro([
            'empresaId' => $empresaId
        ]));

        return response()->json($contatos, 200);
    }
}
