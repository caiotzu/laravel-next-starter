# Checklist de produção

Lista de conferência antes de publicar (F-11 e F-13 da avaliação de segurança). Os `.env.example` trazem valores de **desenvolvimento**; nenhum deles serve em produção.

## Passo a passo resumido (ordem recomendada)

1. Copie `backend/.env.production.example` e `frontend/.env.production.example`, preencha tudo que está como `<...>` e injete como variáveis de ambiente (nunca versione o arquivo preenchido).
2. Suba o Redis de produção seguindo [redis-producao.md](redis-producao.md) (senha + TLS + `noeviction` + AOF).
3. Backend (**PHP 8.5**: confira com `php -v`), banco **recém-criado**:
   ```
   php artisan migrate --force
   php artisan db:seed --class=ProducaoSeeder --force   # só catálogos e permissões, SEM usuários
   php artisan admin:criar-inicial seu@email.com.br     # primeiro admin, senha pedida de forma oculta
   php artisan config:cache && php artisan route:cache && php artisan storage:link
   php artisan producao:verificar                       # tem que terminar sem ERRO
   ```
4. Frontend: `npm run verificar:producao` (confere variáveis, TLS/senha do Redis, `noeviction`, AOF e o `/up` da API). Tem que terminar sem ERRO.
5. Rode o [roteiro de homologação](roteiro-homologacao.md) antes de abrir para os usuários.

> **Não rode `php artisan db:seed` (nem `migrate --seed`) em produção.** O `DatabaseSeeder` é de desenvolvimento: cria `admin@admin.com.br` / `Admin123@` e `private@private.com.br` / `Private123@`, senhas públicas no repositório. O `ProducaoSeeder` não cria nenhum usuário. Se essas contas já existirem em algum ambiente, o `producao:verificar` acusa (ERRO `CONTA_PADRAO`); apague-as ou troque a senha.
> O `ProducaoSeeder` roda **uma vez**, em banco recém-migrado (ele recusa rodar de novo).

## Backend (Laravel)

- [ ] **PHP 8.5 (obrigatório)** no servidor web/PHP-FPM, no CLI (worker de fila e agendador) e em todos os ambientes (`php -v`). O `composer.json` exige `^8.5`: com PHP mais antigo o `composer install` e a própria aplicação recusam subir. Extensões: `mbstring`, `pdo_pgsql`, `pgsql`, `bcmath`, `intl`, `gd`, `zip`, `xml`, `curl`, `opcache`.
- [ ] `APP_ENV=production` e `APP_DEBUG=false` (com `APP_DEBUG=true` o Laravel mostra pilhas e variáveis ao usuário).
- [ ] `APP_KEY` e `JWT_SECRET` próprios, gerados para este ambiente (`php artisan key:generate`, `php artisan jwt:secret`) e guardados em um *secret manager*, nunca no repositório.
- [ ] `DB_PASSWORD` forte (o `password` do exemplo é só do Sail); banco **sem** porta exposta à internet.
- [ ] `L5_SWAGGER_GENERATE_ALWAYS=false`; Swagger Admin com `SWAGGER_ADMIN_USERNAME` e `SWAGGER_ADMIN_PASSWORD_HASH` definidos (sem eles ele fica fechado) ou desativado.
- [ ] **`TRUSTED_PROXIES` com os proxies reais** (não `*` em produção sem necessidade). **Crítico:** sem isso o backend enxerga o IP do servidor Next.js e TODOS os usuários dividem a mesma cota de rate limit (login, 2FA e API).
- [ ] `CORS` restrito à origem do frontend.
- [ ] `php artisan config:cache route:cache` e `php artisan storage:link`; *worker* de fila ativo (auditoria e e-mails usam jobs).
- [ ] `post_max_size` e `upload_max_filesize` do PHP, e `client_max_body_size` do servidor web, em **16 MB** (o maior anexo, 10 MB, vira ~14 MB em base64). O limite do campo base64 já é conferido pela aplicação, mas o do servidor evita que corpos enormes cheguem ao PHP.
- [ ] HTTPS obrigatório, com HSTS.

## Frontend (Next.js)

- [ ] `NODE_ENV=production` (ativa cookie `__Host-`, `Secure` e HSTS).
- [ ] `BACKEND_URL` apontando para o backend por rede **interna**; `FRONTEND_URL` exatamente igual à origem pública do site (é com ela que a validação de origem recusa pedidos de outros sites).
- [ ] **`TRUSTED_PROXY_HOPS` = exatamente o número de proxies reversos entre a internet e o Next** (ex.: 1 para um balanceador). Maior que o real faz o BFF confiar em um IP escolhido pelo cliente e enfraquece o rate limit por IP.
- [ ] `REDIS_URL` com senha e TLS (`rediss://:SENHA@host:6380`).
- [ ] `CSP_MODO` **não** definido (o padrão bloqueia). Use `CSP_MODO=report-only` só para validar a política num ambiente novo e remova depois.
- [ ] Healthcheck do serviço em `GET /api/health` (200 = Redis de pé; 503 = tirar a instância do balanceador).

## Redis (sessões do frontend)

Configuração pronta (redis.conf, geração de certificado, docker compose): [redis-producao.md](redis-producao.md). O `npm run verificar:producao` testa senha, TLS, `noeviction` e AOF de verdade.

- [ ] Rede privada (nunca exposto à internet), senha/ACL e TLS.
- [ ] `maxmemory-policy noeviction`: com outra política o Redis pode descartar sessões em silêncio.
- [ ] Persistência (AOF) **se** reiniciar o Redis não puder deslogar todo mundo.
- [ ] Monitoramento e alerta de indisponibilidade (o frontend responde 503 no login e redireciona ao login enquanto ele estiver fora).

## Antes de cada publicação

- [ ] `php artisan producao:verificar` (backend) e `npm run verificar:producao` (frontend) sem ERRO.
- [ ] `composer lint` (padrão de código PHP) verde.

- [ ] CI verde: testes, `tsc`, lint, `npm audit --omit=dev --audit-level=high` e `composer audit`.
- [ ] `npm run build && npm run e2e` (e `composer test`) passando em um ambiente com Redis.
- [ ] Nenhum segredo no repositório ou nos logs.
