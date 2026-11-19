<?php

namespace App\Contracts\AutenticacaoSocial;

use App\DTO\AutenticacaoSocial\IdentidadeSocialDTO;

/**
 * Contrato de um provedor de login social (Google, Microsoft, GitHub...).
 *
 * O fluxo (state, PKCE, vínculo com o usuário, sessão/JWT, 2FA) é SEMPRE o mesmo e vive em
 * AutenticacaoSocialService. Um provedor só sabe duas coisas: montar a URL de autorização e
 * trocar o `code` por uma identidade já normalizada (IdentidadeSocialDTO).
 *
 * Para criar um novo provedor: docs/login-social.md.
 */
interface ProvedorSocialInterface
{
    /** Credenciais presentes? Provedor sem credencial nunca é oferecido nem aceito. */
    public function configurado(): bool;

    /** Envia/valida PKCE (S256)? Desligue só para provedores que rejeitam o parâmetro. */
    public function usaPkce(): bool;

    public function urlAutorizacao(string $redirectUri, string $state, ?string $codeChallenge): string;

    /**
     * Troca o `code` pela identidade do usuário no provedor.
     *
     * @throws \App\Exceptions\BusinessException se o provedor recusar o código ou estiver indisponível.
     */
    public function obterIdentidade(string $codigo, string $redirectUri, ?string $codeVerifier): IdentidadeSocialDTO;
}
