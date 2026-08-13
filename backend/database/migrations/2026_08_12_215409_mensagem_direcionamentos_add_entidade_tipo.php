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
        /**
         * Adiciona o suporte ao direcionamento por "Entidade" (ex: ADMIN,
         * PRIVATE), reaproveitando a tabela `entidade_tipos` já existente
         * no projeto (mesma usada em `grupos.entidade_tipo_id`), em vez de
         * duplicar esse conceito em um novo enum/tabela.
         *
         * Coluna nullable, seguindo o mesmo padrão de `grupo_empresa_id` e
         * `usuario_id`: cada linha de `mensagem_direcionamentos` só
         * preenche a coluna relativa ao seu `tipo`.
         */
        Schema::table('mensagem_direcionamentos', function (Blueprint $table) {
            $table->uuid('entidade_tipo_id')->nullable()->after('tipo');

            $table->foreign('entidade_tipo_id')
                ->references('id')
                ->on('entidade_tipos')
                ->nullOnDelete();

            $table->index('entidade_tipo_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('mensagem_direcionamentos', function (Blueprint $table) {
            $table->dropForeign(['entidade_tipo_id']);
            $table->dropIndex(['entidade_tipo_id']);
            $table->dropColumn('entidade_tipo_id');
        });
    }
};
