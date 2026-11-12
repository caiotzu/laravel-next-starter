# Frontend — Next.js

Aplicação Next.js 16 (App Router) que atua como *Backend for Frontend* (BFF) da [API Laravel](../backend/README.md): o navegador nunca chama o backend diretamente.

**Stack:** Next.js 16 (Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui · TanStack Query/Table · React Hook Form + Zod · Tiptap · Recharts. Exige **Node.js 22.22.2+**.

📚 Estrutura e convenções: [`docs/frontend.md`](../docs/frontend.md)

---

## Instalação

Passo a passo completo: [`docs/instalacao-local.md`](../docs/instalacao-local.md). Com o [backend](../backend/README.md) rodando:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev          # http://localhost:3000
```

---

## Variáveis de ambiente

Modelo em `.env.example`. Produção: [`docs/implantacao-servidor.md`](../docs/implantacao-servidor.md).

| Variável | Descrição |
|---|---|
| `BACKEND_URL` | URL da API (ex.: `http://localhost/api`); usada só no servidor |
| `FRONTEND_URL` | Origem pública do frontend (ex.: `http://localhost:3000`). Sem ela as rotas `app/api/**` recusam requisições com `Origin` |
| `REDIS_URL` | **Obrigatória.** Redis das sessões. Local: `redis://127.0.0.1:6379`. Produção: `rediss://:SENHA@host:6380`. Sem ela o login responde 503 |
| `NODE_ENV` | Em `production`: cookie `__Host-` + `Secure` e HSTS |
| `TRUSTED_PROXY_HOPS` | *(opcional)* número de proxies reversos na frente do Next (padrão `1`). **Deve ser exato** |
| `CSP_MODO` | *(opcional)* `report-only` só registra violações da CSP. Use apenas para validar um ambiente novo |
| `BACKEND_STORAGE_URL` | *(opcional)* origem de `/storage/...`, se diferente da do backend |

---

## Scripts

| Comando | Para quê |
|---|---|
| `npm run dev` | desenvolvimento |
| `npm run build` / `npm run start` | build e execução de produção |
| `npm run lint` | ESLint (0 avisos) |
| `npm test` | Vitest (`REDIS_URL=… npm test` inclui os testes com Redis real) |
| `npm run e2e` | Playwright (precisa de `npm run build` antes) |
| `npm run verificar:producao` | confere o ambiente de produção |

## Saúde

`GET /api/health` → `200 {"status":"ok","redis":"ok"}` ou `503 {"status":"degradado","redis":"indisponivel"}`. Serve para monitoramento e balanceador.

---

## Saiba mais

[Frontend](../docs/frontend.md) · [Segurança](../docs/seguranca.md) · [Testes](../docs/testes.md)
