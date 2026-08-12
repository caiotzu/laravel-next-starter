<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\MensagemService;

use App\Http\Requests\Admin\Mensagem\ListarRequest;
use App\Http\Requests\Admin\Mensagem\CadastrarRequest;

use App\DTO\Mensagem\MensagemFiltroDTO;
use App\DTO\Mensagem\MensagemCadastroDTO;

use App\Http\Resources\Admin\Mensagem\MensagemResource;
use App\Http\Resources\Admin\Mensagem\MensagemVisualizarResource;

class MensagemController extends Controller
{
    public function __construct(
        protected MensagemService $mensagemService,
    ) {}

    public function cadastrar(CadastrarRequest $request): JsonResponse
    {
        $this->authorize('admin.mensagem.cadastrar');

        $mensagem = $this->mensagemService->cadastrar(MensagemCadastroDTO::criarParaCadastro($request->validated()));

        return MensagemResource::make($mensagem)->response()->setStatusCode(201);
    }

    public function visualizar(string $id): JsonResponse
    {
        $this->authorize('admin.mensagem.visualizar');

        $mensagem = $this->mensagemService->visualizar($id);

        return MensagemVisualizarResource::make($mensagem)->response()->setStatusCode(200);
    }

    public function listar(ListarRequest $request): JsonResponse
    {
        $this->authorize('admin.mensagem.listar');

        $mensagens = $this->mensagemService->listar(MensagemFiltroDTO::criarParaFiltro($request->validated()));

        return MensagemResource::collection($mensagens)->response()->setStatusCode(200);
    }
}
