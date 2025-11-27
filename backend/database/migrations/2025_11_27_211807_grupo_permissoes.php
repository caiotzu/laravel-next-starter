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
        Schema::create('grupo_permissoes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('grupo_id');
            $table->foreign('grupo_id')
                ->references('id')
                ->on('grupos');
            $table->uuid('permissao_id');
            $table->foreign('permissao_id')
                ->references('id')
                ->on('permissoes');
            $table->timestamps($precision = 0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grupo_permissoes');
    }
};
