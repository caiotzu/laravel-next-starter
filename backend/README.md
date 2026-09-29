# Backend — API Laravel

API REST em Laravel 12: autenticação JWT com sessão revogável e 2FA, autorização por permissões, isolamento multi-tenant, e os domínios de negócio do starter (empresas, usuários, grupos, mensagens, banners, chamados de suporte, releases, Acesso de Suporte e auditoria).

Para arquitetura, autenticação, rotas e demais detalhes, veja [`docs/`](../docs).

## Stack

PHP `^8.2` (container Sail com PHP 8.4) · Laravel `^12.0` · PostgreSQL 17 · `tymon/jwt-auth` · `pragmarx/google2fa` · `darkaonline/l5-swagger` · `laravel/sail` · Pest 4.

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
| `EMAIL_PROVIDER` | `amazon_ses` (padrão do código, `config/api.php`) ou `mailtrap` (valor sugerido no `.env.example` para desenvolvimento) |
| `CACHE_STORE` | `database` no `.env.example` (permissões, `temp_token` do 2FA, rate limit) |
| `JWT_TTL` / `JWT_REFRESH_TTL` | Validade do token em minutos (padrão 60) e janela de refresh (padrão 20160) |
| `TRUSTED_PROXIES` | IPs/CIDRs dos proxies confiáveis (vazio = não confia em nenhum). **Necessário para que os rate limits por IP vejam o IP real do usuário**, já que quem chama a API é o BFF (`config/trustedproxy.php`) |
| `CORS_ALLOWED_ORIGINS` | Origens cross-site permitidas (vazio por padrão; a comunicação normal passa pelo BFF e não depende de CORS) |
| `CHAMADO_ANEXO_TAMANHO_MAXIMO_KB` / `CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM` / `CHAMADO_ANEXO_URL_EXPIRA_MINUTOS` | Limites de anexos de chamado (padrão 10240 KB, 5 por mensagem, links de 30 min) |

> `TRUSTED_PROXIES`, `CORS_ALLOWED_ORIGINS` e as variáveis `CHAMADO_*` são lidas pelo código, mas não constam no `.env.example`; adicione-as ao seu `.env` quando necessário.
| `L5_SWAGGER_GENERATE_ALWAYS` | Regera a spec do Swagger a cada request (dev) |
| `SWAGGER_ADMIN_USERNAME` / `SWAGGER_ADMIN_PASSWORD_HASH` | Protegem a doc Swagger Admin — gerados via `swagger:admin-hash` |

## Comandos úteis

```bash
./vendor/bin/sail artisan test              # roda a suíte de testes (Pest)
./vendor/bin/sail artisan queue:work        # processa a fila
./vendor/bin/sail artisan schedule:work     # executa os comandos agendados (sessões e acessos de suporte)
./vendor/bin/sail artisan swagger:admin-hash "senha"   # credenciais do Swagger Admin
./vendor/bin/sail artisan l5-swagger:generate          # gera as specs OpenAPI
./vendor/bin/sail artisan chamados:mover-anexos-privados --dry-run  # migração única de anexos legados para o disco privado
```

## Docker

Ambiente gerenciado via **Laravel Sail** (`docker-compose.yml`): serviço `laravel.test` (PHP 8.4) + `pgsql` (PostgreSQL 17).

```bash
./vendor/bin/sail up -d
./vendor/bin/sail down
```

> ⚠️ **Este `docker-compose.yml` é exclusivo para desenvolvimento local.** A porta do PostgreSQL é publicada apenas em `127.0.0.1` (`FORWARD_DB_PORT`, padrão 5432) e a senha vem de `DB_PASSWORD` do `.env` (o `.env.example` sugere `password` — troque-a fora do ambiente local; o compose não define senha de fallback). Mesmo assim, **não reutilize este arquivo como base de deploy em staging/produção**: use uma infraestrutura dedicada (ECS, Kubernetes, VM com orquestração própria, etc.), sem exposição de porta do banco e com segredos em um secret manager. Não foi identificado, no repositório, Dockerfile/manifesto de produção nem pipeline de CI/CD.

## Saiba mais

- [Arquitetura em camadas](../docs/arquitetura.md#backend)
- [Autenticação, 2FA e permissões](../docs/autenticacao-e-autorizacao.md)
- [Rotas da API e Swagger](../docs/api.md)
- [Banco de dados: migrations e seeders](../docs/banco-de-dados.md)
- [Filas, jobs e eventos](../docs/filas-e-eventos.md)
- [Testes](../docs/testes.md)
- [Segurança](../docs/seguranca.md)
