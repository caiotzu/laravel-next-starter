# Laravel Next Starter

Starter full stack com back-end em **Laravel 13** (API + JWT + permissões) e front-end em **Next.js 16** (App Router, atuando como BFF). Inclui domínios de negócio prontos como referência: usuários, grupos/permissões, empresas, mensagens, banners, chamados de suporte (com anexos), releases (novidades da plataforma), Acesso de Suporte (impersonação temporária e auditável), dashboard administrativo e auditoria.


## Stack

**Backend:** PHP 8.3+ (Sail com PHP 8.4), Laravel 13, PostgreSQL 17, JWT (`tymon/jwt-auth`), 2FA (Google2FA), Swagger (`l5-swagger`), Pest 4, Docker (Sail — apenas desenvolvimento).
**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query/Table.

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
cp .env.example .env
npm run dev
```

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
| [`docs/arquitetura.md`](./docs/arquitetura.md) | Como back-end e front-end se conectam, camadas, diagramas |
| [`docs/autenticacao-e-autorizacao.md`](./docs/autenticacao-e-autorizacao.md) | JWT, sessões, 2FA, permissões |
| [`docs/api.md`](./docs/api.md) | Swagger e referência de rotas por recurso |
| [`docs/banco-de-dados.md`](./docs/banco-de-dados.md) | Migrations, seeders, modelo de dados |
| [`docs/filas-e-eventos.md`](./docs/filas-e-eventos.md) | Jobs, filas, events/listeners |
| [`docs/frontend-arquitetura.md`](./docs/frontend-arquitetura.md) | `domains/`, `features/`, componentes, estado |
| [`docs/testes.md`](./docs/testes.md) | Como rodar os testes |
| [`docs/seguranca.md`](./docs/seguranca.md) | Controles de segurança por camada, BFF, rate limit, cabeçalhos, uploads e status do pentest |
| [`docs/vantagens.md`](./docs/vantagens.md) | Por que essa arquitetura — decisões de design e segurança |
