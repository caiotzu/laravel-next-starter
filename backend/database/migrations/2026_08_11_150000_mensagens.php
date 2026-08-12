<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

use App\Enums\MensagemOrigem;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('mensagens', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('titulo', 120);
            $table->text('conteudo');

            /**
             * Origem da mensagem: gerada pelo próprio sistema ou enviada
             * por um usuário administrativo.
             */
            $table->string('origem')->default(MensagemOrigem::SISTEMA->value);

            /**
             * Usuário administrativo que enviou a mensagem. Nulo quando a
             * origem é o próprio sistema.
             */
            $table->uuid('remetente_id')->nullable();
            $table->foreign('remetente_id')
                ->references('id')
                ->on('usuarios')
                ->nullOnDelete();

            $table->timestamps($precision = 0);
            $table->softDeletes();

            $table->index('origem');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mensagens');
    }
};
