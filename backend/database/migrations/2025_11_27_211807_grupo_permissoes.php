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
        Schema::create('grupo_permissoes', function (Blueprint $table) {
            $table->foreignUuid('grupo_id')
                ->constrained('grupos')
                ->cascadeOnDelete()
                ->restrictOnDelete();
            $table->foreignUuid('permissao_id')
                ->constrained('permissoes')
                ->cascadeOnDelete()
                ->restrictOnDelete();
            $table->primary(['grupo_id', 'permissao_id']);
            $table->timestamps($precision = 0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grupo_permissoes');
    }
};
