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
         * Links (0, 1 ou N) de um banner. Estrutura relacional desde o
         * início — nunca colunas `link_nome`/`link_url` soltas em
         * `banners` — porque o pedido exige suporte nativo a múltiplos
         * links (ver item 5 do pedido). `nome` é o texto exibido no botão
         * na exibição do banner.
         */
        Schema::create('banner_links', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('banner_id');
            $table->foreign('banner_id')
                ->references('id')
                ->on('banners')
                ->cascadeOnDelete();

            $table->string('nome', 60);
            $table->string('url', 2048);

            // Posição de exibição dos botões dentro do banner.
            $table->unsignedSmallInteger('ordem')->default(0);

            $table->timestamps($precision = 0);

            $table->index(['banner_id', 'ordem']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banner_links');
    }
};
