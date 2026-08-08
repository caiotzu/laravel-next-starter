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
        Schema::create('auditorias', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // Referência genérica ao registro auditado (mesmo padrão de
            // entidade_tipo/entidade_id já usado na tabela `grupos`)
            $table->string('entidade_tabela');
            $table->uuid('entidade_id');

            // Agrupador opcional: permite consultar o histórico de uma Empresa
            // já incluindo alterações em EmpresaContato/EmpresaEndereco.
            $table->string('agrupador_tabela')->nullable();
            $table->uuid('agrupador_id')->nullable();

            $table->string('acao'); // cadastro | atualizacao | exclusao | restauracao

            $table->uuid('usuario_id')->nullable();
            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->nullOnDelete();

            $table->string('origem')->default('api'); // api | console | job | sistema

            $table->jsonb('dados_antes')->nullable();
            $table->jsonb('dados_depois')->nullable();
            $table->jsonb('campos_alterados')->nullable();

            $table->string('ip', 45)->nullable();
            $table->text('user_agent')->nullable();

            $table->timestamp('criado_em', 0)->useCurrent();

            // Registro imutável: sem updated_at e sem soft delete proposital.

            $table->index(['entidade_tabela', 'entidade_id', 'criado_em']);
            $table->index(['agrupador_tabela', 'agrupador_id', 'criado_em']);
            $table->index(['usuario_id', 'criado_em']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('auditorias');
    }
};
