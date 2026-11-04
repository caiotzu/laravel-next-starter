# Frontend — Next.js

Aplicação Next.js 16 (App Router) que atua como *Backend for Frontend* (BFF) da [API Laravel](../backend/README.md) — o navegador nunca chama o backend diretamente.

Para arquitetura, autenticação e organização de pastas em detalhe, veja [`docs/frontend-arquitetura.md`](../docs/frontend-arquitetura.md).

## Stack

Next.js `16.4.4` (Turbopack) — exige Node.js ≥ 20.9 · React `19.1` · TypeScript · Tailwind CSS `^4` · shadcn/ui + Radix UI · TanStack Query/Table · React Hook Form + Zod · Tiptap + DOMPurify · Recharts.

## Instalação

```bash
cd frontend
npm install
```

Certifique-se de que o [backend](../backend/README.md) já está rodando antes de iniciar.

## Variáveis de ambiente

Copie o modelo: `cp .env.example .env` (o arquivo `.env.example` existe em `frontend/`).

| Variável | Descrição |
|---|---|
| `BACKEND_URL` | URL da API Laravel (ex.: `http://localhost/api`), usada apenas no servidor (rotas `app/api/**`). Nunca exposta ao navegador. O proxy só aceita caminhos dentro dessa URL. |
| `FRONTEND_URL` | Origem pública do frontend (ex.: `http://localhost:3000`). Usada por `validarOrigem()` para aceitar somente requisições da própria origem nas rotas `app/api/**` — **sem ela as rotas respondem 403 quando há `Origin`** |
| `REDIS_URL` | **Obrigatória.** Redis das sessões do BFF (o JWT fica aqui, nunca no navegador). Local: `redis://127.0.0.1:6379` (serviço `redis` do `backend/docker-compose.yml`). Produção: Redis privado com senha e TLS (`rediss://:SENHA@host:6380`). Sem ela, login e rotas autenticadas respondem 503 |
| `NODE_ENV` | Em `production`: cookie de sessão `secure` com prefixo `__Host-` e cabeçalho HSTS |
| `TRUSTED_PROXY_HOPS` | *(opcional)* Quantos proxies reversos ficam na frente do Next e acrescentam ao `X-Forwarded-For`. Padrão `1`; `0` = Next exposto direto (nenhum IP é repassado ao backend). **Deve ser exatamente o número real de proxies**: um valor maior faz o BFF confiar em um IP escolhido pelo cliente |
| `CSP_MODO` | *(opcional)* `report-only` troca o cabeçalho para `Content-Security-Policy-Report-Only` (o navegador só registra violações, não bloqueia). Padrão: bloqueia. Use só para validar a política num ambiente novo |
| `BACKEND_STORAGE_URL` | *(opcional)* Origem que serve `/storage/...` (avatares e imagens de banner), se for diferente da de `BACKEND_URL` |

## Scripts

```bash
npm run dev      # next dev --turbopack — http://localhost:3000
npm run build    # next build --turbopack
npm run start    # serve o build de produção
npm run lint     # eslint
```

## Saiba mais

- [Arquitetura BFF (proxy + sessão no Redis)](../docs/arquitetura.md#frontend-bff)
- [Estrutura de pastas: `domains/`, `features/`, `components/`](../docs/frontend-arquitetura.md)
- [Autenticação no frontend](../docs/autenticacao-e-autorizacao.md#frontend)
- [Segurança da camada BFF](../docs/seguranca.md#camada-bff-nextjs)

## Verificação de saúde

`GET /api/health` (público, sem cookie) responde `200 {"status":"ok","redis":"ok"}` quando o Redis das sessões responde e `503 {"status":"degradado","redis":"indisponivel"}` quando não responde. Serve para monitoramento, balanceador de carga e healthcheck de container; não expõe host, versão nem mensagens de erro. Exemplo de healthcheck: `curl -fsS http://localhost:3000/api/health`.

## Segurança do navegador

- **CSP com nonce** (`proxy.ts`, `lib/security/csp.ts`): só executa script marcado com o nonce da requisição. Por isso as páginas são renderizadas sob demanda. Mexeu em scripts, fontes, imagens ou hosts externos? Rode `npm run build && npm run e2e`: `e2e/csp.e2e.ts` falha se alguma tela violar a política.
- **`/storage/*`** é atendido por `app/storage/[...caminho]/route.ts` (valida o caminho, só repassa imagens inline, com `nosniff` e CSP `sandbox`).
- **zod** deve ser importado de `@/lib/zod` (configura o modo `jitless` que a CSP exige); o ESLint recusa `import … from "zod"` fora dele.
- **HTML de usuário** exibido com `dangerouslySetInnerHTML` passa por `lib/sanitize-html.ts` (allowlist igual à do backend).
