# Frontend (Next.js)

Como o frontend funciona e como evoluí-lo. Para rodar: [`instalacao-local.md`](./instalacao-local.md). Para segurança: [`seguranca.md`](./seguranca.md).

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind 4 · shadcn/ui · TanStack Query/Table · React Hook Form + Zod · Tiptap · Recharts. Exige Node.js 22.22.2+.

---

## 1. Como funciona (BFF)

O Next.js é um *Backend for Frontend*: o navegador conversa **só** com ele, e ele conversa com a API Laravel.

```text
Navegador ──cookie opaco──▶ Next.js (app/api/*) ──JWT──▶ Laravel
                                 └── sessões ──▶ Redis
```

**Login**

1. A página chama `app/api/auth/{admin|private}/login`.
2. O Next valida a origem, chama o Laravel e guarda o **JWT no Redis**.
3. O navegador recebe **só um cookie opaco** (`HttpOnly`, `SameSite=Lax`).

**Chamadas seguintes**

1. A tela chama `lib/proxy-admin.ts` ou `lib/proxy-private.ts` (nunca o Laravel direto).
2. `app/api/proxy/*` troca o cookie pelo JWT, injeta `Authorization` e repassa.
3. Sem sessão válida, responde **401 sem chamar o backend**; Redis fora do ar responde **503**.

**Navegação**

- `proxy.ts` confere se existe sessão válida no Redis e redireciona para o login ou para a home certa (usa `routes/routes.ts`).
- O logout destrói a sessão no Redis e apaga o cookie.

**Vários usuários ao mesmo tempo:** cada login cria uma sessão independente. Admin e Private no mesmo navegador também têm sessões separadas.

**Monitoramento:** `GET /api/health` → 200 (Redis ok) ou 503.

---

## 2. Estrutura de pastas

```text
frontend/
├── app/
│   ├── admin/            páginas da área Admin
│   ├── (private)/        páginas da área do cliente (URL na raiz)
│   ├── api/auth/         login, logout, 2FA, senha (cria/encerra a sessão)
│   ├── api/proxy/        proxy autenticado para a API
│   ├── api/health/       saúde do Redis
│   └── storage/          imagens enviadas (avatares, banners)
├── domains/{admin|private}/{recurso}/   DADOS: types, services, hooks, mappers
├── features/{admin|private}/{recurso}/  UI: components, schemas
├── components/           só o realmente compartilhado (ui, layouts, data-tables, forms…)
├── lib/                  proxy-guard, sessão, CSP, sanitização, helpers
├── routes/routes.ts      mapa de rotas protegidas
├── proxy.ts              proteção de navegação + CSP
├── tests/  e2e/          Vitest e Playwright
└── scripts/              verificar-producao.mjs
```

💡 **Regra prática:** *dados* (fetch, cache, transformação) em `domains/`; *telas e formulários* em `features/`.

### Áreas e menus

| Área | Endereço | Menus |
|---|---|---|
| **Admin** | `/admin` | Home · Dashboard · Auditoria · Grupos de Empresas · Empresas · Mensagens · Banners · Acessos de Suporte · Chamados · Releases · Grupos · Usuários |
| **Private** (cliente) | `/` | Home · Empresas · Acesso de Suporte · Meus Chamados · Novidades · Grupos · Usuários |

Os dois têm **Perfil** (dados, senha, avatar, sessões e 2FA).

---

## 3. Convenções

| Assunto | Padrão |
|---|---|
| Arquivos de domínio | `{recurso}Service.ts`, `use{Recurso}.ts`, `{recurso}.mapper.ts`, `{recurso}.schema.ts` |
| Componentes | `PascalCase.tsx` |
| Estado de servidor | TanStack Query (hooks em `domains/.../hooks`) |
| Estado de UI | `useState` / `useReducer` (sem Redux/Zustand) |
| Formulários | React Hook Form + schema Zod em `features/.../schemas` |
| Zod | importe de `@/lib/zod` (modo exigido pela CSP) |
| Estilo | Tailwind 4; tema claro/escuro com `next-themes` |
| Regra de negócio | **no backend**; o frontend não a duplica |

---

## 4. Como criar uma tela

1. Use `domains/{ctx}/grupo` e `features/{ctx}/grupo` como molde.
2. **Tipos** em `types/`, **chamadas** em `services/` (via `proxyAdminRequest` / `proxyPrivateRequest`), **conversão** em `mappers/`, **hooks** do TanStack em `hooks/`.
3. **Formulário:** schema Zod + React Hook Form, exibindo os erros do backend.
4. **Página** em `app/admin/**` ou `app/(private)/**` e rota protegida em `routes/routes.ts`.
5. **Listas paginadas:** use `components/data-tables/Pagination`.
6. Mantenha *loading/skeleton* e estado vazio como nos módulos existentes.
7. Valide: `npx tsc --noEmit`, `npm run lint` (**0 avisos**) e `npm test`.

---

## 5. Qualidade do código

- **Lint em 0 erros e 0 avisos.** Corrija a causa; só use `// eslint-disable-next-line <regra> -- <motivo>` quando o `useEffect` for mesmo a forma correta de sincronizar com algo externo.
- O `next build` **não** roda o lint: rode `npm run lint` (o CI roda).

**Padrões de estado** (no lugar de `useEffect` com `setState`)

| Situação | Use |
|---|---|
| estado que acompanha uma prop ou dado do servidor | `useSyncedState` (`hooks/use-synced-state.ts`) |
| reiniciar estado quando um valor muda | ajuste durante a renderização, comparando com o valor anterior |
| tamanho da tela | `useSyncExternalStore` (`hooks/use-mobile.ts`) |
| valor de formulário exibido na tela | `useWatch`, não `watch()` |

**Regras de segurança ao programar** (a CSP bloqueia e o `e2e/csp.e2e.ts` falha se quebrar)

- Sem scripts inline, `eval` ou hosts externos de script, imagem e fonte.
- HTML de usuário sempre por `lib/sanitize-html.ts`.
- Nunca guarde token em cookie, corpo de resposta, log ou storage do navegador.

---

## 6. Comandos

| Comando | Para quê |
|---|---|
| `npm run dev` | desenvolvimento (Turbopack) |
| `npm run build` / `npm run start` | build e execução de produção |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | tipos |
| `npm test` | Vitest (`REDIS_URL=… npm test` inclui os testes com Redis real) |
| `npm run e2e` | Playwright (precisa de `npm run build` antes) |
| `npm run verificar:producao` | confere o ambiente de produção |

Variáveis de ambiente: [`frontend/README.md`](../frontend/README.md).
