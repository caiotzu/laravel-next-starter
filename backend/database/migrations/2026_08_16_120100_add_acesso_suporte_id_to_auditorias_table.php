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
        Schema::table('auditorias', function (Blueprint $table) {
            // Preenchido quando a ação auditada ocorreu durante um Acesso de
            // Suporte. IMPORTANTE: `usuario_id` continua sendo sempre o Admin
            // real (Auth::id() nunca é trocado) — esta coluna apenas marca
            // que a ação foi feita usando um acesso de suporte específico,
            // permitindo isolar/filtrar essas ações depois.
            $table->uuid('acesso_suporte_id')->nullable()->after('usuario_id');

            $table->foreign('acesso_suporte_id')
                ->references('id')
                ->on('acessos_suporte')
                ->nullOnDelete();

            $table->index(['acesso_suporte_id', 'criado_em']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('auditorias', function (Blueprint $table) {
            $table->dropForeign(['acesso_suporte_id']);
            $table->dropIndex(['acesso_suporte_id', 'criado_em']);
            $table->dropColumn('acesso_suporte_id');
        });
    }
};
