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
        Schema::create('releases', function (Blueprint $table) {
            $table->uuid('id')->primary();

            /**
             * Contexto da Release (ADMIN, PRIVATE, e futuramente outros),
             * usando o MESMO mecanismo já existente em
             * grupos.entidade_tipo_id / acessos_suporte.entidade_tipo_id:
             * aponta para entidade_tipos, então adicionar um novo contexto
             * no futuro não exige alterar esta tabela nem o código que a
             * consulta — apenas uma nova linha em entidade_tipos.
             */
            $table->uuid('entidade_tipo_id');
            $table->foreign('entidade_tipo_id')
                ->references('id')
                ->on('entidade_tipos')
                ->restrictOnDelete();

            $table->string('titulo');
            $table->text('conteudo');

            // FEATURE | IMPROVEMENT | FIX | CHANGE — ver App\Enums\ReleaseTipo
            $table->string('tipo');

            // Versão semântica exibida junto à Release (ex: "1.5.0").
            $table->string('versao');

            // DRAFT | PUBLISHED — ver App\Enums\ReleaseStatus. Somente
            // releases PUBLISHED são visíveis para os usuários finais.
            $table->string('status')->default('draft');

            $table->timestamp('publicado_em')->nullable();

            $table->timestamps();

            // Suporta a listagem pública: WHERE entidade_tipo_id = ? AND
            // status = ? ORDER BY publicado_em DESC.
            $table->index(['entidade_tipo_id', 'status', 'publicado_em']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('releases');
    }
};
