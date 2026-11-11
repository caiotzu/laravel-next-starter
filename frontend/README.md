# Frontend: Next.js

Aplicação Next.js 16 (App Router) que atua como *Backend for Frontend* (BFF) da [API Laravel](../backend/README.md): o navegador nunca chama o backend diretamente. Arquitetura e organização de pastas em [`docs/frontend-arquitetura.md`](../docs/frontend-arquitetura.md).

**Stack:** Next.js `16.4.4` (Turbopack) · React `19.1` · TypeScript · Tailwind CSS 4 · shadcn/ui + Radix UI · TanStack Query/Table · React Hook Form + Zod · Tiptap + DOMPurify · Recharts. Exige **Node.js 22.22.2 ou superior**.

## Instalação

Passo a passo completo: [`docs/instalacao-local.md`](../docs/instalacao-local.md). Com o [backend](../backend/README.md) já rodando:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev          # http://localhost:3000
```

## Variáveis de ambiente

Modelo em `.env.example`. Produção: [`docs/implantacao-servidor.md`](../docs/implantacao-servidor.md).

| Variável | Descrição |
|---|---|
| `BACKEND_URL` | URL da API Laravel (ex.: `http://localhost/api`), usada só no servidor. O proxy só aceita caminhos dentro dela |
| `FRONTEND_URL` | Origem pública do frontend (ex.: `http://localhost:3000`). Sem ela as rotas `app/api/**` respondem 403 quando há `Origin` |
| `REDIS_URL` | **Obrigatória.** Redis das sessões (o JWT fica aqui, nunca no navegador). Local: `redis://127.0.0.1:6379`. Produção: Redis privado com senha e TLS (`rediss://:SENHA@host:6380`). Sem ela, login e rotas autenticadas respondem 503 |
| `NODE_ENV` | Em `production`: cookie de sessão `secure` com prefixo `__Host-` e cabeçalho HSTS |
| `TRUSTED_PROXY_HOPS` | *(opcional)* Quantos proxies reversos ficam na frente do Next. Padrão `1`; `0` = Next exposto direto. **Deve ser exatamente o número real de proxies** |
| `CSP_MODO` | *(opcional)* `report-only` só registra violações da CSP, sem bloquear. Use apenas para validar um ambiente novo |
| `BACKEND_STORAGE_URL` | *(opcional)* Origem que serve `/storage/...`, se diferente da de `BACKEND_URL` |

## Scripts

```bash
npm run dev                 # desenvolvimento (Turbopack)
npm run build               # build de produção
npm run start               # serve o build de produção
npm run lint                # ESLint (0 avisos)
npm test                    # Vitest (REDIS_URL=... para incluir os testes com Redis real)
npm run e2e                 # Playwright (precisa de `npm run build` antes)
npm run verificar:producao  # confere o ambiente de produção
```

## Saúde

`GET /api/health` (público) responde `200 {"status":"ok","redis":"ok"}` quando o Redis das sessões responde e `503 {"status":"degradado","redis":"indisponivel"}` quando não. Serve para monitoramento, balanceador e healthcheck.

## Saiba mais

[Arquitetura BFF](../docs/arquitetura.md) · [Pastas `domains/`, `features/`, `components/`](../docs/frontend-arquitetura.md) · [Autenticação](../docs/autenticacao-e-autorizacao.md) · [Segurança do BFF](../docs/seguranca.md#camada-bff-nextjs) · [Testes](../docs/testes.md)
