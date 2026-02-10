<?php

namespace App\Http\Controllers\Private;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

use App\Services\UsuarioService;

use App\Http\Requests\Auth\LoginRequest;

use App\Enums\EntidadeTipo;

use App\Exceptions\BusinessException;

class AuthController extends Controller
{
    public function __construct(
        protected UsuarioService $usuarioService,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        try {
            $usuario = $this->usuarioService->obterUsuarioAtivoPorEmail($request->email, EntidadeTipo::PRIVATE);

            if (!$usuario || !Hash::check($request->senha, $usuario->senha))
                throw new BusinessException('Credenciais informadas são inválidas');

            $token = JWTAuth::fromUser($usuario);

            return response()->json([
                'token' => $token,
                'expires_in' => JWTAuth::factory()->getTTL() * 60,
            ]);
        } catch (BusinessException $e) {
            return response()->json([
                'errors' => [
                    'business' => [$e->getMessage()]
                ]
            ], 401);
        }
    }

    public function logout(): JsonResponse
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());

            return response()->json(['messages' => ['Desconectado com sucesso']]);
        } catch (JWTException $e) {
            return response()->json([
                'messages' => ['Não foi possível desconectar o usuário. Tente novamente']
            ], 500);
        }
    }

    public function me(): JsonResponse
    {
        try {
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }
            return response()->json($user);
        } catch (JWTException $e) {
            return response()->json(['error' => 'Failed to fetch user profile'], 500);
        }
    }

    public function refresh(): JsonResponse
    {
        return response()->json([
            'token' => JWTAuth::parseToken()->refresh(),
            'expires_in' => JWTAuth::factory()->getTTL() * 60
        ]);
    }
}
