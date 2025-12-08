<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;

use Symfony\Component\HttpFoundation\Response;

use Tymon\JWTAuth\Facades\JWTAuth;

use Closure;
use Exception;

class JwtMiddleware
{
    // public function handle(Request $request, Closure $next)
    // {
    //     try {
    //         dd('calma');
    //         JWTAuth::parseToken()->authenticate();
    //     } catch (Exception $e) {
    //         return response()->json(['messages' => ['Não autorizado']], 401);
    //     }

    //     return $next($request);
    // }


    public function handle(Request $request, Closure $next): Response {
        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch(Exception $e) {
            if($e instanceof \Tymon\JWTAuth\Exceptions\TokenInvalidException)
                return response()->json(['error' => true, 'messages' => ['O token é inválido']]);
            else if($e instanceof \Tymon\JWTAuth\Exceptions\TokenExpiredException)
                return response()->json(['error' => true, 'messages' => ['O token expirou']]);
            else
                return response()->json(['error' => true, 'messages' => ['O token de autorização não foi encontrado']]);
        }

        return $next($request);
    }
}
