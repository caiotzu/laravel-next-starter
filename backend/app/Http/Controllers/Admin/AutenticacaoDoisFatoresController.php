<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

use App\Services\AutenticacaoDoisFatoresService;

use App\Http\Requests\Admin\AutenticacaoDoisFatores\HabilitarRequest;
use App\Http\Requests\Admin\AutenticacaoDoisFatores\ConfirmarRequest;
use App\Http\Requests\Admin\AutenticacaoDoisFatores\DesabilitarRequest;

use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresHabilitacaoDTO;
use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresConfirmacaoDTO;
use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresDesabilitacaoDTO;

class AutenticacaoDoisFatoresController extends Controller
{
    public function __construct(
        protected AutenticacaoDoisFatoresService $autenticacaoDoisFatoresService
    ) {}

    public function habilitar(HabilitarRequest $request): JsonResponse
    {
        /** @var \App\Models\Usuario $user */
        $user = Auth::user();


        $dto = new AutenticacaoDoisFatoresHabilitacaoDTO(
            usuario: $user,
            senha: $request->senha
        );

        $dados = $this->autenticacaoDoisFatoresService->habilitar($dto);

        return response()->json($dados);
    }

    public function confirmar(ConfirmarRequest $request): JsonResponse
    {
        /** @var \App\Models\Usuario $user */
        $user = Auth::user();

        $dto = new AutenticacaoDoisFatoresConfirmacaoDTO(
            usuario: $user,
            codigo: $request->codigo
        );

        $this->autenticacaoDoisFatoresService->confirmar($dto);

        return response()->json([
            'message' => '2FA ativado com sucesso.'
        ]);
    }

    public function desabilitar(DesabilitarRequest $request): JsonResponse
    {
        /** @var \App\Models\Usuario $user */
        $user = Auth::user();

        $dto = new AutenticacaoDoisFatoresDesabilitacaoDTO(
            usuario: $user,
            senha: $request->senha,
            codigo: $request->codigo
        );

        $this->autenticacaoDoisFatoresService->desabilitar($dto);

        return response()->json([
            'message' => '2FA desabilitado com sucesso.'
        ]);
    }

}
