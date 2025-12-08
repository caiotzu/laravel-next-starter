<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

use App\Models\Usuario;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $usuario = Usuario::where('email', $request->email)->where('ativo', true)->first();

        if (!$usuario || !Hash::check($request->senha, $usuario->senha)) {
            return response()->json([
                'messages' => ['Não autorizado']
            ], 401);
        }

        $token = JWTAuth::fromUser($usuario);

        return response()->json([
            'token' => $token,
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
        ]);
    }

    public function logout()
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

    public function me()
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
}
