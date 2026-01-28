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

        Route::patch('/grupos-empresas/{id}/ativar', [GrupoEmpresaController::class, 'ativar']);
        Route::delete('/grupos-empresas/{id}', [GrupoEmpresaController::class, 'excluir']);
        Route::patch('/grupos-empresas/{id}', [GrupoEmpresaController::class, 'atualizar']);
        Route::get('/grupos-empresas', [GrupoEmpresaController::class, 'listar']);
        Route::post('/grupos-empresas', [GrupoEmpresaController::class, 'cadastrar']);
    });

    Route::get('/me', [PrivateAuthController::class, 'me']);
    Route::post('/logout', [PrivateAuthController::class, 'logout']);
    Route::post('/refresh', [PrivateAuthController::class, 'refresh']);
});
