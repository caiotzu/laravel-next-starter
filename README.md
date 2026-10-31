# Laravel Next Starter

Starter full stack com back-end em **Laravel 13** (API + JWT + permissões) e front-end em **Next.js 16** (App Router, atuando como BFF). Inclui domínios de negócio prontos como referência: usuários, grupos/permissões, empresas, mensagens, banners, chamados de suporte (com anexos), releases (novidades da plataforma), Acesso de Suporte (impersonação temporária e auditável), dashboard administrativo e auditoria.


## Stack

**Backend:** PHP 8.3+ (Sail com PHP 8.4), Laravel 13, PostgreSQL 17, JWT (`tymon/jwt-auth`), 2FA (Google2FA), Swagger (`l5-swagger`), Pest 4, Docker (Sail — apenas desenvolvimento).
**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query/Table.
**Sessões:** Redis 7 — o Next.js (BFF) guarda o JWT no Redis e o navegador recebe só um cookie de sessão opaco. **O frontend não funciona sem o Redis** (login e rotas autenticadas respondem 503).

## Quick start

```bash
# Backend
cd backend
composer install
cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan jwt:secret
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail artisan migrate:fresh --seed # Reiniciar toda base

# Frontend (em outro terminal)
cd frontend
npm install
cp .env.example .env   # confira REDIS_URL (padrão: redis://127.0.0.1:6379)
npm run dev
```

O `sail up -d` já sobe o **Redis** (serviço `redis`) junto com o PostgreSQL. Para conferir:

```bash
cd backend
./vendor/bin/sail ps                          # redis deve estar "Up"
./vendor/bin/sail exec redis redis-cli ping   # deve responder PONG
curl http://localhost:3000/api/health         # {"status":"ok","redis":"ok"} (com o Next rodando)
```

> **Aparece "Serviço de sessão temporariamente indisponível" ao entrar?** O Redis não está acessível ou o `REDIS_URL` do `frontend/.env` está ausente ou errado. O terminal do Next mostra uma linha `[sessao] …` explicando o motivo. Depois de corrigir, reinicie o Next (ele só lê o `.env` ao iniciar).
>
> **O container do Redis sai com "Can't handle RDB format version"?** É um volume antigo (`backend_sail-redis`) de uma versão anterior deste compose ou de outra versão do Redis. Com `./vendor/bin/sail down`, apague só ele: `docker volume rm backend_sail-redis`. Não use `down -v`: isso apaga também o banco.

Front-end em `http://localhost:3000`, API em `http://localhost:8000` (ou porta configurada em `APP_PORT`).

## Estrutura

```text
.
├── backend/    # API Laravel — README.md
├── frontend/   # App Next.js — README.md
└── docs/       # Documentação técnica aprofundada (+ apresentações em docs/apresentacoes)
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [`backend/README.md`](./backend/README.md) | Instalação, variáveis de ambiente e comandos do backend |
| [`frontend/README.md`](./frontend/README.md) | Instalação, variáveis de ambiente e comandos do frontend |
| [`CLAUDE.md`](./CLAUDE.md) | Regras permanentes para o Claude Code (arquitetura aprovada, skills, comandos, critérios de conclusão) |
| [`docs/PROJECT_GUIDE.md`](./docs/PROJECT_GUIDE.md) | Guia técnico: fluxos, convenções, como criar funcionalidades, testes e comandos |
| [`docs/IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) | Estado atual, backlog priorizado, próxima tarefa e histórico de decisões |
| [`docs/repositories.md`](./docs/repositories.md) | Padrão de Repository e escopo de entidade (multi-tenant) |
| [`docs/arquitetura.md`](./docs/arquitetura.md) | Como back-end e front-end se conectam, camadas, diagramas |
| [`docs/autenticacao-e-autorizacao.md`](./docs/autenticacao-e-autorizacao.md) | JWT, sessões, 2FA, permissões |
| [`docs/api.md`](./docs/api.md) | Swagger e referência de rotas por recurso |
| [`docs/banco-de-dados.md`](./docs/banco-de-dados.md) | Migrations, seeders, modelo de dados |
| [`docs/filas-e-eventos.md`](./docs/filas-e-eventos.md) | Jobs, filas, events/listeners |
| [`docs/frontend-arquitetura.md`](./docs/frontend-arquitetura.md) | `domains/`, `features/`, componentes, estado |
| [`docs/testes.md`](./docs/testes.md) | Como rodar os testes |
| [`docs/seguranca.md`](./docs/seguranca.md) | Controles de segurança por camada, BFF, rate limit, cabeçalhos, uploads e status do pentest |
| [`docs/vantagens.md`](./docs/vantagens.md) | Por que essa arquitetura — decisões de design e segurança |
