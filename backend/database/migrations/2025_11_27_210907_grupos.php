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
        Schema::create('grupos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('descricao');
            $table->uuid('entidade_tipo_id');
            $table->foreign('entidade_tipo_id')
                ->references('id')
                ->on('entidade_tipos');
            $table->uuid('entidade_id')->nullable(true)->comment('Representa o identificador (id) da tabela que foi referenciada em entidade_tipo coluna (entidade_tabela)');
            $table->timestamps($precision = 0);
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grupos');
    }
};
