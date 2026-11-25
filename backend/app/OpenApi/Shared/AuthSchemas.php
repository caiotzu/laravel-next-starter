<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Schemas de autenticação compartilhados entre as áreas Admin e Private,
 * que reutilizam exatamente os mesmos Form Requests (App\Http\Requests\Auth\*)
 * e o mesmo formato de resposta (apenas o namespace do Resource muda).
 */
#[OA\Schema(
    schema: 'LoginRequestBody',
    required: ['email', 'senha'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'usuario@empresa.com'),
        new OA\Property(property: 'senha', type: 'string', format: 'password', example: 'SenhaForte@123'),
    ],
    type: 'object'
)]
class LoginRequestBodySchema
{
}

#[OA\Schema(
    schema: 'LoginResponse',
    description: 'Retornado quando o 2FA não está habilitado: já contém o token de acesso.',
    properties: [
        new OA\Property(property: '2fa_enable', type: 'boolean', example: false),
        new OA\Property(property: 'token', type: 'string', example: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'),
        new OA\Property(property: 'expires_in', type: 'integer', description: 'Tempo de expiração do token em segundos.', example: 3600),
    ],
    type: 'object'
)]
class LoginResponseSchema
{
}

#[OA\Schema(
    schema: 'Login2faRequiredResponse',
    description: 'Retornado quando o usuário tem 2FA habilitado: é necessário confirmar o código no endpoint de verificação de 2FA usando o temp_token retornado aqui.',
    properties: [
        new OA\Property(property: '2fa_enable', type: 'boolean', example: true),
        new OA\Property(property: 'temp_token', type: 'string', format: 'uuid', description: 'Token temporário (válido por 5 minutos), usado para concluir o login via /2fa/verificar.'),
    ],
    type: 'object'
)]
class Login2faRequiredResponseSchema
{
}

#[OA\Schema(
    schema: 'Verificar2faRequestBody',
    required: ['temp_token', 'codigo'],
    properties: [
        new OA\Property(property: 'temp_token', type: 'string', format: 'uuid', description: 'Token temporário retornado pelo login quando o 2FA está habilitado.'),
        new OA\Property(property: 'codigo', type: 'string', pattern: '^[0-9]{6}$', description: 'Código de 6 dígitos do Google Authenticator.', example: '123456'),
    ],
    type: 'object'
)]
class Verificar2faRequestBodySchema
{
}

#[OA\Schema(
    schema: 'LogoutResponse',
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Desconectado com sucesso'),
    ],
    type: 'object'
)]
class LogoutResponseSchema
{
}

#[OA\Schema(
    schema: 'RefreshResponse',
    properties: [
        new OA\Property(property: 'token', type: 'string'),
        new OA\Property(property: 'expires_in', type: 'integer', example: 3600),
    ],
    type: 'object'
)]
class RefreshResponseSchema
{
}

#[OA\Schema(
    schema: 'MeResponse',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'nome', type: 'string'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
        new OA\Property(property: 'avatar', type: 'string', nullable: true),
        new OA\Property(property: 'grupo', type: 'string', description: 'Descrição do grupo do usuário.'),
        new OA\Property(property: 'status', type: 'string', enum: ['convidado', 'ativo', 'expirado', 'inativo', 'bloqueado']),
        new OA\Property(property: 'google2fa_enable', type: 'boolean'),
        new OA\Property(property: 'google2fa_confirmado_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'ultimo_login_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'ultimo_ip', type: 'string', nullable: true),
        new OA\Property(property: 'permissoes', type: 'array', items: new OA\Items(type: 'string'), example: ['admin.empresa.listar', 'admin.empresa.cadastrar']),
    ],
    type: 'object'
)]
class MeResponseSchema
{
}

#[OA\Schema(
    schema: 'PrimeiroAcessoValidarResponse',
    properties: [
        new OA\Property(property: 'nome', type: 'string'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
    ],
    type: 'object'
)]
class PrimeiroAcessoValidarResponseSchema
{
}

#[OA\Schema(
    schema: 'PrimeiroAcessoRequestBody',
    required: ['token', 'senha', 'senha_confirma'],
    properties: [
        new OA\Property(property: 'token', type: 'string', description: 'Token de primeiro acesso recebido por e-mail.'),
        new OA\Property(property: 'senha', type: 'string', format: 'password', description: 'Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.', example: 'SenhaForte@123'),
        new OA\Property(property: 'senha_confirma', type: 'string', format: 'password', example: 'SenhaForte@123'),
    ],
    type: 'object'
)]
class PrimeiroAcessoRequestBodySchema
{
}

#[OA\Schema(
    schema: 'EsqueceuSenhaRequestBody',
    required: ['email'],
    properties: [
        new OA\Property(property: 'email', type: 'string', format: 'email'),
    ],
    type: 'object'
)]
class EsqueceuSenhaRequestBodySchema
{
}

#[OA\Schema(
    schema: 'EsqueceuSenhaResponse',
    properties: [
        new OA\Property(property: 'mensagem', type: 'string', example: 'Se o e-mail estiver cadastrado, as instruções de redefinição serão enviadas.'),
    ],
    type: 'object'
)]
class EsqueceuSenhaResponseSchema
{
}

#[OA\Schema(
    schema: 'RedefinirSenhaValidarResponse',
    properties: [
        new OA\Property(property: 'nome', type: 'string'),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
    ],
    type: 'object'
)]
class RedefinirSenhaValidarResponseSchema
{
}

#[OA\Schema(
    schema: 'RedefinirSenhaRequestBody',
    required: ['token', 'senha', 'senha_confirma'],
    properties: [
        new OA\Property(property: 'token', type: 'string', description: 'Token de redefinição de senha recebido por e-mail.'),
        new OA\Property(property: 'senha', type: 'string', format: 'password', description: 'Mínimo 8 caracteres, com maiúscula, minúscula, número e símbolo.', example: 'SenhaForte@123'),
        new OA\Property(property: 'senha_confirma', type: 'string', format: 'password', example: 'SenhaForte@123'),
    ],
    type: 'object'
)]
class RedefinirSenhaRequestBodySchema
{
}

#[OA\Schema(
    schema: 'ProvedoresSociaisResponse',
    properties: [
        new OA\Property(
            property: 'provedores',
            type: 'array',
            items: new OA\Items(
                properties: [
                    new OA\Property(property: 'chave', type: 'string', example: 'google'),
                    new OA\Property(property: 'nome', type: 'string', example: 'Google'),
                ],
                type: 'object'
            )
        ),
    ],
    type: 'object'
)]
class ProvedoresSociaisResponseSchema
{
}

#[OA\Schema(
    schema: 'LoginSocialIniciarRequestBody',
    required: ['binding'],
    properties: [
        new OA\Property(property: 'binding', type: 'string', minLength: 32, maxLength: 128, description: 'Valor aleatório gerado pelo BFF (também guardado em cookie httpOnly) que amarra o fluxo ao navegador.'),
    ],
    type: 'object'
)]
class LoginSocialIniciarRequestBodySchema
{
}

#[OA\Schema(
    schema: 'LoginSocialIniciarResponse',
    properties: [
        new OA\Property(property: 'url', type: 'string', format: 'uri', description: 'URL de autorização do provedor, para redirecionar o navegador.'),
    ],
    type: 'object'
)]
class LoginSocialIniciarResponseSchema
{
}

#[OA\Schema(
    schema: 'LoginSocialCallbackRequestBody',
    required: ['codigo', 'state', 'binding'],
    properties: [
        new OA\Property(property: 'codigo', type: 'string', description: 'Código de autorização devolvido pelo provedor.'),
        new OA\Property(property: 'state', type: 'string', description: 'State devolvido pelo provedor.'),
        new OA\Property(property: 'binding', type: 'string', minLength: 32, maxLength: 128, description: 'Mesmo valor enviado em /iniciar.'),
    ],
    type: 'object'
)]
class LoginSocialCallbackRequestBodySchema
{
}

#[OA\Schema(
    schema: 'VinculoSocial',
    properties: [
        new OA\Property(property: 'chave', type: 'string', example: 'google'),
        new OA\Property(property: 'nome', type: 'string', example: 'Google'),
        new OA\Property(property: 'disponivel', type: 'boolean', description: 'Provedor ativo e configurado. Se false, o vínculo só pode ser removido.'),
        new OA\Property(property: 'vinculado', type: 'boolean'),
        new OA\Property(property: 'email', type: 'string', nullable: true, description: 'E-mail da conta no provedor (informativo).'),
        new OA\Property(property: 'vinculado_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'ultimo_login_em', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class VinculoSocialSchema
{
}

#[OA\Schema(
    schema: 'LoginSocialVincularIniciarRequestBody',
    required: ['senha', 'binding'],
    properties: [
        new OA\Property(property: 'senha', type: 'string', format: 'password', description: 'Senha atual do usuário (confirmação).'),
        new OA\Property(property: 'binding', type: 'string', minLength: 32, maxLength: 128, description: 'Valor aleatório gerado pelo BFF (também guardado em cookie httpOnly).'),
    ],
    type: 'object'
)]
class LoginSocialVincularIniciarRequestBodySchema
{
}
