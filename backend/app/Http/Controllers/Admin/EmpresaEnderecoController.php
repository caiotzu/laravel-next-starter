<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\EmpresaEnderecoService;

use App\Http\Requests\Admin\EmpresaEndereco\CadastrarRequest;
use App\Http\Requests\Admin\EmpresaEndereco\AtualizarRequest;

use App\DTO\EmpresaEndereco\EmpresaEnderecoFiltroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoCadastroDTO;
use App\DTO\EmpresaEndereco\EmpresaEnderecoAtualizacaoDTO;

class EmpresaEnderecoController extends Controller
{
    public function __construct(
        protected EmpresaEnderecoService $empresaEnderecoService,
    ) {}

    public function cadastrar(CadastrarRequest $request, string $empresaId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.cadastrar');

        $contato = $this->empresaEnderecoService->cadastrar(
            EmpresaEnderecoCadastroDTO::criarParaCadastro(
                $empresaId,
                dados: $request->validated()
            )
        );

        return response()->json($contato, 201);
    }

    public function atualizar(AtualizarRequest $request, string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('admin.empresa.contato.atualizar');

        $empresa = $this->empresaEnderecoService->atualizar(
            EmpresaEnderecoAtualizacaoDTO::criarParaAtualizacao(
                $empresaId,
                $enderecoId,
                $request->validated()
            )
        );

        return response()->json($empresa, 200);
    }

    public function visualizar(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.visualizar');

        $endereco = $this->empresaEnderecoService->visualizar($empresaId, $enderecoId);

        return response()->json($endereco, 200);
    }

    public function excluir(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.excluir');

        $this->empresaEnderecoService->excluir($empresaId, $enderecoId);

        return response()->json(null, 204);
    }

    public function ativar(string $empresaId, string $enderecoId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.ativar');

        $endereco = $this->empresaEnderecoService->ativar($empresaId, $enderecoId);

        return response()->json($endereco, 200);
    }

    public function listar(string $empresaId): JsonResponse
    {
        $this->authorize('admin.empresa.endereco.listar');

        $enderecos = $this->empresaEnderecoService->listar(EmpresaEnderecoFiltroDTO::criarParaFiltro([
            'empresaId' => $empresaId
        ]));

        return response()->json($enderecos, 200);
    }
}
