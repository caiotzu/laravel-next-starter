# Backend — API Laravel

API REST em Laravel 12: autenticação JWT, autorização por permissões, e os domínios de negócio do starter (empresas, usuários, grupos, mensagens, auditoria).

Para arquitetura, autenticação, rotas e demais detalhes, veja [`docs/`](../docs).

## Stack

PHP `^8.2` · Laravel `^12.0` · PostgreSQL 17 · `tymon/jwt-auth` · `pragmarx/google2fa` · `darkaonline/l5-swagger` · `laravel/sail` · Pest 4.

## Instalação

```bash
cd backend
composer install
cp .env.example .env

./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan jwt:secret
./vendor/bin/sail artisan migrate --seed
```

Acesso direto ao container:

```bash
docker exec -it backend-laravel.test-1 /bin/bash
```

> O seeder `AdminUsuarioSeeder` cria um usuário de desenvolvimento (`admin@admin.com.br`). Use apenas em ambiente local.

## Variáveis de ambiente

Principais chaves de `.env.example` — detalhes de cada uma em [`docs/banco-de-dados.md`](../docs/banco-de-dados.md) e [`docs/api.md`](../docs/api.md):

| Variável | Descrição |
|---|---|
| `APP_URL` / `APP_URL_FRONTEND` | URLs da API e do frontend |
| `DB_*` | Conexão com PostgreSQL (padrão do Sail) |
| `QUEUE_CONNECTION` | `database` (produção) ou `sync` (desenvolvimento) |
| `JWT_SECRET` | Gerado por `php artisan jwt:secret` |
| `EMAIL_PROVIDER` | `amazon_ses` (padrão) ou `mailtrap` |
| `L5_SWAGGER_GENERATE_ALWAYS` | Regera a spec do Swagger a cada request (dev) |
| `SWAGGER_ADMIN_USERNAME` / `SWAGGER_ADMIN_PASSWORD_HASH` | Protegem a doc Swagger Admin — gerados via `swagger:admin-hash` |

## Comandos úteis

```bash
./vendor/bin/sail artisan test              # roda a suíte de testes (Pest)
./vendor/bin/sail artisan queue:work        # processa a fila
./vendor/bin/sail artisan swagger:admin-hash "senha"   # credenciais do Swagger Admin
./vendor/bin/sail artisan l5-swagger:generate          # gera as specs OpenAPI
```

## Docker

Ambiente gerenciado via **Laravel Sail** (`docker-compose.yml`): serviço `laravel.test` (PHP 8.4) + `pgsql` (PostgreSQL 17).

```bash
./vendor/bin/sail up -d
./vendor/bin/sail down
```

## Saiba mais

- [Arquitetura em camadas](../docs/arquitetura.md#backend)
- [Autenticação, 2FA e permissões](../docs/autenticacao-e-autorizacao.md)
- [Rotas da API e Swagger](../docs/api.md)
- [Banco de dados: migrations e seeders](../docs/banco-de-dados.md)
- [Filas, jobs e eventos](../docs/filas-e-eventos.md)
- [Testes](../docs/testes.md)
