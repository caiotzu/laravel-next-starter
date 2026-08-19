<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

use App\Enums\AcessoSuporteStatus;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('acessos_suporte', function (Blueprint $table) {
            $table->uuid('id')->primary();

            /**
             * Entidade concedente, representada com o MESMO mecanismo já
             * usado em `grupos.entidade_tipo_id`/`entidade_id`
             * (ver Grupo::entidade()): `entidade_tipo_id` aponta para
             * `entidade_tipos`, e `entidade_tabela` naquela linha diz qual
             * tabela concreta `entidade_id` referencia (ex: grupo_empresas
             * para Private). Isso é o que torna o recurso genérico entre
             * Private, Despachante, Revenda, Montadora etc. sem precisar de
             * uma coluna por tipo de entidade nem de tabelas paralelas.
             */
            $table->uuid('entidade_tipo_id');
            $table->foreign('entidade_tipo_id')
                ->references('id')
                ->on('entidade_tipos')
                ->restrictOnDelete();

            // Sem FK: o mesmo padrão de grupos.entidade_id — a tabela de
            // destino varia conforme entidade_tipo_id.entidade_tabela.
            $table->uuid('entidade_id')
                ->comment('Identificador na tabela referenciada por entidade_tipos.entidade_tabela — é o escopo real e efetivo do acesso.');

            // Usuário, dentro da entidade concedente, que concedeu o acesso.
            $table->uuid('usuario_concedente_id');
            $table->foreign('usuario_concedente_id')
                ->references('id')
                ->on('usuarios')
                ->restrictOnDelete();

            // Admin autorizado a acessar temporariamente os dados da entidade.
            $table->uuid('usuario_admin_id');
            $table->foreign('usuario_admin_id')
                ->references('id')
                ->on('usuarios')
                ->restrictOnDelete();

            $table->text('motivo')->nullable();

            $table->string('status')->default(AcessoSuporteStatus::ATIVO->value);

            // Momento do primeiro uso efetivo pelo Admin (primeira requisição
            // validada com este acesso). Null enquanto não utilizado.
            $table->timestamp('iniciado_em', 0)->nullable();

            // Obrigatório: nunca é possível conceder um acesso sem expiração.
            $table->timestamp('expira_em', 0);

            $table->timestamp('encerrado_em', 0)->nullable();
            $table->string('encerrado_por')->nullable();
            $table->text('encerrado_motivo')->nullable();

            /**
             * Contexto adicional, específico da entidade concedente, sem
             * significado para o escopo/autorização (ex: {"empresa_id":
             * "..."} para indicar qual empresa motivou o chamado quando a
             * entidade concedente é Private). Mantém o schema genérico sem
             * precisar de uma coluna nova a cada entidade nova.
             */
            $table->json('metadados')->nullable();

            $table->timestamps($precision = 0);

            $table->index(['usuario_admin_id', 'status']);
            $table->index(['usuario_concedente_id', 'status']);
            $table->index(['entidade_tipo_id', 'entidade_id', 'status']);
        });

        /**
         * Garante, no próprio banco (Postgres suporta índice único parcial),
         * que nunca existam dois acessos ATIVO simultâneos para o mesmo par
         * Admin + entidade concedente — reforça a proteção contra "Admin
         * tenta criar um segundo acesso" além da checagem em
         * AcessoSuporteService::conceder().
         */
        DB::statement(
            'CREATE UNIQUE INDEX acessos_suporte_admin_entidade_ativo_unique
             ON acessos_suporte (usuario_admin_id, entidade_tipo_id, entidade_id)
             WHERE status = \'' . AcessoSuporteStatus::ATIVO->value . '\''
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('acessos_suporte');
    }
};
