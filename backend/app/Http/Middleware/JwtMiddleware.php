<?php

namespace App\Http\Middleware;

use Closure;
use Exception;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;

use App\Services\UsuarioSessaoService;
use App\Exceptions\BusinessException;

class JwtMiddleware
{
    public function __construct(
        protected UsuarioSessaoService $usuarioSessaoService
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        try {

            $user = JWTAuth::parseToken()->authenticate();
            $payload = JWTAuth::getPayload();

            $sessionId = $payload->get('session_id');

            if (!$sessionId) {
                throw new BusinessException('Sessão não encontrada no token.');
            }

            $this->usuarioSessaoService->validarSessaoAtiva($sessionId);

        } catch (\Tymon\JWTAuth\Exceptions\TokenInvalidException $e) {

            return response()->json([
                'errors' => [
                    'business' => 'O token é inválido'
                ]
            ], 401);

        } catch (\Tymon\JWTAuth\Exceptions\TokenExpiredException $e) {

            return response()->json([
                'errors' => [
                    'business' => 'O token expirou'
                ]
            ], 401);

        } catch (BusinessException $e) {

            return response()->json([
                'errors' => [
                    'business' => $e->getMessage()
                ]
            ], 401);

        } catch (Exception $e) {

            return response()->json([
                'errors' => [
                    'business' => 'O token de autorização não foi encontrado'
                ]
            ], 401);
        }

        return $next($request);
    }
}
