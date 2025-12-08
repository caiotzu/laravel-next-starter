<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\ {
  AuthController
};


Route::post('/login', [AuthController::class, 'login']);

Route::middleware('jwt')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
});
