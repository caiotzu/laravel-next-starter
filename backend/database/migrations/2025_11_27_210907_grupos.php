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
        Schema::create('grupos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('descricao', 100);
            $table->unsignedInteger('versao')->default(1)->index()->comment('Sempre que atualizar os dados do grupo incrementar na versão. Será usado para controle de permissões no cache.');
            $table->foreignUuid('entidade_tipo_id')
                ->constrained('entidade_tipos')
                ->cascadeOnUpdate()
                ->restrictOnDelete();
            $table->uuid('entidade_id')->nullable(true)->index()->comment('Representa o identificador (id) da tabela que foi referenciada em entidade_tipo coluna (entidade_tabela)');
            $table->timestamps($precision = 0);
            $table->softDeletes();
            $table->unique([
                'descricao',
                'entidade_tipo_id',
                'entidade_id',
                'deleted_at'
            ])->comment('Evita de ser criado para a mesma entidade o grupo com mesmo nome, desde que não esteja deletado.');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grupos');
    }
};
