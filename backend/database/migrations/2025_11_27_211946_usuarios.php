<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('usuarios', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('grupo_id');
            $table->foreign('grupo_id')
                ->references('id')
                ->on('grupos');
            $table->string('nome');
            $table->string('email')->unique();
            $table->string('senha');
            $table->boolean('ativo')->default(true);
            $table->string('remember_token')->nullable(true);
            $table->string('avatar')->nullable(true);
            $table->boolean('google2fa_enable')->default(false);
            $table->text('google2fa_secret')->nullable(true);
            $table->timestamp('google2fa_confirmado_em', 0)->nullable();
            $table->timestamp('ultimo_login_em', 0)->nullable();
            $table->string('ultimo_ip', 45)->nullable();
            $table->timestamps($precision = 0);
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
