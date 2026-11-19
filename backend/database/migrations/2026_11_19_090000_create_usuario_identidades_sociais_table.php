<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Vínculo entre um Usuario já cadastrado e a sua identidade em um provedor de login social.
     * Nunca cria usuário: só registra "esta conta Google é do usuário X".
     */
    public function up(): void
    {
        Schema::create('usuario_identidades_sociais', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('usuario_id');
            $table->foreign('usuario_id')
                ->references('id')
                ->on('usuarios')
                ->onDelete('cascade');
            $table->string('provedor', 30);
            $table->string('provedor_usuario_id'); // `sub` no Google: estável, ao contrário do e-mail
            $table->string('email');               // e-mail visto no último login (informativo)
            $table->timestamp('ultimo_login_em', 0)->nullable();
            $table->timestamps($precision = 0);

            // Uma conta do provedor pertence a UM usuário; um usuário tem UMA conta por provedor.
            $table->unique(['provedor', 'provedor_usuario_id']);
            $table->unique(['usuario_id', 'provedor']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario_identidades_sociais');
    }
};
