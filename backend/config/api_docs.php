<?php

/**
 * Interface usada para exibir a documentação OpenAPI da API.
 *
 * As duas interfaces leem o MESMO JSON, gerado pelo l5-swagger a partir dos
 * atributos OpenAPI dos controllers (`php artisan l5-swagger:generate --all`).
 * Trocar a interface não altera o contrato da API nem as URLs:
 *
 *   /api/documentation        (pública)
 *   /api/documentation/admin  (Admin, protegida por HTTP Basic)
 *
 * Para trocar, use o comando `php artisan api-docs:gerar scalar` (ou `swagger`),
 * ou defina API_DOCS_UI no .env (obrigatório em produção, onde o comando não
 * altera o .env).
 */
return [

    // 'swagger' = Swagger UI (padrão, como sempre foi) | 'scalar' = Scalar API Reference.
    'ui' => env('API_DOCS_UI', 'swagger'),

    'scalar' => [
        // Bundle servido localmente (public/vendor/scalar). Não usa CDN: a CSP da
        // documentação só aceita scripts da própria origem ou com nonce.
        'script' => 'vendor/scalar/standalone.js',

        // default | alternate | moon | purple | solarized | bluePlanet | deepSpace | saturn | kepler | mars | laserwave | none
        'theme' => env('API_DOCS_SCALAR_THEME', 'default'),

        // modern | classic
        'layout' => env('API_DOCS_SCALAR_LAYOUT', 'modern'),
    ],
];
