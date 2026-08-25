<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Mesmo padrão da migration que adicionou entidade_tipo_id (ver
     * 2026_08_12_215409_mensagem_direcionamentos_add_entidade_tipo): nova
     * coluna nullable, um novo valor em `tipo`. Usada pelo módulo de
     * Chamados para notificar automaticamente todo ADMIN que possua uma
     * permissão específica (ex: admin.chamado.atender), sem precisar
     * resolver a lista de destinatários fora do mecanismo de mensagens já
     * existente.
     */
    public function up(): void
    {
        Schema::table('mensagem_direcionamentos', function (Blueprint $table) {
            $table->uuid('permissao_id')->nullable()->after('entidade_tipo_id');

            $table->foreign('permissao_id')
                ->references('id')
                ->on('permissoes')
                ->nullOnDelete();

            $table->index('permissao_id');
        });
    }

    public function down(): void
    {
        Schema::table('mensagem_direcionamentos', function (Blueprint $table) {
            $table->dropForeign(['permissao_id']);
            $table->dropIndex(['permissao_id']);
            $table->dropColumn('permissao_id');
        });
    }
};
