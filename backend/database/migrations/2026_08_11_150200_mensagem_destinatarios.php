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
         * Linha materializada por usuário destinatário da mensagem.
         *
         * O status de leitura é individual (coluna `lida_em`), nunca um
         * campo global na mensagem: se a mesma mensagem for enviada para
         * 100 usuários, cada um tem sua própria linha e seu próprio
         * `lida_em`, sem afetar os demais.
         *
         * `mensagem_id` + `usuario_id` é único para não haver duplicidade
         * de destinatário para a mesma mensagem.
         */
        Schema::create('mensagem_destinatarios', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('mensagem_id');
            $table->foreign('mensagem_id')
                ->references('id')
                ->on('mensagens')
                ->cascadeOnDelete();

            $table->uuid('usuario_id');
            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->cascadeOnDelete();

            $table->timestamp('lida_em')->nullable();

            $table->timestamps($precision = 0);

            $table->unique(['mensagem_id', 'usuario_id']);

            /**
             * Consulta mais frequente do sistema: contador/listagem de não
             * lidas de um usuário (`usuario_id` + `lida_em is null`).
             */
            $table->index(['usuario_id', 'lida_em']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensagem_destinatarios');
    }
};
