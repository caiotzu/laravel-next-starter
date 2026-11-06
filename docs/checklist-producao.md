# Checklist de produção

Lista de conferência antes de publicar (F-11 e F-13 da avaliação de segurança). Os `.env.example` trazem valores de **desenvolvimento**; nenhum deles serve em produção.

## Backend (Laravel)

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

- [ ] Rede privada (nunca exposto à internet), senha/ACL e TLS.
- [ ] `maxmemory-policy noeviction`: com outra política o Redis pode descartar sessões em silêncio.
- [ ] Persistência (AOF) **se** reiniciar o Redis não puder deslogar todo mundo.
- [ ] Monitoramento e alerta de indisponibilidade (o frontend responde 503 no login e redireciona ao login enquanto ele estiver fora).

## Antes de cada publicação

- [ ] CI verde: testes, `tsc`, lint, `npm audit --omit=dev --audit-level=high` e `composer audit`.
- [ ] `npm run build && npm run e2e` (e `composer test`) passando em um ambiente com Redis.
- [ ] Nenhum segredo no repositório ou nos logs.
