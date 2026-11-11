# Laravel Next Starter

Starter full stack com API em **Laravel 13** (JWT, permissões, multi-tenant) e front-end em **Next.js 16** (App Router, atuando como BFF). Traz domínios de negócio prontos como referência: usuários, grupos e permissões, empresas, mensagens, banners, chamados de suporte (com anexos), releases, Acesso de Suporte (impersonação temporária e auditável), dashboard e auditoria.

## Stack

- **Backend:** PHP 8.5, Laravel 13, PostgreSQL 17, JWT (`tymon/jwt-auth`), 2FA, Swagger, Pest 4, Docker (Sail, só para desenvolvimento).
- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, TanStack Query/Table.
- **Sessões:** Redis 7. O Next.js guarda o JWT no Redis e o navegador recebe só um cookie opaco. **Sem Redis o login não funciona.**

## Quick start

Pré-requisitos: Git, Docker, Node.js 22.22.2+, PHP 8.5 e Composer (passo a passo completo, e a alternativa sem PHP, em [`docs/instalacao-local.md`](./docs/instalacao-local.md)).

```bash
git clone https://github.com/caiotzu/laravel-next-starter.git && cd laravel-next-starter

# Backend (API em http://localhost)
cd backend
composer install && cp .env.example .env
./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate && ./vendor/bin/sail artisan jwt:secret
./vendor/bin/sail artisan migrate --seed

# Frontend, em outro terminal (http://localhost:3000)
cd frontend
npm ci && cp .env.example .env && npm run dev
```

Admin: <http://localhost:3000/admin> (`admin@admin.com.br` / `Admin123@`). Cliente: <http://localhost:3000/> (`private@private.com.br` / `Private123@`). São contas de desenvolvimento: nunca as use em produção.

## Estrutura

```text
backend/    # API Laravel (README próprio)
frontend/   # App Next.js (README próprio)
docs/       # Documentação técnica
```

## Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/instalacao-local.md`](./docs/instalacao-local.md) | Primeira execução na máquina, passo a passo |
| [`docs/implantacao-servidor.md`](./docs/implantacao-servidor.md) | Requisitos e passo a passo em servidor |
| [`docs/checklist-producao.md`](./docs/checklist-producao.md) | Conferência antes de publicar |
| [`docs/redis-producao.md`](./docs/redis-producao.md) | Redis de produção (senha, TLS, persistência) |
| [`docs/roteiro-de-validacao.md`](./docs/roteiro-de-validacao.md) | Validação manual: localhost e produção |
| [`docs/guia-do-projeto.md`](./docs/guia-do-projeto.md) | Fluxos, convenções, como criar funcionalidades |
| [`docs/arquitetura.md`](./docs/arquitetura.md) | Back-end, front-end e BFF: camadas e diagramas |
| [`docs/autenticacao-e-autorizacao.md`](./docs/autenticacao-e-autorizacao.md) | JWT, sessões, 2FA, permissões |
| [`docs/api.md`](./docs/api.md) | Swagger e rotas por recurso |
| [`docs/banco-de-dados.md`](./docs/banco-de-dados.md) | Migrations, seeders, modelo de dados |
| [`docs/filas-e-eventos.md`](./docs/filas-e-eventos.md) | Jobs, filas, eventos e comandos agendados |
| [`docs/armazenamento-de-arquivos.md`](./docs/armazenamento-de-arquivos.md) | Uploads e discos |
| [`docs/repositories.md`](./docs/repositories.md) | Repository e escopo de entidade (multi-tenant) |
| [`docs/frontend-arquitetura.md`](./docs/frontend-arquitetura.md) | `domains/`, `features/`, componentes, estado |
| [`docs/testes.md`](./docs/testes.md) | Testes e CI |
| [`docs/seguranca.md`](./docs/seguranca.md) | Controles de segurança e avaliação |
| [`docs/vantagens.md`](./docs/vantagens.md) | Por que essa arquitetura |
| [`CLAUDE.md`](./CLAUDE.md) | Guia para a IA (convenções, comandos, critérios de conclusão) |
