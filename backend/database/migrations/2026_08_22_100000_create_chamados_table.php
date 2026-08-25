<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        /**
         * Sequence dedicada para o número do ticket — atômica no Postgres
         * (nextval nunca repete/colide mesmo com requisições concorrentes),
         * sem precisar de lock manual ou de contar linhas existentes.
         * O ticket final é montado em ChamadoService como
         * "SUP-{ano}-{sequencial com 6 dígitos}".
         */
        DB::statement('CREATE SEQUENCE IF NOT EXISTS chamados_ticket_seq');

        Schema::create('chamados', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Ex: SUP-2026-000123 — único, não depende do id interno.
            $table->string('ticket')->unique();

            $table->uuid('usuario_id');
            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->restrictOnDelete();

            // Admin atualmente responsável pelo atendimento (opcional).
            $table->uuid('responsavel_id')->nullable();
            $table->foreign('responsavel_id')
                ->references('id')
                ->on('usuarios')
                ->nullOnDelete();

            // financeiro | plataforma | acesso | duvida | documentacao | operacional | outros
            $table->string('tipo');

            $table->string('assunto');

            // aberto | em_atendimento | aguardando_cliente | aguardando_suporte | resolvido | fechado | cancelado
            $table->string('status')->default('aberto');

            // baixa | normal | alta | urgente
            $table->string('prioridade')->default('normal');

            $table->timestamp('aberto_em');
            $table->timestamp('fechado_em')->nullable();

            // Preenchidos conforme o fluxo avança — pensados para permitir
            // métricas futuras (tempo até 1ª resposta, tempo de
            // atendimento) sem precisar remodelar a tabela depois.
            $table->timestamp('primeira_resposta_em')->nullable();
            $table->timestamp('ultima_interacao_em');

            $table->timestamps();

            $table->index('usuario_id');
            $table->index('responsavel_id');
            $table->index('status');
            $table->index('aberto_em');
            $table->index('fechado_em');
            $table->index('ultima_interacao_em');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chamados');
        DB::statement('DROP SEQUENCE IF EXISTS chamados_ticket_seq');
    }
};
