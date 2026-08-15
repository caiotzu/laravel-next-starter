<?php

/**
 * Config do pacote darkaonline/l5-swagger (zircote/swagger-php por baixo).
 *
 * Duas documentações independentes, alinhadas com a estrutura de
 * Controllers do projeto:
 *
 *   - "default": tags Global, Private e Lookup. Pública, sem autenticação
 *     de acesso à própria documentação (os endpoints continuam exigindo
 *     Bearer JWT normalmente).
 *     UI: /api/documentation
 *
 *   - "admin": tag Admin. A documentação em si é protegida por HTTP Basic
 *     Auth (middleware swagger.admin.auth), configurável via .env.
 *     UI: /api/documentation/admin
 *
 * Este arquivo assume a estrutura de config publicada pelo l5-swagger
 * ^9.0 (compatível com Laravel 12 / swagger-php ^5). Após rodar
 * `composer require darkaonline/l5-swagger` e
 * `php artisan vendor:publish --provider "L5Swagger\L5SwaggerServiceProvider"`,
 * confira se as chaves abaixo batem com a versão publicada e ajuste caso
 * o pacote tenha mudado alguma opção entre versões.
 */

return [

    'default' => 'default',

    'documentations' => [

        'default' => [
            'api' => [
                'title' => 'Laravel Next Starter API — Global, Private & Lookup',
            ],

            'routes' => [
                'api' => 'api/documentation',
                'docs' => 'api/documentation/docs',
                'oauth2_callback' => 'api/documentation/oauth2-callback',
            ],

            'paths' => [
                'use_absolute_path' => env('L5_SWAGGER_USE_ABSOLUTE_PATH', true),
                'docs' => storage_path('api-docs'),
                'docs_json' => 'api-docs.json',
                'docs_yaml' => 'api-docs.yaml',
                'format_to_use_for_docs' => env('L5_FORMAT_TO_USE_FOR_DOCS', 'json'),
                'annotations' => [
                    base_path('app/Http/Controllers/Global'),
                    base_path('app/Http/Controllers/Private'),
                    base_path('app/Http/Controllers/Lookup'),
                    base_path('app/OpenApi/Public'),
                    base_path('app/OpenApi/Shared'),
                ],
                'excludes' => [],
            ],
        ],

        'admin' => [
            'api' => [
                'title' => 'Laravel Next Starter API — Admin',
            ],

            'routes' => [
                'api' => 'api/documentation/admin',
                'docs' => 'api/documentation/admin/docs',
                'oauth2_callback' => 'api/documentation/admin/oauth2-callback',
                // Restringe o acesso à UI e ao JSON desta documentação.
                'middleware' => [
                    'api' => ['swagger.admin.auth'],
                    'docs' => ['swagger.admin.auth'],
                ],
            ],

            'paths' => [
                'use_absolute_path' => env('L5_SWAGGER_USE_ABSOLUTE_PATH', true),
                'docs' => storage_path('api-docs-admin'),
                'docs_json' => 'api-docs-admin.json',
                'docs_yaml' => 'api-docs-admin.yaml',
                'format_to_use_for_docs' => env('L5_FORMAT_TO_USE_FOR_DOCS', 'json'),
                'annotations' => [
                    base_path('app/Http/Controllers/Admin'),
                    base_path('app/OpenApi/Admin'),
                    base_path('app/OpenApi/Shared'),
                ],
                'excludes' => [],
            ],
        ],

    ],

    'defaults' => [

        'routes' => [
            // Rota usada pelo botão "Authorize" / callback OAuth2 (não usado neste projeto, mantido por padrão do pacote).
            'oauth2_callback' => 'api/oauth2-callback',

            'middleware' => [
                'api' => [],
                'asset' => [],
                'docs' => [],
                'oauth2_callback' => [],
            ],

            'group_options' => [],
        ],

        'paths' => [
            'docs' => storage_path('api-docs'),
            'views' => base_path('resources/views/vendor/l5-swagger'),
            'base' => env('L5_SWAGGER_BASE_PATH', null),
            'swagger_ui_assets_path' => env('L5_SWAGGER_UI_ASSETS_PATH', 'vendor/swagger-api/swagger-ui/dist/'),
            'excludes' => [],
        ],

        'scanOptions' => [
            'analyser' => null,
            'analysis' => null,
            'processors' => [],
            'pattern' => null,
            'exclude' => [],
        ],

        'securityDefinitions' => [
            // As security schemes já são declaradas via atributos PHP
            // (App\OpenApi\Shared\SecuritySchemes). Nada a duplicar aqui.
            'securitySchemes' => [],
            'security' => [
                [
                    'bearerAuth' => [],
                ],
            ],
        ],

        'generate_always' => env('L5_SWAGGER_GENERATE_ALWAYS', false),
        'generate_yaml_copy' => env('L5_SWAGGER_GENERATE_YAML_COPY', false),
        'proxy' => false,
        'additional_config_url' => null,
        'operations_sort' => env('L5_SWAGGER_OPERATIONS_SORT', 'alpha'),
        'validator_url' => null,

        'ui' => [
            'display' => [
                'doc_expansion' => env('L5_SWAGGER_UI_DOC_EXPANSION', 'none'),
                'filter' => env('L5_SWAGGER_UI_FILTERS', true),
            ],
            'authorization' => [
                'persist_authorization' => env('L5_SWAGGER_UI_PERSIST_AUTHORIZATION', true),
                'oauth2' => [
                    'use_pkce_with_authorization_code_grant' => false,
                ],
            ],
        ],
    ],
];
