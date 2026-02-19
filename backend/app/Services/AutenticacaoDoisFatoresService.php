<?php

namespace App\Services;

use Illuminate\Support\Facades\Hash;

use PragmaRX\Google2FA\Google2FA;

use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresHabilitacaoDTO;
use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresConfirmacaoDTO;
use App\DTO\AutenticacaoDoisFatores\AutenticacaoDoisFatoresDesabilitacaoDTO;

use App\Exceptions\BusinessException;


class AutenticacaoDoisFatoresService
{
    public function __construct(
        protected Google2FA $google2fa,
    ) {}

    public function habilitar(AutenticacaoDoisFatoresHabilitacaoDTO $dto): array
    {
        $usuario = $dto->usuario;

        if (!Hash::check($dto->senha, $usuario->senha)) {
            throw new BusinessException('Senha incorreta.');
        }

        if ($usuario->google2fa_secret && $usuario->google2fa_enable) {
            throw new BusinessException('2FA já está habilitado.');
        }

        $secret = $this->gerarSegredo();

        $usuario->google2fa_secret = $secret;
        $usuario->save();

        $otpauthUrl = $this->obterQRCodeUrl($usuario->email, $secret);

        return [
            'secret' => $secret,
            'otpauth_url' => $otpauthUrl
        ];
    }

    public function confirmar(AutenticacaoDoisFatoresConfirmacaoDTO $dto): void
    {
        $usuario = $dto->usuario;

        if (!$usuario->google2fa_secret) {
            throw new BusinessException('2FA não foi iniciado.');
        }

        if ($usuario->google2fa_enable) {
            throw new BusinessException('2FA já está ativado.');
        }

        $secret = $usuario->google2fa_secret;

        $valido = $this->verificar($secret, $dto->codigo);

        if (!$valido) {
            throw new BusinessException('Código inválido.');
        }

        $usuario->google2fa_enable = true;
        $usuario->google2fa_confirmado_em = now();
        $usuario->save();
    }

    public function desabilitar(AutenticacaoDoisFatoresDesabilitacaoDTO $dto): void
    {
        $usuario = $dto->usuario;

        if (!$usuario->google2fa_enable)
            throw new BusinessException('2FA não está ativo.');

        if (!Hash::check($dto->senha, $usuario->senha))
            throw new BusinessException('Senha incorreta.');

        $valido = $this->verificar($usuario->google2fa_secret,$dto->codigo);
        if (!$valido)
            throw new BusinessException('Código inválido.');

        $usuario->google2fa_secret = null;
        $usuario->google2fa_enable = false;
        $usuario->google2fa_confirmado_em = null;

        $usuario->save();
    }

    public function gerarSegredo(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    public function obterQRCodeUrl(string $email, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            config('app.name'),
            $email,
            $secret
        );
    }

    public function verificar(string $secret, string $code): bool
    {
        return $this->google2fa->verifyKey(
            $secret,
            $code,
            1 // janela de tolerância (30s antes/depois)
        );
    }
}
