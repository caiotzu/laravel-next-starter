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
         * Guarda a REGRA de envio utilizada no cadastro da mensagem
         * (para onde ela foi direcionada), independente dos destinatários
         * já resolvidos em `mensagem_destinatarios`.
         *
         * Estrutura pensada para permitir novos tipos de direcionamento no
         * futuro (ex: empresa, perfil, todos os usuários) apenas adicionando
         * um novo valor em `tipo` e, se necessário, uma nova coluna de
         * referência nullable — sem quebrar o que já existe.
         */
        Schema::create('mensagem_direcionamentos', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('mensagem_id');
            $table->foreign('mensagem_id')
                ->references('id')
                ->on('mensagens')
                ->cascadeOnDelete();

            $table->string('tipo');

            $table->uuid('grupo_empresa_id')->nullable();
            $table->foreign('grupo_empresa_id')
                ->references('id')
                ->on('grupo_empresas')
                ->nullOnDelete();

            $table->uuid('usuario_id')->nullable();
            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->nullOnDelete();

            $table->timestamps($precision = 0);

            $table->index('mensagem_id');
            $table->index('tipo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensagem_direcionamentos');
    }
};
