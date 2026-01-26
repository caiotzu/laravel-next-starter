<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

use Throwable;

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

                // Validação
                if ($e instanceof ValidationException) {
                    return response()->json([
                        'messages' => collect($e->errors())->flatten()->values(),
                    ], Response::HTTP_UNPROCESSABLE_ENTITY);
                }

                // Não encontrado
                if ($e instanceof ModelNotFoundException) {
                    return response()->json([
                        'messages' => ['Registro não encontrado.'],
                    ], Response::HTTP_NOT_FOUND);
                }

                // HttpException (abort, auth, etc)
                if ($e instanceof HttpExceptionInterface) {
                    return response()->json([
                        'messages' => [$e->getMessage() ?: 'Erro na requisição.'],
                    ], $e->getStatusCode());
                }

                // Regra de negócio → 400
                if ($e instanceof \RuntimeException || $e instanceof \InvalidArgumentException) {
                    return response()->json([
                        'messages' => explode('|', $e->getMessage()),
                    ], Response::HTTP_BAD_REQUEST);
                }

                // Erro inesperado
                return response()->json([
                    'messages' => [
                        app()->isProduction()
                            ? 'Erro interno do servidor.'
                            : $e->getMessage()
                    ],
                ], Response::HTTP_INTERNAL_SERVER_ERROR);
            }
            return null;
        });
    })->create();
