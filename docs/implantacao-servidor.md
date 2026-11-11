# Implantação em servidor

Passo a passo para publicar o projeto em um servidor. O repositório **não traz** Dockerfile, manifestos nem scripts de implantação para produção: o `backend/docker-compose.yml` (Sail) é **só para desenvolvimento local**. Este guia descreve o que o projeto exige e dá exemplos de como atender cada exigência; adapte à sua infraestrutura.

A conferência final (variáveis, Redis, proxies, limites) está no [`checklist-producao.md`](./checklist-producao.md); este documento não a repete.

## 1. O que o servidor precisa ter

**Exigido pelo projeto**

| Item | Versão / detalhe | Fonte |
|---|---|---|
| PHP | **8.5** (o `composer install` e a aplicação recusam versões menores), no PHP-FPM **e** no CLI (fila e agendador) | `composer.json` (`^8.5`) |
| Extensões PHP | `ctype`, `fileinfo`, `filter`, `gd`, `hash`, `iconv`, `json`, `libxml`, `mbstring`, `openssl`, `pcre`, `pdo_pgsql`, `session`, `sodium`, `tokenizer`, `xml`. Recomendadas (usadas no CI e no checklist): `bcmath`, `curl`, `intl`, `zip`, `opcache` | `composer.lock` e `ci.yml` |
| Composer | 2.x | `ci.yml` |
| Node.js e npm | Node **22.22.2 ou superior** | `frontend/package.json` (`engines`) |
| PostgreSQL | **17** | `docker-compose.yml` e `ci.yml` |
| Redis | **7**, exclusivo para as sessões do frontend, com rede privada, senha, TLS, `noeviction` e AOF | [`redis-producao.md`](./redis-producao.md) |
| HTTPS | certificado válido nos dois sites (frontend e API); HSTS | checklist |
| Servidor web com PHP-FPM | serve `backend/public`; `client_max_body_size` e `post_max_size`/`upload_max_filesize` em **16 MB** | checklist |
| Gerenciador de processos | mantém vivos: o Next.js, o *worker* de fila (`queue:work`) e o agendador (`schedule:run`/`schedule:work`) | `filas-e-eventos.md` |

**Não exigido pelo projeto (exemplos usados abaixo):** Nginx como servidor web e proxy reverso, `systemd` como gerenciador de processos. Qualquer equivalente (Apache, Caddy, Supervisor, PM2…) serve.

Topologia esperada: o navegador fala só com o **Next.js** (via proxy reverso, HTTPS). O Next.js chama o **Laravel** servidor-a-servidor (`BACKEND_URL`, de preferência por rede interna) e guarda as sessões no **Redis**. O Laravel usa o **PostgreSQL**; cache e fila ficam no banco.

## 2. Backend (Laravel)

Executar em `backend/`, com o usuário que roda o PHP-FPM (ou ajuste as permissões no passo 2.5).

**2.1. Colocar o código no servidor**

```bash
git clone https://github.com/caiotzu/laravel-next-starter.git /var/www/app
cd /var/www/app/backend
```

**2.2. Instalar as dependências (sem as de desenvolvimento)**

```bash
php -v     # tem que mostrar 8.5
composer install --no-dev --optimize-autoloader --no-interaction
```

**2.3. Criar o `.env` de produção**

O `.env.example` traz valores de **desenvolvimento**; nenhum serve em produção. Crie o `.env` (nunca o versione) ou injete as variáveis no ambiente. As principais:

| Variável | Valor em produção |
|---|---|
| `APP_ENV` / `APP_DEBUG` | `production` / `false` |
| `APP_URL` e `APP_URL_FRONTEND` | URLs públicas, **com `https://`** |
| `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | seu PostgreSQL; senha longa e aleatória |
| `CACHE_STORE` / `QUEUE_CONNECTION` | `database` / `database` |
| `LOG_LEVEL` | `warning` ou `error` |
| `TRUSTED_PROXIES` | IPs/CIDRs dos proxies reais (**crítico**: sem isso todos dividem a mesma cota de rate limit) |
| `CORS_ALLOWED_ORIGINS` | só a origem pública do frontend |
| `L5_SWAGGER_GENERATE_ALWAYS` | `false` |
| `SWAGGER_ADMIN_USERNAME` / `SWAGGER_ADMIN_PASSWORD_HASH` | definidos (gere com `php artisan swagger:admin-hash`) ou deixe vazios para manter o Swagger Admin fechado |
| `EMAIL_PROVIDER` e `MAIL_*` | seu provedor de e-mail (primeiro acesso e "esqueci minha senha") |

`TRUSTED_PROXIES`, `FILE_STORAGE_DRIVER` e `CHAMADO_*` são lidas pelo código mas não constam no `.env.example`; acrescente-as quando precisar.

**2.4. Gerar as chaves**

```bash
php artisan key:generate --force
php artisan jwt:secret --force
```

Guarde `APP_KEY` e `JWT_SECRET` em um *secret manager*.

**2.5. Permissões de escrita**

O usuário do PHP-FPM precisa escrever em `storage/` e `bootstrap/cache/`:

```bash
chown -R www-data:www-data storage bootstrap/cache   # ajuste o usuário ao do seu PHP-FPM
chmod -R ug+rwX storage bootstrap/cache
```

**2.6. Banco, dados iniciais e caches** (banco **recém-criado**)

```bash
php artisan migrate --force
php artisan db:seed --class=ProducaoSeeder --force   # só catálogos e permissões, SEM usuários
php artisan admin:criar-inicial seu@email.com.br     # primeiro admin; a senha é pedida de forma oculta
php artisan storage:link
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan producao:verificar                       # tem que terminar sem ERRO
```

> **Nunca rode `php artisan db:seed` nem `migrate --seed` em produção.** O `DatabaseSeeder` cria contas de desenvolvimento com senhas públicas. O `ProducaoSeeder` roda uma única vez e não cria usuários.

**2.7. Fila e agendador**

A auditoria e os e-mails usam jobs; os comandos agendados encerram sessões inativas e expiram Acessos de Suporte (ver [`filas-e-eventos.md`](./filas-e-eventos.md)). Exemplo com `systemd` (`/etc/systemd/system/app-queue.service`):

```ini
[Unit]
Description=Laravel queue worker
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/app/backend
ExecStart=/usr/bin/php artisan queue:work --tries=3 --max-time=3600
Restart=always

[Install]
WantedBy=multi-user.target
```

Para o agendador, use o cron do usuário do PHP (`crontab -e`):

```cron
* * * * * cd /var/www/app/backend && php artisan schedule:run >> /dev/null 2>&1
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now app-queue
```

Depois de cada publicação, reinicie o worker (`sudo systemctl restart app-queue`) para ele carregar o código novo.

**2.8. Servidor web**

Exemplo de `server` do Nginx para a API (`/etc/nginx/sites-available/api`), com o certificado já emitido:

```nginx
server {
    listen 443 ssl;
    server_name api.exemplo.com.br;
    root /var/www/app/backend/public;
    index index.php;

    client_max_body_size 16M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;   # ajuste ao seu PHP-FPM
    }

    location ~ /\.(?!well-known).* { deny all; }
}
```

Ajuste também `post_max_size` e `upload_max_filesize` do PHP para `16M`.

## 3. Frontend (Next.js)

Executar em `frontend/`.

**3.1. Instalar as dependências**

```bash
cd /var/www/app/frontend
node -v     # 22.22.2 ou superior
npm ci
```

**3.2. Variáveis de ambiente de produção**

| Variável | Valor em produção |
|---|---|
| `NODE_ENV` | `production` (ativa cookie `__Host-` + `Secure` e HSTS) |
| `BACKEND_URL` | URL da API terminando em `/api`, de preferência por rede interna (ex.: `https://api.exemplo.com.br/api`) |
| `FRONTEND_URL` | **exatamente** a origem pública do site (ex.: `https://app.exemplo.com.br`) |
| `REDIS_URL` | `rediss://:SENHA@host:6380` (senha + TLS; ver [`redis-producao.md`](./redis-producao.md)) |
| `TRUSTED_PROXY_HOPS` | **exatamente** o número de proxies reversos entre a internet e o Next (ex.: `1`) |
| `CSP_MODO` | **não definir** (o padrão bloqueia) |

Defina as mesmas variáveis no momento do build **e** na execução (por exemplo, em um arquivo lido pelo `systemd` com `EnvironmentFile`). Nunca versione o arquivo preenchido.

**3.3. Conferir e gerar o build**

```bash
npm run verificar:producao    # confere variáveis, Redis (senha, TLS, noeviction, AOF) e a API; sem ERRO
npm run build
```

**3.4. Iniciar o Next.js**

O comando é `npm run start` (`next start`, porta 3000). Exemplo com `systemd` (`/etc/systemd/system/app-next.service`):

```ini
[Unit]
Description=Next.js (BFF)
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/app/frontend
EnvironmentFile=/etc/app/frontend.env
ExecStart=/usr/bin/npm run start
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now app-next
curl http://127.0.0.1:3000/api/health     # {"status":"ok","redis":"ok"}
```

**3.5. Proxy reverso**

Exemplo de `server` do Nginx na frente do Next (HTTPS, repassando o IP do cliente):

```nginx
server {
    listen 443 ssl;
    server_name app.exemplo.com.br;

    client_max_body_size 16M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Com um único Nginx na frente do Next, `TRUSTED_PROXY_HOPS=1`. Se houver balanceador ou CDN antes dele, some-os.

## 4. Depois de subir

1. Conferência final: [`checklist-producao.md`](./checklist-producao.md).
2. Validação manual com a configuração real: [`roteiro-de-validacao.md`](./roteiro-de-validacao.md) (parte de produção).
3. Monitoramento: `GET /api/health` do frontend (200 = Redis de pé; 503 = tirar a instância do balanceador) e `GET /up` da API.

## Atualizar uma versão já publicada

Backend (`backend/`): `git pull`, `composer install --no-dev --optimize-autoloader`, `php artisan migrate --force`, refazer `config:cache`, `route:cache` e `view:cache`, `php artisan producao:verificar` e reiniciar o worker. Frontend (`frontend/`): `git pull`, `npm ci`, `npm run verificar:producao`, `npm run build` e reiniciar o serviço do Next.

## Problemas comuns

**`composer install` recusa por causa da versão do PHP.** O projeto exige PHP 8.5. Confira `php -v` no **CLI** e no **PHP-FPM**: podem ser versões diferentes.

**500 ou tela em branco na API.** Veja `storage/logs/laravel.log`; confira as permissões do passo 2.5 e rode `php artisan config:clear` se alterou o `.env` depois de gerar o cache.

**O login responde 503.** O Redis não está acessível ou o `REDIS_URL` está errado/ausente; veja `/api/health` e a linha `[sessao] …` no log do Next.

**Todos os usuários caem no limite de requisições (429).** `TRUSTED_PROXIES` (backend) ou `TRUSTED_PROXY_HOPS` (frontend) estão errados: a API enxerga o IP do servidor Next em vez do IP do usuário.

**Mudei as variáveis do Next e nada mudou.** Reinicie o serviço (ele só lê o ambiente ao iniciar) e, se a variável é usada no build, rode `npm run build` de novo.

**E-mails não saem e a auditoria não grava.** O *worker* de fila não está rodando: `systemctl status app-queue`.
