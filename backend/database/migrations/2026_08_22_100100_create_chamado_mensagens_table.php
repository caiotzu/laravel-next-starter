<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /**
         * Cada linha é uma interação da conversa (mensagem do cliente ou
         * do suporte). Sem soft delete/edição — o histórico do chamado é
         * imutável por regra de negócio (ver ChamadoService), não apenas
         * por ausência de endpoint.
         */
        Schema::create('chamado_mensagens', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('chamado_id');
            $table->foreign('chamado_id')
                ->references('id')
                ->on('chamados')
                ->cascadeOnDelete();

            // Quem enviou (cliente que abriu ou um usuário do suporte).
            $table->uuid('usuario_id');
            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->restrictOnDelete();

            // HTML — mesmo editor rico usado em Releases/Novidades.
            $table->text('mensagem');

            $table->timestamps();

            $table->index('chamado_id');
            $table->index('usuario_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chamado_mensagens');
    }
};
