<?php

namespace App\Http\Controllers\Global;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\MensagemDestinatarioService;

use App\Http\Requests\Global\Mensagem\ListarRequest;

use App\DTO\Mensagem\MensagemConsultaFiltroDTO;

use App\Http\Resources\Global\Mensagem\MensagemResource;

class MensagemController extends Controller
{
    public function __construct(
        protected MensagemDestinatarioService $mensagemDestinatarioService,
    ) {}

    public function listar(ListarRequest $request): JsonResponse
    {
        $mensagens = $this->mensagemDestinatarioService->listar(
            MensagemConsultaFiltroDTO::criarParaFiltro($request->validated()),
            Auth::id()
        );

        return MensagemResource::collection($mensagens)->response()->setStatusCode(200);
    }

    public function visualizar(string $id): JsonResponse
    {
        $destinatario = $this->mensagemDestinatarioService->visualizar($id, Auth::id());

        return MensagemResource::make($destinatario)->response()->setStatusCode(200);
    }

    public function marcarComoLida(string $id): JsonResponse
    {
        $destinatario = $this->mensagemDestinatarioService->marcarComoLida($id, Auth::id());

        return MensagemResource::make($destinatario)->response()->setStatusCode(200);
    }

    public function marcarTodasComoLidas(): JsonResponse
    {
        $this->mensagemDestinatarioService->marcarTodasComoLidas(Auth::id());

        return response()->json(null, 204);
    }

    public function contarNaoLidas(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_nao_lidas' => $this->mensagemDestinatarioService->contarNaoLidas(Auth::id()),
            ],
        ]);
    }
}
