# Backend: API Laravel

API REST em Laravel 13: JWT com sessão revogável e 2FA, autorização por permissões, isolamento multi-tenant e os domínios do starter. Arquitetura, rotas e demais detalhes em [`docs/`](../docs).

**Stack:** PHP `^8.5` (obrigatório) · Laravel `^13.0` · PostgreSQL 17 · `tymon/jwt-auth` · `pragmarx/google2fa` · `darkaonline/l5-swagger` · Pest 4 · Laravel Sail.

## Instalação

Passo a passo completo (requisitos, portas, problemas comuns): [`docs/instalacao-local.md`](../docs/instalacao-local.md). Resumo:

```bash
cd backend
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan jwt:secret
./vendor/bin/sail artisan migrate --seed
```

A API responde em `http://localhost` (porta `APP_PORT`, padrão 80). O seeder cria `admin@admin.com.br` / `Admin123@` e `private@private.com.br` / `Private123@`, só para desenvolvimento.

## Variáveis de ambiente

Principais chaves (modelo em `.env.example`). Produção: [`docs/implantacao-servidor.md`](../docs/implantacao-servidor.md).

| Variável | Descrição |
|---|---|
| `APP_URL` / `APP_URL_FRONTEND` | URLs da API e do frontend |
| `DB_*` | Conexão com o PostgreSQL (padrão do Sail) |
| `QUEUE_CONNECTION` | `database` (precisa de `queue:work`) ou `sync` (desenvolvimento) |
| `CACHE_STORE` | `database` (permissões, `temp_token` do 2FA, rate limit) |
| `JWT_SECRET` | Gerado por `artisan jwt:secret` |
| `JWT_TTL` / `JWT_REFRESH_TTL` | Validade do token em minutos (padrão 60) e janela de refresh (padrão 20160) |
| `EMAIL_PROVIDER` / `MAIL_*` | Envio de e-mails (primeiro acesso, redefinição de senha) |
| `CORS_ALLOWED_ORIGINS` | Origens cross-site permitidas (a comunicação normal passa pelo BFF) |
| `L5_SWAGGER_GENERATE_ALWAYS` | Regera a spec a cada request (só em desenvolvimento) |
| `SWAGGER_ADMIN_USERNAME` / `SWAGGER_ADMIN_PASSWORD_HASH` | Protegem o Swagger Admin (gere com `swagger:admin-hash`) |
| `FORWARD_DB_PORT` / `FORWARD_REDIS_PORT` / `APP_PORT` | Portas publicadas pelo Sail |

Lidas pelo código, mas **ausentes do `.env.example`** (acrescente ao seu `.env` quando precisar):

| Variável | Descrição |
|---|---|
| `TRUSTED_PROXIES` | IPs/CIDRs dos proxies confiáveis (vazio = nenhum). Necessária para os rate limits verem o IP real, já que quem chama a API é o BFF |
| `FILE_STORAGE_DRIVER` | Driver de armazenamento (`local` por padrão) |
| `CHAMADO_ANEXO_TAMANHO_MAXIMO_KB` / `CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM` / `CHAMADO_ANEXO_URL_EXPIRA_MINUTOS` | Limites de anexos de chamado (padrão 10240 KB, 5 por mensagem, links de 30 min) |

## Comandos úteis

```bash
./vendor/bin/sail artisan test --compact                 # testes (Pest)
./vendor/bin/sail artisan queue:work                     # processa a fila
./vendor/bin/sail artisan schedule:work                  # comandos agendados
./vendor/bin/sail artisan swagger:admin-hash "senha"     # credenciais do Swagger Admin
./vendor/bin/sail artisan l5-swagger:generate            # gera as specs OpenAPI
./vendor/bin/sail artisan migrate:fresh --seed           # recria o banco (apaga tudo)
./vendor/bin/sail shell                                  # terminal no container
```

Swagger: <http://localhost/api/documentation> (Admin em `/api/documentation/admin`).

## Docker

O `docker-compose.yml` (Sail) sobe `laravel.test` (PHP 8.5), `pgsql` (PostgreSQL 17) e `redis` (Redis 7, **sem gravar em disco**: reiniciá-lo só desloga os usuários de teste). O Redis guarda as sessões do **frontend**; o Laravel não o usa.

> **Uso exclusivo em desenvolvimento local.** As portas do PostgreSQL e do Redis ficam só em `127.0.0.1`. Não reutilize este arquivo em staging ou produção: veja [`docs/implantacao-servidor.md`](../docs/implantacao-servidor.md).

## Saiba mais

[Arquitetura](../docs/arquitetura.md) · [Autenticação e permissões](../docs/autenticacao-e-autorizacao.md) · [API e Swagger](../docs/api.md) · [Banco de dados](../docs/banco-de-dados.md) · [Filas e eventos](../docs/filas-e-eventos.md) · [Testes](../docs/testes.md) · [Segurança](../docs/seguranca.md)
