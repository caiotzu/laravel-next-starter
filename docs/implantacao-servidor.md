# Implantação em servidor

Passo a passo para publicar o projeto em produção.

> O repositório **não traz** Dockerfile nem scripts de deploy: o `docker-compose.yml` (Sail) é **só para desenvolvimento**. Abaixo estão as exigências do projeto e exemplos (Nginx, systemd) que você pode trocar por equivalentes.

Depois de publicar, passe pelo [`checklist-producao.md`](./checklist-producao.md).

---

## 1. O que o servidor precisa ter

| Item | Detalhe |
|---|---|
| **PHP 8.5** | no PHP-FPM **e** no CLI (fila e agendador) |
| **Extensões PHP** | `ctype`, `fileinfo`, `filter`, `gd`, `hash`, `iconv`, `json`, `libxml`, `mbstring`, `openssl`, `pcre`, `pdo_pgsql`, `session`, `sodium`, `tokenizer`, `xml` · recomendadas: `bcmath`, `curl`, `intl`, `zip`, `opcache` |
| **Composer 2** | instala as dependências do backend |
| **Node.js 22.22.2+** e npm | build e execução do frontend |
| **PostgreSQL 17** | banco da API, **sem** porta exposta à internet |
| **Redis 7** | sessões do frontend (veja a [seção 4](#4-redis-das-sessões)) |
| **HTTPS** | certificado válido nos dois sites, com HSTS |
| **Servidor web + PHP-FPM** | serve `backend/public`; corpo de requisição de **16 MB** |
| **Gerenciador de processos** | mantém vivos o Next.js, o worker de fila e o agendador |

```text
Internet → Nginx (HTTPS) → Next.js :3000 → Laravel (rede interna) → PostgreSQL
                                  └──────→ Redis (rede privada)
```

---

## 2. Backend (Laravel)

Dentro de `backend/`, com o usuário do PHP-FPM.

### 2.1 Código e dependências

```bash
git clone https://github.com/caiotzu/laravel-next-starter.git /var/www/app
cd /var/www/app/backend
php -v    # tem que mostrar 8.5
composer install --no-dev --optimize-autoloader --no-interaction
```

### 2.2 Arquivo `.env` de produção

O `.env.example` é de **desenvolvimento**; não serve aqui. Principais variáveis:

| Variável | Valor |
|---|---|
| `APP_ENV` / `APP_DEBUG` | `production` / `false` |
| `APP_URL` / `APP_URL_FRONTEND` | URLs públicas com `https://` |
| `DB_*` | seu PostgreSQL, com senha forte |
| `CACHE_STORE` / `QUEUE_CONNECTION` | `database` / `database` |
| `LOG_LEVEL` | `warning` ou `error` |
| `TRUSTED_PROXIES` | IPs dos proxies reais ⚠️ **crítico**: sem isso todos os usuários dividem o mesmo limite de requisições |
| `CORS_ALLOWED_ORIGINS` | só a origem pública do frontend |
| `L5_SWAGGER_GENERATE_ALWAYS` | `false` |
| `SWAGGER_ADMIN_USERNAME` / `_PASSWORD_HASH` | gere com `php artisan swagger:admin-hash`, ou deixe vazio (Swagger Admin fechado) |
| `EMAIL_PROVIDER` / `MAIL_*` | provedor de e-mail (primeiro acesso, recuperação de senha) |

💡 `TRUSTED_PROXIES`, `FILE_STORAGE_DRIVER` e `CHAMADO_*` são lidas pelo código mas não estão no `.env.example`; acrescente quando precisar.

### 2.3 Chaves e permissões

```bash
php artisan key:generate --force
php artisan jwt:secret --force
chown -R www-data:www-data storage bootstrap/cache   # use o usuário do seu PHP-FPM
chmod -R ug+rwX storage bootstrap/cache
```

Guarde `APP_KEY` e `JWT_SECRET` em um *secret manager*.

### 2.4 Banco, dados iniciais e caches

Em um banco **recém-criado**:

```bash
php artisan migrate --force
php artisan db:seed --class=ProducaoSeeder --force   # só catálogos e permissões, sem usuários
php artisan admin:criar-inicial seu@email.com.br     # primeiro admin (senha pedida de forma oculta)
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan producao:verificar                       # tem que terminar sem ERRO
```

> ⚠️ **Nunca** rode `db:seed` nem `migrate --seed` em produção: o `DatabaseSeeder` cria contas de desenvolvimento com senhas públicas.

### 2.5 Fila e agendador

Auditoria e e-mails usam fila; sessões inativas e Acessos de Suporte vencidos dependem do agendador.

`/etc/systemd/system/app-queue.service`:

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

Agendador, no cron do usuário do PHP:

```cron
* * * * * cd /var/www/app/backend && php artisan schedule:run >> /dev/null 2>&1
```

```bash
sudo systemctl daemon-reload && sudo systemctl enable --now app-queue
```

### 2.6 Servidor web (exemplo Nginx)

```nginx
server {
    listen 443 ssl;
    server_name api.exemplo.com.br;
    root /var/www/app/backend/public;
    index index.php;
    client_max_body_size 16M;

    location / { try_files $uri $uri/ /index.php?$query_string; }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.5-fpm.sock;   # ajuste ao seu PHP-FPM
    }

    location ~ /\.(?!well-known).* { deny all; }
}
```

No `php.ini`, `post_max_size` e `upload_max_filesize` em `16M`.

---

## 3. Frontend (Next.js)

Dentro de `frontend/`.

### 3.1 Dependências

```bash
cd /var/www/app/frontend
node -v    # 22.22.2 ou superior
npm ci
```

### 3.2 Variáveis de ambiente

| Variável | Valor |
|---|---|
| `NODE_ENV` | `production` (ativa cookie `__Host-`, `Secure` e HSTS) |
| `BACKEND_URL` | API terminando em `/api`, de preferência por rede interna |
| `FRONTEND_URL` | **exatamente** a origem pública do site |
| `REDIS_URL` | `rediss://:SENHA@host:6380` (senha + TLS) |
| `TRUSTED_PROXY_HOPS` | **exatamente** quantos proxies reversos há entre a internet e o Next (ex.: `1`) |
| `CSP_MODO` | **não definir** |

Use as mesmas variáveis no **build** e na **execução** (ex.: `EnvironmentFile` do systemd). Nunca versione o arquivo preenchido.

### 3.3 Conferir, compilar e iniciar

```bash
npm run verificar:producao    # variáveis, Redis e API; sem ERRO
npm run build
npm run start                 # porta 3000
```

`/etc/systemd/system/app-next.service`:

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
curl http://127.0.0.1:3000/api/health    # {"status":"ok","redis":"ok"}
```

### 3.4 Proxy reverso (exemplo Nginx)

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

Com um único Nginx na frente, `TRUSTED_PROXY_HOPS=1`. Se houver balanceador ou CDN antes, some-os.

---

## 4. Redis das sessões

O Redis guarda as **sessões** do frontend. Sem ele ninguém entra (login responde 503); se perder os dados, todos são deslogados. O Laravel **não** usa este Redis; não reaproveite o de outro sistema.

| Requisito | Por quê |
|---|---|
| Rede privada | nunca acessível pela internet |
| Senha (`requirepass` ou ACL) | sem ela, qualquer um na rede lê ou forja sessões |
| TLS | senha e tokens não podem trafegar em texto puro |
| `maxmemory-policy noeviction` | outra política descarta sessões em silêncio |
| AOF (`appendonly yes`) | reiniciar o Redis não desloga todo mundo |

`redis.conf` de referência:

```conf
port 0
tls-port 6380
tls-cert-file /etc/redis/tls/redis.crt
tls-key-file  /etc/redis/tls/redis.key
tls-ca-cert-file /etc/redis/tls/ca.crt
tls-auth-clients no
tls-protocols "TLSv1.2 TLSv1.3"

requirepass <SENHA-FORTE>          # openssl rand -base64 36

maxmemory 512mb
maxmemory-policy noeviction

appendonly yes
appendfsync everysec

bind <IP-PRIVADO-DO-REDIS>
protected-mode yes
```

- **`REDIS_URL`:** `rediss://:SENHA@redis.interno:6380`. O `rediss://` (dois "s") liga o TLS. Caracteres especiais da senha vão codificados (`@`→`%40`, `:`→`%3A`, `/`→`%2F`, `#`→`%23`), ou use senha só com letras e números.
- **Certificado:** o host da URL precisa constar no certificado. Com CA própria, defina `NODE_EXTRA_CA_CERTS=/caminho/ca.crt` no serviço do Next.
- **Redis gerenciado** (ElastiCache, Upstash…): ative criptografia em trânsito e *auth token* e confira `noeviction` no painel.
- **Conferir:** `npm run verificar:producao` conecta de verdade e acusa Redis sem senha, política errada, AOF desligado ou TLS ausente.
- **Memória:** com `noeviction`, se encher, novos logins falham em vez de derrubar sessões. Configure alerta de uso.

---

## 5. Atualizar uma versão publicada

| Parte | Passos |
|---|---|
| Backend | `git pull` → `composer install --no-dev --optimize-autoloader` → `php artisan migrate --force` → refazer `config:cache`, `route:cache`, `view:cache` → `php artisan producao:verificar` → `systemctl restart app-queue` |
| Frontend | `git pull` → `npm ci` → `npm run verificar:producao` → `npm run build` → `systemctl restart app-next` |

---

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `composer install` recusa a versão do PHP | Confira `php -v` no **CLI** e no **PHP-FPM**: podem ser versões diferentes. |
| 500 ou tela em branco na API | Veja `storage/logs/laravel.log`, as permissões do passo 2.3 e rode `php artisan config:clear` se mudou o `.env` depois do cache. |
| Login responde 503 | Redis inacessível ou `REDIS_URL` errada. Veja `/api/health` e a linha `[sessao] …` no log do Next. |
| Todos recebem 429 (limite de requisições) | `TRUSTED_PROXIES` (backend) ou `TRUSTED_PROXY_HOPS` (frontend) errados: a API enxerga o IP do servidor Next. |
| Mudei variáveis do Next e nada mudou | Reinicie o serviço; se a variável é usada no build, rode `npm run build` de novo. |
| E-mails não saem e a auditoria não grava | Worker parado: `systemctl status app-queue`. |
