# Backend — API Laravel

API REST com JWT, 2FA, permissões, multi-empresa e os módulos do starter.

**Stack:** PHP `^8.5` · Laravel 13 · PostgreSQL 17 · `tymon/jwt-auth` · `google2fa` · `l5-swagger` · Pest 4 · Laravel Sail.

📚 Arquitetura, autenticação, banco e filas: [`docs/backend.md`](../docs/backend.md)

---

## Instalação

Passo a passo completo (requisitos, portas, problemas): [`docs/instalacao-local.md`](../docs/instalacao-local.md).

```bash
cd backend
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan jwt:secret
./vendor/bin/sail artisan migrate --seed
```

- API em `http://localhost` (porta `APP_PORT`, padrão 80)
- Usuários de teste: `admin@admin.com.br` / `Admin123@` e `private@private.com.br` / `Private123@`

> ⚠️ Só para desenvolvimento. Em produção: [`docs/implantacao-servidor.md`](../docs/implantacao-servidor.md).

---

## Variáveis de ambiente

Modelo em `.env.example`.

| Variável | Descrição |
|---|---|
| `APP_URL` / `APP_URL_FRONTEND` | URLs da API e do frontend |
| `DB_*` | PostgreSQL (padrão do Sail) |
| `QUEUE_CONNECTION` | `database` (exige `queue:work`) ou `sync` (desenvolvimento) |
| `CACHE_STORE` | `database` |
| `JWT_SECRET` | gerado por `artisan jwt:secret` |
| `JWT_TTL` / `JWT_REFRESH_TTL` | validade do token (padrão 60 min) e janela de refresh |
| `EMAIL_PROVIDER` / `MAIL_*` | envio de e-mails |
| `CORS_ALLOWED_ORIGINS` | origens cross-site permitidas |
| `L5_SWAGGER_GENERATE_ALWAYS` | regera o Swagger a cada acesso (só em desenvolvimento) |
| `SWAGGER_ADMIN_USERNAME` / `_PASSWORD_HASH` | protegem o Swagger Admin |
| `APP_PORT` / `FORWARD_DB_PORT` / `FORWARD_REDIS_PORT` | portas publicadas pelo Sail |

**Lidas pelo código, mas ausentes do `.env.example`** (acrescente quando precisar):

| Variável | Descrição |
|---|---|
| `TRUSTED_PROXIES` | IPs dos proxies confiáveis. Necessária para os limites de requisição verem o IP real |
| `FILE_STORAGE_DRIVER` | `local` (padrão) ou `s3` |
| `CHAMADO_ANEXO_TAMANHO_MAXIMO_KB` · `CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM` · `CHAMADO_ANEXO_URL_EXPIRA_MINUTOS` | limites de anexos (padrão 10240 KB, 5 por mensagem, 30 min) |

---

## Comandos úteis

```bash
./vendor/bin/sail artisan test --compact              # testes
./vendor/bin/sail artisan queue:work                  # processa a fila
./vendor/bin/sail artisan schedule:work               # comandos agendados
./vendor/bin/sail artisan swagger:admin-hash "senha"  # credenciais do Swagger Admin
./vendor/bin/sail artisan migrate:fresh --seed        # recria o banco (apaga tudo)
./vendor/bin/sail shell                               # terminal no container
```

Swagger: <http://localhost/api/documentation> (Admin em `/api/documentation/admin`).

---

## Docker

O `docker-compose.yml` sobe `laravel.test` (PHP 8.5), `pgsql` (PostgreSQL 17) e `redis` (Redis 7, **sem gravar em disco**). O Redis guarda as sessões do **frontend**; o Laravel não o usa.

> ⚠️ **Só para desenvolvimento.** Não reutilize em staging ou produção.

---

## Saiba mais

[Backend](../docs/backend.md) · [Segurança](../docs/seguranca.md) · [Arquivos](../docs/armazenamento-de-arquivos.md) · [Testes](../docs/testes.md)
