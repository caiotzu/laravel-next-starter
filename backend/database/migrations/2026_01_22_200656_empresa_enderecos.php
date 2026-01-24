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
        Schema::create('empresa_enderecos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('empresa_id');
            $table->foreign('empresa_id')
                ->references('id')
                ->on('empresas');
            $table->string('tipo');
            $table->uuid('municipio_id');
            $table->foreign('municipio_id')
                ->references('id')
                ->on('municipios');
            $table->boolean('ativo')->default(true);
            $table->boolean('principal')->default(false);
            $table->string('cep', 8);
            $table->string('logradouro', 100);
            $table->string('numero', 5);
            $table->string('bairro', 100);
            $table->string('complemento', 50)->nullable(true);
            $table->timestamps($precision = 0);
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('empresa_enderecos');
    }
};
