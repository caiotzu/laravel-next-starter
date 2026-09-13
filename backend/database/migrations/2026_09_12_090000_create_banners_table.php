<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use App\Enums\BannerStatus;
use App\Enums\BannerDirecionamentoTipo;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('banners', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('titulo', 120);
            $table->text('conteudo')->nullable();

            /**
             * ATIVO | INATIVO — mesmo padrão de status simples já usado em
             * outras entidades administrativas (ver EmpresaStatus). Não
             * confundir com exclusão (soft delete, abaixo): status
             * controla a disponibilidade editorial do banner, exclusão
             * controla a remoção administrativa do registro.
             */
            $table->string('status')->default(BannerStatus::ATIVO->value);

            /**
             * Direcionamento, reaproveitando o MESMO conceito já usado em
             * `mensagem_direcionamentos` (ver
             * 2026_08_12_215409_mensagem_direcionamentos_add_entidade_tipo):
             * "entidade" aponta para a tabela `entidade_tipos`, já usada em
             * grupos.entidade_tipo_id e releases.entidade_tipo_id. Banner
             * só suporta os tipos GERAL (todos) e ENTIDADE — os demais
             * tipos existentes em Mensagem (usuário, grupo_empresa) não se
             * aplicam aqui, então não há necessidade de reaproveitar a
             * tabela `mensagem_direcionamentos` inteira, apenas o mesmo
             * conceito de "entidade_tipo_id" nullable.
             */
            $table->string('direcionamento_tipo')->default(BannerDirecionamentoTipo::GERAL->value);

            $table->uuid('entidade_tipo_id')->nullable();
            $table->foreign('entidade_tipo_id')
                ->references('id')
                ->on('entidade_tipos')
                ->nullOnDelete();

            /**
             * Período da campanha. Um banner só é elegível para exibição
             * quando `now()` estiver entre `inicio_em` e `fim_em` (ver
             * BannerService::disponiveisPara). `fim_em` nullable representa
             * uma campanha sem data de término definida.
             */
            $table->timestamp('inicio_em');
            $table->timestamp('fim_em')->nullable();

            $table->timestamps($precision = 0);
            $table->softDeletes();

            /**
             * Índice pensado exatamente para a consulta mais importante do
             * módulo — banners elegíveis "agora" (ver item 11/26 do
             * pedido): status + janela de período + direcionamento. Como a
             * consulta de disponibilidade sempre filtra por status/período
             * primeiro, esses campos vêm primeiro no índice composto.
             */
            $table->index(['status', 'inicio_em', 'fim_em'], 'banners_disponibilidade_index');
            $table->index(['direcionamento_tipo', 'entidade_tipo_id'], 'banners_direcionamento_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
