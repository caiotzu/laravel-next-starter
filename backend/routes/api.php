<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Admin\ {
  AuthController
};

Route::post('admin/login', [AuthController::class, 'login']);

Route::middleware('jwt')->group(function () {
    Route::prefix('admin')->group(function() {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh', [AuthController::class, 'refresh']);
    });
});
