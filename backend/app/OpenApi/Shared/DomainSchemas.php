<?php

namespace App\OpenApi\Shared;

use OpenApi\Attributes as OA;

/**
 * Schemas de domínio reutilizados pelas áreas Admin e Private, cujos
 * Resources têm exatamente os mesmos campos (apenas o namespace muda).
 * Mantidos em um único lugar para não duplicar a definição em cada área.
 */
#[OA\Schema(
    schema: 'Empresa',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'grupo_empresa_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'matriz_id', type: 'string', format: 'uuid', nullable: true),
        new OA\Property(property: 'cnpj', type: 'string', example: '12345678000190'),
        new OA\Property(property: 'nome_fantasia', type: 'string', maxLength: 60),
        new OA\Property(property: 'razao_social', type: 'string', maxLength: 60),
        new OA\Property(property: 'inscricao_estadual', type: 'string', nullable: true),
        new OA\Property(property: 'inscricao_municipal', type: 'string', nullable: true),
        new OA\Property(property: 'status', type: 'string', enum: ['pendente', 'ativo', 'inativo', 'bloqueado']),
        new OA\Property(property: 'status_descricao', type: 'string', example: 'Ativo'),
        new OA\Property(property: 'uf', type: 'string', example: 'SP'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class EmpresaSchema
{
}

#[OA\Schema(
    schema: 'EmpresaListarItem',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/Empresa'),
        new OA\Schema(properties: [
            new OA\Property(property: 'grupo_empresa', ref: '#/components/schemas/GrupoEmpresa', type: 'object'),
            new OA\Property(property: 'matriz', ref: '#/components/schemas/Empresa', type: 'object', nullable: true),
        ], type: 'object'),
    ]
)]
class EmpresaListarItemSchema
{
}

#[OA\Schema(
    schema: 'EmpresaVisualizar',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/Empresa'),
        new OA\Schema(properties: [
            new OA\Property(property: 'grupo_empresa', ref: '#/components/schemas/GrupoEmpresa', type: 'object'),
            new OA\Property(property: 'contatos', type: 'array', items: new OA\Items(ref: '#/components/schemas/EmpresaContato')),
            new OA\Property(property: 'enderecos', type: 'array', items: new OA\Items(ref: '#/components/schemas/EmpresaEndereco')),
        ], type: 'object'),
    ]
)]
class EmpresaVisualizarSchema
{
}

#[OA\Schema(
    schema: 'EmpresaContato',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'empresa_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'tipo', type: 'string', enum: ['T', 'E']),
        new OA\Property(property: 'tipo_descricao', type: 'string', example: 'Telefone'),
        new OA\Property(property: 'valor', type: 'string', maxLength: 100),
        new OA\Property(property: 'ativo', type: 'boolean'),
        new OA\Property(property: 'principal', type: 'boolean'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
    ],
    type: 'object'
)]
class EmpresaContatoSchema
{
}

#[OA\Schema(
    schema: 'EmpresaEndereco',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'empresa_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'tipo', type: 'string', enum: ['COMERCIAL', 'FISCAL', 'CORRESPONDENCIA', 'COBRANCA', 'ENTREGA']),
        new OA\Property(property: 'tipo_descricao', type: 'string', example: 'Comercial'),
        new OA\Property(property: 'municipio_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'ativo', type: 'boolean'),
        new OA\Property(property: 'principal', type: 'boolean'),
        new OA\Property(property: 'cep', type: 'string', example: '01310100'),
        new OA\Property(property: 'logradouro', type: 'string', maxLength: 100),
        new OA\Property(property: 'numero', type: 'string', maxLength: 5),
        new OA\Property(property: 'bairro', type: 'string', maxLength: 100),
        new OA\Property(property: 'complemento', type: 'string', nullable: true, maxLength: 50),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'municipio', ref: '#/components/schemas/Municipio', type: 'object'),
    ],
    type: 'object'
)]
class EmpresaEnderecoSchema
{
}

#[OA\Schema(
    schema: 'Municipio',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'nome', type: 'string', example: 'São Paulo'),
        new OA\Property(property: 'uf', type: 'string', example: 'SP'),
        new OA\Property(property: 'codigo_ibge', type: 'string', example: '3550308'),
        new OA\Property(property: 'codigo_siafi', type: 'string', example: '7107'),
    ],
    type: 'object'
)]
class MunicipioAdminSchema
{
}

#[OA\Schema(
    schema: 'GrupoEmpresa',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'nome', type: 'string', maxLength: 255),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class GrupoEmpresaSchema
{
}

#[OA\Schema(
    schema: 'GrupoEmpresaVisualizar',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/GrupoEmpresa'),
        new OA\Schema(properties: [
            new OA\Property(
                property: 'grupos',
                type: 'array',
                items: new OA\Items(properties: [
                    new OA\Property(property: 'id', type: 'string', format: 'uuid'),
                    new OA\Property(property: 'descricao', type: 'string'),
                    new OA\Property(property: 'versao', type: 'integer'),
                    new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
                    new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
                    new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
                    new OA\Property(
                        property: 'usuarios',
                        type: 'array',
                        items: new OA\Items(ref: '#/components/schemas/Usuario')
                    ),
                ], type: 'object')
            ),
        ], type: 'object'),
    ]
)]
class GrupoEmpresaVisualizarSchema
{
}

#[OA\Schema(
    schema: 'Grupo',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'descricao', type: 'string', maxLength: 255),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class GrupoSchema
{
}

#[OA\Schema(
    schema: 'GrupoVisualizar',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/Grupo'),
        new OA\Schema(properties: [
            new OA\Property(property: 'permissoes', type: 'array', items: new OA\Items(ref: '#/components/schemas/Permissao')),
        ], type: 'object'),
    ]
)]
class GrupoVisualizarSchema
{
}

#[OA\Schema(
    schema: 'Permissao',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'chave', type: 'string', example: 'admin.empresa.cadastrar'),
        new OA\Property(property: 'descricao', type: 'string', example: 'Cadastrar empresa'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class PermissaoSchema
{
}

#[OA\Schema(
    schema: 'Usuario',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'grupo_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'nome', type: 'string', maxLength: 255),
        new OA\Property(property: 'email', type: 'string', format: 'email'),
        new OA\Property(property: 'status', type: 'string', enum: ['convidado', 'ativo', 'expirado', 'inativo', 'bloqueado']),
        new OA\Property(property: 'avatar', type: 'string', nullable: true),
        new OA\Property(property: 'google2fa_enable', type: 'boolean'),
        new OA\Property(property: 'google2fa_confirmado_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'ultimo_login_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'ultimo_ip', type: 'string', nullable: true),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class UsuarioSchema
{
}

#[OA\Schema(
    schema: 'UsuarioListarItem',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/Usuario'),
        new OA\Schema(properties: [
            new OA\Property(property: 'grupo', ref: '#/components/schemas/Grupo', type: 'object'),
        ], type: 'object'),
    ]
)]
class UsuarioListarItemSchema
{
}

#[OA\Schema(
    schema: 'UsuarioVisualizar',
    allOf: [
        new OA\Schema(ref: '#/components/schemas/Usuario'),
        new OA\Schema(properties: [
            new OA\Property(property: 'grupo', ref: '#/components/schemas/Grupo', type: 'object'),
        ], type: 'object'),
    ]
)]
class UsuarioVisualizarSchema
{
}

#[OA\Schema(
    schema: 'UsuarioSessao',
    properties: [
        new OA\Property(property: 'id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'usuario_id', type: 'string', format: 'uuid'),
        new OA\Property(property: 'ip', type: 'string', nullable: true),
        new OA\Property(property: 'user_agent', type: 'string', nullable: true),
        new OA\Property(property: 'browser', type: 'string', nullable: true),
        new OA\Property(property: 'plataforma', type: 'string', nullable: true),
        new OA\Property(property: 'dispositivo', type: 'string', nullable: true),
        new OA\Property(property: 'ativo', type: 'boolean'),
        new OA\Property(property: 'ultimo_acesso_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'logout_em', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'atual', type: 'boolean', description: 'Indica se é a sessão da requisição atual.'),
        new OA\Property(property: 'updated_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'created_at', type: 'string', format: 'date-time'),
        new OA\Property(property: 'deleted_at', type: 'string', format: 'date-time', nullable: true),
    ],
    type: 'object'
)]
class UsuarioSessaoSchema
{
}

#[OA\Schema(
    schema: 'AcaoMensagemResponse',
    description: 'Resposta simples de confirmação para ações pontuais (ex.: habilitar/confirmar/desabilitar 2FA).',
    properties: [
        new OA\Property(property: 'message', type: 'string', example: 'Ação realizada com sucesso.'),
    ],
    type: 'object'
)]
class AcaoMensagemResponseSchema
{
}

#[OA\Schema(
    schema: 'AutenticacaoDoisFatoresHabilitarResponse',
    description: 'Dados para configurar o app autenticador (ex.: Google Authenticator): o secret pode ser digitado manualmente e o otpauth_url pode ser transformado em QR Code no front-end.',
    properties: [
        new OA\Property(property: 'secret', type: 'string', example: 'JBSWY3DPEHPK3PXP'),
        new OA\Property(property: 'otpauth_url', type: 'string', example: 'otpauth://totp/LaravelNextStarter:usuario@empresa.com?secret=JBSWY3DPEHPK3PXP&issuer=LaravelNextStarter'),
    ],
    type: 'object'
)]
class AutenticacaoDoisFatoresHabilitarResponseSchema
{
}
