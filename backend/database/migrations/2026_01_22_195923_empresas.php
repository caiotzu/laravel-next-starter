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
        Schema::create('empresas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('grupo_empresa_id');
            $table->foreign('grupo_empresa_id')
                ->references('id')
                ->on('grupo_empresas');
            $table->uuid('matriz_id')->nullable(true);
            $table->string('cnpj', 14)->unique();
            $table->string('nome_fantasia', 60);
            $table->string('razao_social', 60);
            $table->string('inscricao_estadual')->nullable(true);
            $table->string('inscricao_municipal')->nullable(true);
            $table->boolean('ativo')->default(true);
            $table->string('uf', 2);
            $table->timestamps($precision = 0);
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empresas');
    }
};
