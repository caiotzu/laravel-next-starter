# Instalação local

Rode o projeto na sua máquina, do zero. Ao final você terá **API + banco + Redis + frontend** funcionando, com usuários de teste.

> Para publicar em servidor: [`implantacao-servidor.md`](./implantacao-servidor.md).

---

## 1. O que instalar antes

| Item | Para quê | Conferir |
|---|---|---|
| **Git** | baixar o código | `git --version` |
| **Docker** + Compose | API, PostgreSQL e Redis (Laravel Sail) | `docker compose version` |
| **Node.js 22.22.2+** e npm | frontend | `node -v` |
| **PHP 8.5** e **Composer** | só o primeiro `composer install` (veja a alternativa no passo 3.1) | `php -v` |

💡 No Windows, use o **WSL2**.

### Portas usadas

| Porta | Serviço | Para mudar |
|---|---|---|
| **80** | API Laravel | `APP_PORT` no `backend/.env` |
| **3000** | Frontend | `npm run dev -- -p OUTRA` |
| **5432** | PostgreSQL | `FORWARD_DB_PORT` |
| **6379** | Redis | `FORWARD_REDIS_PORT` |

---

## 2. Baixar o projeto

```bash
git clone https://github.com/caiotzu/laravel-next-starter.git
cd laravel-next-starter
```

✅ **Esperado:** pastas `backend/`, `frontend/` e `docs/`.

---

## 3. Backend

Tudo dentro de `backend/`.

### 3.1 Dependências PHP

```bash
cd backend
composer install
```

✅ **Esperado:** pasta `vendor/` criada (existe `vendor/bin/sail`).

<details>
<summary>Sem PHP 8.5 na máquina?</summary>

Use o método da documentação do Laravel Sail (container temporário):

```bash
docker run --rm -u "$(id -u):$(id -g)" -v "$(pwd):/var/www/html" -w /var/www/html \
    laravelsail/php85-composer:latest composer install --ignore-platform-reqs
```

</details>

### 3.2 Arquivo `.env`

```bash
cp .env.example .env
```

Os valores já funcionam com o Sail. Recomendado em desenvolvimento: troque `QUEUE_CONNECTION="database"` por `"sync"` (dispensa o worker de fila).

### 3.3 Subir os containers

```bash
./vendor/bin/sail up -d
./vendor/bin/sail ps
```

✅ **Esperado:** `laravel.test`, `pgsql` e `redis` com estado `Up`. A primeira vez demora (baixa as imagens).

### 3.4 Chaves da aplicação

```bash
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan jwt:secret
```

✅ **Esperado:** `APP_KEY` e `JWT_SECRET` preenchidos no `.env`.


### 3.5 Criar link simbólico do storage

```bash
./vendor/bin/sail artisan storage:link  
```

### 3.6 Banco e usuários de teste

```bash
./vendor/bin/sail artisan migrate --seed
```

✅ **Esperado:** migrations e seeders terminam sem erro.


### 3.7 Verificar

```bash
curl -i http://localhost/up
```

✅ **Esperado:** `HTTP/1.1 200 OK`. O Swagger abre em <http://localhost/api/documentation>.

---

## 4. Frontend

Tudo dentro de `frontend/`, em **outro terminal**, com o backend rodando.

### 4.1 Dependências

```bash
cd frontend
npm ci
```

✅ **Esperado:** pasta `node_modules/` criada, sem erro.

### 4.2 Arquivo `.env`

```bash
cp .env.example .env
```

| Variável | Valor local | O que é |
|---|---|---|
| `BACKEND_URL` | `http://localhost/api` | URL da API (só o servidor do Next usa) |
| `FRONTEND_URL` | `http://localhost:3000` | endereço do frontend |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis das sessões. **Obrigatória**: sem ela o login responde 503 |

### 4.3 Rodar e verificar

```bash
npm run dev
curl http://localhost:3000/api/health
```

✅ **Esperado:** `{"status":"ok","redis":"ok"}`.

---

## 5. Entrar no sistema

O `migrate --seed` cria dois usuários **de desenvolvimento**:

| Área | Endereço | E-mail | Senha |
|---|---|---|---|
| Admin | <http://localhost:3000/admin> | `admin@admin.com.br` | `Admin123@` |
| Cliente | <http://localhost:3000/> | `private@private.com.br` | `Private123@` |

Para testar tudo com calma: [`roteiro-de-validacao.md`](./roteiro-de-validacao.md) (Parte A).

---

## 6. Dia a dia

| Quero… | Comando |
|---|---|
| Parar tudo | `cd backend && ./vendor/bin/sail down` e `Ctrl+C` no frontend |
| Subir de novo | `./vendor/bin/sail up -d` e `npm run dev` |
| Apagar os dados e recriar o banco | `./vendor/bin/sail artisan migrate:fresh --seed` |
| Rodar os testes | `./vendor/bin/sail artisan test --compact` e `npm test` |
| Entrar no container | `./vendor/bin/sail shell` |
| Executar queue:work | `./vendor/bin/sail artisan queue:work` |
| Executar schedule:work   | `./vendor/bin/sail artisan schedule:work  ` |

⚠️ Nunca use `sail down -v`: apaga o banco.

**Swagger Admin** (`/api/documentation/admin`) fica fechado até você definir a senha:

```bash
./vendor/bin/sail artisan swagger:admin-hash "SuaSenha"
```

Copie as duas linhas para o `backend/.env` e rode `./vendor/bin/sail artisan config:clear`. Acesso: HTTP Basic, usuário `admin`.

---

## Problemas comuns

| Sintoma | Causa e solução |
|---|---|
| `vendor/bin/sail: No such file` | Faltou o passo 3.1 (`composer install`). |
| Porta 80, 5432 ou 6379 ocupada | Defina `APP_PORT`, `FORWARD_DB_PORT` ou `FORWARD_REDIS_PORT` no `backend/.env` e rode `sail up -d`. Se mudar a porta da API, ajuste `APP_URL` e o `BACKEND_URL` do frontend. Se mudar a do Redis, ajuste `REDIS_URL`. |
| "Serviço de sessão temporariamente indisponível" ou `/api/health` com 503 | Redis fora do ar ou `REDIS_URL` errada. Teste: `sail exec redis redis-cli ping` (deve responder `PONG`). O terminal do Next mostra uma linha `[sessao] …`. |
| Mudei o `.env` e nada mudou | Frontend: pare e rode `npm run dev` de novo. Backend: `sail artisan config:clear`. |
| Redis sai com `Can't handle RDB format version` | Volume antigo. `sail down`, `docker volume rm backend_sail-redis`, `sail up -d`. |
| Login não conecta com a API | Confira `curl http://localhost/up` (200) e `BACKEND_URL=http://localhost/api` (com `/api`). |
| `No application encryption key` / `Secret is not set` | Faltou o passo 3.4. Rode `key:generate`, `jwt:secret` e `config:clear`. |
| Auditoria vazia e e-mails não saem | Com `QUEUE_CONNECTION="database"` rode `sail artisan queue:work` (ou use `sync`). E-mail também exige `MAIL_*` e `EMAIL_PROVIDER` configurados. |
| `npm ci` reclama da versão do Node | Instale Node 22.22.2 ou superior. |
