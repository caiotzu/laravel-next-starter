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
        Schema::create('tokens_reset_senha', function (Blueprint $table) {

            $table->uuid('id')->primary();
            $table->uuid('usuario_id');
            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
            $table->string('token', 64)->unique();
            $table->timestamp('expira_em');
            $table->timestamp('usado_em')->nullable();
            $table->timestamps($precision = 0);
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tokens_reset_senha');
    }
};
