# Instalação local (primeira execução)

Passo a passo para rodar o projeto na sua máquina, do zero. Ao final você terá a API Laravel, o banco PostgreSQL, o Redis e o frontend Next.js funcionando, com usuários de teste para entrar.

Para publicar em um servidor, veja [`implantacao-servidor.md`](./implantacao-servidor.md).

## 1. O que instalar antes

| Item | Para quê | Como conferir |
|---|---|---|
| **Git** | baixar o código | `git --version` |
| **Docker** e **Docker Compose** | rodam a API, o PostgreSQL e o Redis (Laravel Sail) | `docker --version` e `docker compose version` |
| **Node.js 22.22.2 ou superior** (exigido por `frontend/package.json`) e **npm** | rodam o frontend | `node -v` e `npm -v` |
| **PHP 8.5 e Composer** | só para o primeiro `composer install`, que cria o `vendor/bin/sail` (veja a alternativa sem PHP no passo 3) | `php -v` e `composer -V` |

No Windows, rode os comandos dentro do WSL2 (é o ambiente esperado pelo Laravel Sail).

### Portas usadas

| Porta | Serviço | Como mudar se estiver ocupada |
|---|---|---|
| **80** | API Laravel (Sail) | `APP_PORT` no `backend/.env` |
| **3000** | Frontend Next.js | `npm run dev -- -p OUTRA_PORTA` (e ajuste `FRONTEND_URL`) |
| **5432** | PostgreSQL (só em `127.0.0.1`) | `FORWARD_DB_PORT` no `backend/.env` |
| **6379** | Redis (só em `127.0.0.1`) | `FORWARD_REDIS_PORT` no `backend/.env` (e ajuste o `REDIS_URL` do frontend) |

A API **não** usa a porta 8000 por padrão: ela responde em `http://localhost` (porta 80), e é isso que o `frontend/.env.example` espera (`BACKEND_URL="http://localhost/api"`).

## 2. Baixar o projeto

```bash
git clone https://github.com/caiotzu/laravel-next-starter.git
cd laravel-next-starter
```

**Resultado esperado:** as pastas `backend/`, `frontend/` e `docs/` existem (`ls`).

## 3. Backend (API)

Todos os comandos desta seção são executados dentro de `backend/`.

**3.1. Instalar as dependências PHP**

```bash
cd backend
composer install
```

Resultado esperado: termina sem erro e cria a pasta `vendor/` (o arquivo `vendor/bin/sail` passa a existir).

> **Sem PHP 8.5 na máquina?** Use a alternativa da documentação do Laravel Sail, que instala as dependências dentro de um container temporário (a versão da imagem deve ser a do projeto, PHP 8.5):
>
> ```bash
> docker run --rm \
>     -u "$(id -u):$(id -g)" \
>     -v "$(pwd):/var/www/html" \
>     -w /var/www/html \
>     laravelsail/php85-composer:latest \
>     composer install --ignore-platform-reqs
> ```

**3.2. Criar o `.env`**

```bash
cp .env.example .env
```

Os valores do exemplo já funcionam com o Sail (`DB_HOST=pgsql`, `DB_USERNAME=sail`, `DB_PASSWORD=password`). Opcional, mas recomendado em desenvolvimento: troque `QUEUE_CONNECTION="database"` por `QUEUE_CONNECTION="sync"` para não precisar de um *worker* de fila (veja "Problemas comuns").

**3.3. Subir os containers**

```bash
./vendor/bin/sail up -d
```

Na primeira vez o Docker baixa e monta as imagens (pode levar vários minutos). Conferir:

```bash
./vendor/bin/sail ps
```

Resultado esperado: três serviços com estado `Up`: `laravel.test`, `pgsql` e `redis`.

**3.4. Gerar as chaves da aplicação**

```bash
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan jwt:secret
```

Resultado esperado: `APP_KEY` e `JWT_SECRET` passam a ter valor no `backend/.env`.

**3.5. Criar as tabelas e os dados de teste**

```bash
./vendor/bin/sail artisan migrate --seed
```

Resultado esperado: as migrations e os seeders terminam sem erro (`DONE`).

**3.6. Verificar que a API funciona**

```bash
curl -i http://localhost/up
```

Resultado esperado: resposta `HTTP/1.1 200 OK`. A documentação Swagger também deve abrir em <http://localhost/api/documentation>.

## 4. Frontend

Todos os comandos desta seção são executados dentro de `frontend/`, em **outro terminal**. O backend (passo 3) precisa estar rodando.

**4.1. Instalar as dependências**

```bash
cd frontend
npm ci
```

Resultado esperado: termina sem erro e cria `node_modules/`. Se aparecer aviso de versão do Node, atualize o Node (precisa ser 22.22.2 ou superior).

**4.2. Criar o `.env`**

```bash
cp .env.example .env
```

Confira as variáveis:

| Variável | Valor local | O que é |
|---|---|---|
| `BACKEND_URL` | `http://localhost/api` | URL da API Laravel (usada só no servidor do Next) |
| `FRONTEND_URL` | `http://localhost:3000` | endereço do frontend; sem ele as rotas `/api/**` recusam as requisições |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis das sessões (o serviço `redis` do Sail). **Obrigatória**: sem ele o login responde 503 |

**4.3. Rodar**

```bash
npm run dev
```

Resultado esperado: o terminal mostra o Next.js iniciado em `http://localhost:3000`.

**4.4. Verificar**

```bash
curl http://localhost:3000/api/health
```

Resultado esperado: `{"status":"ok","redis":"ok"}`. Se vier `503` com `"redis":"indisponivel"`, veja "Problemas comuns".

## 5. Entrar no sistema

O `migrate --seed` cria dois usuários **de desenvolvimento** (use apenas em ambiente local):

| Área | Endereço | E-mail | Senha |
|---|---|---|---|
| Admin (equipe interna) | <http://localhost:3000/admin> | `admin@admin.com.br` | `Admin123@` |
| Private (cliente) | <http://localhost:3000/> | `private@private.com.br` | `Private123@` |

Resultado esperado: o login do Admin leva a `/admin/home`; o do cliente leva à home do cliente.

Para testar tudo com calma depois de subir, use o [`roteiro-de-validacao.md`](./roteiro-de-validacao.md) (parte local).

## 6. Dia a dia

```bash
# Parar tudo (dados do banco são mantidos)
cd backend && ./vendor/bin/sail down        # nunca use `down -v`: apaga o banco
# Ctrl+C no terminal do frontend

# Subir de novo
cd backend && ./vendor/bin/sail up -d
cd frontend && npm run dev

# Apagar TODOS os dados e recriar o banco com os usuários de teste
cd backend && ./vendor/bin/sail artisan migrate:fresh --seed
```

## 7. Testes e Swagger

```bash
# Backend (em backend/)
./vendor/bin/sail artisan test --compact

# Frontend (em frontend/)
npm test                      # sem REDIS_URL, os testes com Redis real são pulados
npx tsc --noEmit              # tipos
npm run lint                  # ESLint
```

Mais detalhes (E2E, convenções) em [`testes.md`](./testes.md).

**Swagger.** A documentação pública abre em <http://localhost/api/documentation>. A documentação **Admin** (`/api/documentation/admin`) fica fechada até você definir as credenciais:

```bash
./vendor/bin/sail artisan swagger:admin-hash "SuaSenha"
```

Copie as duas linhas impressas (`SWAGGER_ADMIN_USERNAME` e `SWAGGER_ADMIN_PASSWORD_HASH`) para o `backend/.env` e rode `./vendor/bin/sail artisan config:clear`. O acesso usa HTTP Basic (usuário `admin` e a senha escolhida).

## Problemas comuns

**`vendor/bin/sail: No such file or directory`**
As dependências PHP ainda não foram instaladas. Faça o passo 3.1.

**A porta 80, 5432 ou 6379 já está em uso (o `sail up` falha)**
Outro programa usa a porta. Defina no `backend/.env` `APP_PORT=8080` (API), `FORWARD_DB_PORT=5433` (PostgreSQL) ou `FORWARD_REDIS_PORT=6380` (Redis) e rode `./vendor/bin/sail up -d` de novo. Se mudar a porta da API, ajuste também `APP_URL` no `backend/.env` e `BACKEND_URL` no `frontend/.env` (`http://localhost:8080/api`). Se mudar a do Redis, ajuste `REDIS_URL`.

**Ao entrar aparece "Serviço de sessão temporariamente indisponível" (ou `/api/health` responde 503)**
O Redis não está acessível ou o `REDIS_URL` do `frontend/.env` está ausente ou errado. Confira:

```bash
cd backend
./vendor/bin/sail ps                          # redis deve estar "Up"
./vendor/bin/sail exec redis redis-cli ping   # deve responder PONG
```

O terminal do Next mostra uma linha `[sessao] …` explicando o motivo.

**Mudei o `.env` e nada mudou**
- **Frontend:** o Next só lê o `.env` ao iniciar. Pare (`Ctrl+C`) e rode `npm run dev` de novo.
- **Backend:** rode `./vendor/bin/sail artisan config:clear`.

**O container do Redis sai com `Can't handle RDB format version`**
É um volume antigo (`backend_sail-redis`) de uma versão anterior do compose ou de outra versão do Redis. Rode `./vendor/bin/sail down`, depois `docker volume rm backend_sail-redis` e `./vendor/bin/sail up -d`. Não use `down -v`: isso apaga também o banco.

**O login do frontend não conecta com a API**
Confira se `curl http://localhost/up` responde 200 e se `BACKEND_URL` no `frontend/.env` aponta para `http://localhost/api` (com `/api` no final).

**Erro de chave (`No application encryption key`) ou de JWT (`Secret is not set`)**
Faltou o passo 3.4. Rode `key:generate` e `jwt:secret` e, em seguida, `./vendor/bin/sail artisan config:clear`.

**A tela de Auditoria fica vazia e e-mails não saem**
A auditoria e os e-mails usam fila. Com `QUEUE_CONNECTION="database"` é preciso um *worker* rodando (`./vendor/bin/sail artisan queue:work`); com `QUEUE_CONNECTION="sync"` tudo roda na própria requisição, sem worker. O envio de e-mail (primeiro acesso, "esqueci minha senha") também exige `MAIL_*` e `EMAIL_PROVIDER` configurados no `backend/.env`; sem isso, os e-mails não saem.

**`npm ci` ou `npm run dev` reclama da versão do Node**
Instale o Node 22.22.2 ou superior (`node -v` para conferir).

**Quero abrir um terminal dentro do container da API**
`./vendor/bin/sail shell`.
