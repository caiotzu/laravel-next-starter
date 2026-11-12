# Checklist de produção

Conferência final antes de abrir para os usuários. Como instalar: [`implantacao-servidor.md`](./implantacao-servidor.md).

> Os `.env.example` são de **desenvolvimento**. Nenhum valor deles serve em produção.

Dois comandos fazem boa parte desta conferência por você. Ambos têm que terminar **sem ERRO**:

```bash
php artisan producao:verificar     # backend
npm run verificar:producao         # frontend (inclui Redis e a API)
```

---

## Backend

- [ ] **PHP 8.5** no PHP-FPM e no CLI (`php -v`)
- [ ] `APP_ENV=production` e `APP_DEBUG=false`
- [ ] `APP_KEY` e `JWT_SECRET` próprios, guardados em *secret manager*
- [ ] `DB_PASSWORD` forte; banco **sem** porta exposta à internet
- [ ] **`TRUSTED_PROXIES` com os proxies reais** (crítico: sem isso todos dividem o mesmo limite de requisições)
- [ ] `CORS_ALLOWED_ORIGINS` só com a origem do frontend
- [ ] `L5_SWAGGER_GENERATE_ALWAYS=false`; Swagger Admin com senha definida (ou fechado)
- [ ] `config:cache`, `route:cache` e `storage:link` executados
- [ ] **Worker de fila ativo** (auditoria e e-mails) e **agendador** no cron
- [ ] `post_max_size`, `upload_max_filesize` e `client_max_body_size` em **16 MB**
- [ ] HTTPS com HSTS
- [ ] Nenhuma conta de desenvolvimento no banco (o `producao:verificar` acusa `CONTA_PADRAO`)

> ⚠️ **Nunca** rode `db:seed` nem `migrate --seed` em produção. Use só `ProducaoSeeder` (uma vez, em banco novo) e `admin:criar-inicial`.

## Frontend

- [ ] `NODE_ENV=production`
- [ ] `BACKEND_URL` por rede **interna**; `FRONTEND_URL` **igual** à origem pública
- [ ] **`TRUSTED_PROXY_HOPS` = exatamente o número de proxies** entre a internet e o Next
- [ ] `REDIS_URL` com senha e TLS (`rediss://`)
- [ ] `CSP_MODO` **não definido** (o padrão bloqueia)
- [ ] Healthcheck em `GET /api/health` (200 = ok; 503 = tirar do balanceador)

## Redis

- [ ] Rede privada, senha e TLS
- [ ] `maxmemory-policy noeviction`
- [ ] AOF ligado (se reiniciar não puder deslogar todo mundo)
- [ ] Alerta de indisponibilidade e de uso de memória

Configuração completa: [`implantacao-servidor.md`](./implantacao-servidor.md#4-redis-das-sessões).

## Antes de cada publicação

- [ ] CI verde (testes, `tsc`, lint, `composer audit`, `npm audit`)
- [ ] `composer lint` verde
- [ ] `npm run build && npm run e2e` passando (precisa de Redis)
- [ ] Nenhum segredo no repositório ou nos logs
- [ ] [Roteiro de validação](./roteiro-de-validacao.md) (Parte B) feito no ambiente real
