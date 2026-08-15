# Frontend — Next.js

Aplicação Next.js 15 (App Router) que atua como *Backend for Frontend* (BFF) da [API Laravel](../backend/README.md) — o navegador nunca chama o backend diretamente.

Para arquitetura, autenticação e organização de pastas em detalhe, veja [`docs/frontend-arquitetura.md`](../docs/frontend-arquitetura.md).

## Stack

Next.js `15.5.6` (Turbopack) · React `19.1` · TypeScript · Tailwind CSS `^4` · shadcn/ui + Radix UI · TanStack Query/Table · React Hook Form + Zod.

## Instalação

```bash
cd frontend
npm install
```

Certifique-se de que o [backend](../backend/README.md) já está rodando antes de iniciar.

## Variáveis de ambiente

<!-- TODO: não existe .env.local.example no repositório. Crie um .env.local com pelo menos: -->

| Variável | Descrição |
|---|---|
| `BACKEND_URL` | URL da API Laravel, usada apenas no servidor (rotas `app/api/**`). Nunca exposta ao navegador. |

## Scripts

```bash
npm run dev      # next dev --turbopack — http://localhost:3000
npm run build    # next build --turbopack
npm run start    # serve o build de produção
npm run lint     # eslint
```

## Saiba mais

- [Arquitetura BFF (proxy + cookies httpOnly)](../docs/arquitetura.md#frontend-bff)
- [Estrutura de pastas: `domains/`, `features/`, `components/`](../docs/frontend-arquitetura.md)
- [Autenticação no frontend](../docs/autenticacao-e-autorizacao.md#frontend)
