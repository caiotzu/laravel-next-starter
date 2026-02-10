<?php

use Illuminate\Foundation\Application;
use Illuminate\Validation\ValidationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Database\Eloquent\ModelNotFoundException;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

use App\Http\Middleware\JwtMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'jwt' => JwtMiddleware::class
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, $request) {

            if ($request->is('api/*')) {

                // Validação de formulário (campos)
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'errors' => $e->errors()
                    ], Response::HTTP_UNPROCESSABLE_ENTITY);
                }

                // Permissão → business
                if ($e instanceof AccessDeniedHttpException) {
                    return response()->json([
                        'errors' => [
                            'business' => ['Você não tem permissão para executar esta ação.']
                        ]
                    ], Response::HTTP_FORBIDDEN);
                }

                // Não encontrado → business
                if ($e instanceof ModelNotFoundException) {
                    return response()->json([
                        'errors' => [
                            'business' => ['Registro não encontrado.']
                        ]
                    ], Response::HTTP_NOT_FOUND);
                }

                // Regra de negócio customizada
                if ($e instanceof \App\Exceptions\BusinessException) {
                    return response()->json([
                        'errors' => [
                            'business' => [$e->getMessage()]
                        ]
                    ], Response::HTTP_BAD_REQUEST);
                }

                // HttpException
                if ($e instanceof HttpExceptionInterface) {
                    return response()->json([
                        'errors' => [
                            'business' => [
                                $e->getMessage() ?: 'Erro na requisição.'
                            ]
                        ]
                    ], $e->getStatusCode());
                }

                // Exception geral
                if ($e instanceof \RuntimeException || $e instanceof \InvalidArgumentException) {
                    return response()->json([
                        'errors' => [
                            'business' => [$e->getMessage()]
                        ]
                    ], Response::HTTP_BAD_REQUEST);
                }

                // Erro inesperado
                return response()->json([
                    'errors' => [
                        'business' => [
                            app()->isProduction()
                                ? 'Erro interno do servidor.'
                                : $e->getMessage()
                        ]
                    ]
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
            return null;
        });
    })->create();
