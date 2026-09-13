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
         * Imagens de um banner. Estrutura relacional desde o início — nunca
         * uma única coluna `imagem` em `banners` — porque um banner exige
         * no mínimo 1 imagem e suporta múltiplas (ver item 4 do pedido).
         *
         * Mesmo disco/convenção de caminho já usado para anexos de chamado
         * (ver `chamado_anexos.caminho` / ChamadoService::criarMensagem):
         * caminho relativo no disco 'public', resolvido para URL absoluta
         * via accessor no Model, nunca uma tabela paralela de storage.
         */
        Schema::create('banner_imagens', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('banner_id');
            $table->foreign('banner_id')
                ->references('id')
                ->on('banners')
                ->cascadeOnDelete();

            $table->string('caminho');
            $table->string('mime_type');
            $table->unsignedBigInteger('tamanho'); // bytes

            // Posição de exibição dentro do banner (0 = primeira).
            $table->unsignedSmallInteger('ordem')->default(0);

            $table->timestamps($precision = 0);

            // Consulta mais comum: imagens de um banner, na ordem correta.
            $table->index(['banner_id', 'ordem']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banner_imagens');
    }
};
