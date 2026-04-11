<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Lookup\ {
    CepController,
    MunicipioController
};

use App\Http\Controllers\Admin\ {
    AuthController,
    PerfilController,
    EmpresaController,
    GrupoEmpresaController,
    EmpresaContatoController,
    EmpresaEnderecoController,
    AutenticacaoDoisFatoresController,
};

use App\Http\Controllers\Private\ {
    AuthController as PrivateAuthController
};

Route::post('/admin/login', [AuthController::class, 'login']);
Route::post('/admin/2fa/verificar', [AuthController::class, 'verificar2fa']);

Route::post('/login', [PrivateAuthController::class, 'login']);

Route::middleware('jwt')->group(function () {
    Route::get('/me', [PrivateAuthController::class, 'me']);
    Route::post('/logout', [PrivateAuthController::class, 'logout']);
    Route::post('/refresh', [PrivateAuthController::class, 'refresh']);

    Route::prefix('lookup')->group(function() {
        Route::get('/ceps/{cep}', [CepController::class, 'consultar']);
        Route::get('/municipios', [MunicipioController::class, 'listar']);
    });

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
            Route::patch('/senha', [PerfilController::class, 'atualizarSenha']);
            Route::get('/sessoes', [PerfilController::class, 'sessoes']);
            Route::patch('/', [PerfilController::class, 'atualizar']);
        });

        Route::prefix('grupos-empresas')->group(function () {
            Route::patch('/{id}/ativar', [GrupoEmpresaController::class, 'ativar']);
            Route::put('/{id}', [GrupoEmpresaController::class, 'atualizar']);
            Route::delete('/{id}', [GrupoEmpresaController::class, 'excluir']);
            Route::get('/{id}', [GrupoEmpresaController::class, 'visualizar']);
            Route::get('/', [GrupoEmpresaController::class, 'listar']);
            Route::post('/', [GrupoEmpresaController::class, 'cadastrar']);
        });

        Route::prefix('empresas')->group(function () {
            Route::patch('/{id}/ativar', [EmpresaController::class, 'ativar']);
            Route::put('/{id}', [EmpresaController::class, 'atualizar']);
            Route::delete('/{id}', [EmpresaController::class, 'excluir']);
            Route::get('/{id}', [EmpresaController::class, 'visualizar']);
            Route::get('/', [EmpresaController::class, 'listar']);
            Route::post('/', [EmpresaController::class, 'cadastrar']);

            Route::prefix('{empresaId}/contatos')->group(function () {
                Route::patch('/{contatoId}/ativar', [EmpresaContatoController::class, 'ativar']);
                Route::put('/{contatoId}', [EmpresaContatoController::class, 'atualizar']);
                Route::get('/{contatoId}', [EmpresaContatoController::class, 'visualizar']);
                Route::delete('/{contatoId}', [EmpresaContatoController::class, 'excluir']);
                Route::get('/', [EmpresaContatoController::class, 'listar']);
                Route::post('/', [EmpresaContatoController::class, 'cadastrar']);
            });

            Route::prefix('{empresaId}/enderecos')->group(function () {
                Route::patch('/{enderecoId}/ativar', [EmpresaEnderecoController::class, 'ativar']);
                Route::put('/{enderecoId}', [EmpresaEnderecoController::class, 'atualizar']);
                Route::get('/{enderecoId}', [EmpresaEnderecoController::class, 'visualizar']);
                Route::delete('/{enderecoId}', [EmpresaEnderecoController::class, 'excluir']);
                Route::get('/', [EmpresaEnderecoController::class, 'listar']);
                Route::post('/', [EmpresaEnderecoController::class, 'cadastrar']);
            });
        });
    });
});
