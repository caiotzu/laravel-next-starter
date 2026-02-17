<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Admin\ {
    AuthController,
    PerfilController,
    GrupoEmpresaController,
    AutenticacaoDoisFatoresController
};

use App\Http\Controllers\Private\ {
    AuthController as PrivateAuthController
};

Route::post('/admin/login', [AuthController::class, 'login']);
Route::post('/admin/2fa/verificar', [AuthController::class, 'verificar2fa']);

Route::post('/login', [PrivateAuthController::class, 'login']);

Route::middleware('jwt')->group(function () {
    Route::prefix('admin')->group(function() {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);

        Route::prefix('2fa')->group(function () {
            Route::post('/habilitar', [AutenticacaoDoisFatoresController::class, 'habilitar']);
            Route::post('/confirmar', [AutenticacaoDoisFatoresController::class, 'confirmar']);
            Route::delete('/desabilitar', [AutenticacaoDoisFatoresController::class, 'desabilitar']);
        });

        Route::prefix('perfil')->group(function () {
            Route::delete('/sessoes/{id}/encerrar', [PerfilController::class, 'encerrarSessao']);
            Route::patch('/avatar', [PerfilController::class, 'atualizarAvatarBase64']);
            Route::get('/sessoes', [PerfilController::class, 'sessoes']);
            Route::patch('/atualizar', [PerfilController::class, 'atualizar']);
        });

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
