<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\MensagemPrivateService;

use App\Http\Requests\Private\Mensagem\ListarRequest;

use App\DTO\Mensagem\MensagemConsultaFiltroDTO;

use App\Http\Resources\Private\Mensagem\MensagemResource;

class MensagemController extends Controller
{
    public function __construct(
        protected MensagemPrivateService $mensagemService,
    ) {}

    public function listar(ListarRequest $request): JsonResponse
    {
        $mensagens = $this->mensagemService->listar(
            MensagemConsultaFiltroDTO::criarParaFiltro($request->validated()),
            Auth::id()
        );

        return MensagemResource::collection($mensagens)->response()->setStatusCode(200);
    }

    public function marcarComoLida(string $id): JsonResponse
    {
        $destinatario = $this->mensagemService->marcarComoLida($id, Auth::id());

        return MensagemResource::make($destinatario)->response()->setStatusCode(200);
    }

    public function marcarTodasComoLidas(): JsonResponse
    {
        $this->mensagemService->marcarTodasComoLidas(Auth::id());

        return response()->json(null, 204);
    }

    public function contarNaoLidas(): JsonResponse
    {
        return response()->json([
            'data' => [
                'total_nao_lidas' => $this->mensagemService->contarNaoLidas(Auth::id()),
            ],
        ]);
    }
}
