<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * As listagens paginadas de AcessoSuporteService (listarConcedidos /
     * listarRecebidos) filtram por usuario_concedente_id ou
     * usuario_admin_id e ordenam por created_at DESC. Os índices já
     * existentes na criação da tabela (ex: usuario_admin_id + status) não
     * cobrem created_at, então o Postgres precisava ordenar em memória
     * antes de aplicar o LIMIT/OFFSET da paginação. Estes índices cobrem
     * exatamente o predicado + ordenação dessas duas queries.
     */
    public function up(): void
    {
        Schema::table('acessos_suporte', function (Blueprint $table) {
            $table->index(['usuario_concedente_id', 'created_at']);
            $table->index(['usuario_admin_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('acessos_suporte', function (Blueprint $table) {
            $table->dropIndex(['usuario_concedente_id', 'created_at']);
            $table->dropIndex(['usuario_admin_id', 'created_at']);
        });
    }
};
