<?php

namespace App\Services;

use Illuminate\Support\Str;

use App\Models\TokenResetSenha;
use App\Models\Usuario;

use App\Exceptions\BusinessException;

class TokenResetSenhaService
{
    public function gerarToken(Usuario $usuario): string
    {
        TokenResetSenha::where('usuario_id', $usuario->id)
            ->whereNull('usado_em')
            ->update([
                'usado_em' => now(),
            ]);

        $token = Str::random(64);

        TokenResetSenha::create([
            'usuario_id' => $usuario->id,
            'token' => hash('sha256', $token),
            'expira_em' => now()->addMinutes(30),
        ]);

        return $token;
    }

    public function validarToken(string $token): TokenResetSenha
    {
        $hash = hash('sha256', $token);

        $tokenResetSenha = TokenResetSenha::with('usuario')
            ->where('token', $hash)
            ->first();

        if (! $tokenResetSenha) {
            throw new BusinessException('Token inválido ou expirado.');
        }

        if ($tokenResetSenha->usado_em !== null) {
            throw new BusinessException('Este link já foi utilizado.');
        }

        if ($tokenResetSenha->expira_em->isPast()) {
            throw new BusinessException('Token inválido ou expirado.');
        }

        return $tokenResetSenha;
    }


    public function consumirToken(string $token): TokenResetSenha
    {
        $hash = hash('sha256', $token);

        $tokenResetSenha = TokenResetSenha::with('usuario')
            ->where('token', $hash)
            ->lockForUpdate() // Evita concorrencia
            ->first();

        if (! $tokenResetSenha) {
            throw new BusinessException('Token inválido ou expirado.');
        }

        if ($tokenResetSenha->usado_em !== null) {
            throw new BusinessException('Este link já foi utilizado.');
        }

        if ($tokenResetSenha->expira_em?->isPast()) {
            throw new BusinessException('Token inválido ou expirado.');
        }

        return $tokenResetSenha;
    }

    public function marcarComoUtilizado(string $token): void
    {
        $hash = hash('sha256', $token);

        TokenResetSenha::where('token', $hash)
            ->whereNull('usado_em')
            ->update([
                'usado_em' => now(),
            ]);
    }
}
