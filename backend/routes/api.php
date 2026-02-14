<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Admin\ {
    AuthController,
    GrupoEmpresaController
};

use App\Http\Controllers\Private\ {
    AuthController as PrivateAuthController
};

Route::post('/admin/login', [AuthController::class, 'login']);
Route::post('/login', [PrivateAuthController::class, 'login']);

Route::middleware('jwt')->group(function () {
    Route::prefix('admin')->group(function() {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
        Route::get('/sessoes', [AuthController::class, 'sessoes']);
        Route::delete('/sessoes/{id}/encerrar', [AuthController::class, 'encerrarSessao']);

        Route::prefix('grupos-empresas')->group(function () {
            Route::patch('/{id}/ativar', [GrupoEmpresaController::class, 'ativar']);
            Route::patch('/{id}', [GrupoEmpresaController::class, 'atualizar']);
            Route::delete('/{id}', [GrupoEmpresaController::class, 'excluir']);
            Route::get('/{id}', [GrupoEmpresaController::class, 'visualizar']);
            Route::get('/', [GrupoEmpresaController::class, 'listar']);
            Route::post('/', [GrupoEmpresaController::class, 'cadastrar']);
        });
    });

    Route::get('/me', [PrivateAuthController::class, 'me']);
    Route::post('/logout', [PrivateAuthController::class, 'logout']);
    Route::post('/refresh', [PrivateAuthController::class, 'refresh']);
});
