<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chamado_anexos', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->uuid('chamado_mensagem_id');
            $table->foreign('chamado_mensagem_id')
                ->references('id')
                ->on('chamado_mensagens')
                ->cascadeOnDelete();

            $table->string('nome_original');

            // Caminho no disco 'public' (Storage::disk('public')), mesmo
            // disco já usado para avatares (ver PerfilService).
            $table->string('caminho');

            $table->string('mime_type');
            $table->unsignedBigInteger('tamanho'); // bytes

            $table->timestamps();

            $table->index('chamado_mensagem_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chamado_anexos');
    }
};
