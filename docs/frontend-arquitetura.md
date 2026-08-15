# Frontend — estrutura e padrões

## `domains/` + `features/`

O padrão `domains/{contexto}/{recurso}` + `features/{contexto}/{recurso}` se repete para cada recurso de negócio (usuário, empresa, grupo, grupo-empresa, permissão, mensagem, auditoria, perfil, lookup), tanto em `admin` quanto em `private`:

```text
domains/{contexto}/{recurso}/
├── types/      # Tipos TypeScript do recurso
├── services/   # Chamadas à API (via proxy)
├── hooks/      # Hooks de TanStack Query
└── mappers/    # Transformação entre payload da API e tipos do domínio

features/{contexto}/{recurso}/
├── components/  # Componentes de UI específicos da tela
└── schemas/     # Schemas Zod de formulário
```

Regra prática: **dados** (fetch, cache, transformação) ficam em `domains/`; **UI** (telas, formulários) fica em `features/`. Componentes verdadeiramente compartilhados entre features ficam em `components/`.

## `components/`

```text
components/
├── ui/             # Componentes shadcn/ui (estilo "new-york", ícones lucide-react)
├── layouts/        # Layouts e navegação
├── data-tables/    # Tabelas (TanStack Table)
├── forms/          # Componentes de formulário
├── feedback/       # Toasts, estados vazios, etc.
└── providers/      # React Query Provider, Theme Provider
```

Aliases configurados em `components.json`/`tsconfig.json`: `@/components`, `@/lib`, `@/hooks`, `@/ui`.

## Rotas e páginas

App Router com dois agrupamentos:

- `app/admin/**` — área administrativa (`/admin`, `/admin/dashboard`, `/admin/usuarios`, `/admin/grupos`, `/admin/grupos-empresas`, `/admin/empresas`, `/admin/mensagens`, `/admin/auditorias`, `/admin/perfil`, `/admin/(auth)/**`);
- `app/(private)/**` — área privada, usando um *route group* (`(private)`) para não afetar a URL — páginas ficam acessíveis a partir da raiz (`/`, `/dashboard`, `/usuarios`, `/grupos`, `/empresas`, `/perfil`, `/(auth)/**`).

Cada grupo tem seu próprio `layout.tsx` e pasta `providers/`. Rotas protegidas e mapeamento de cookie por rota ficam em `routes/routes.ts`, ordenado da mais específica para a mais genérica — consumido por `middleware.ts` (veja [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md#frontend)).

## Estado

Estado de servidor é gerenciado com **TanStack Query**, via hooks em `domains/{contexto}/{recurso}/hooks`. Não há store de estado global (Redux/Zustand); estado de UI local usa `useState`/`useReducer`.

## Estilização

Tailwind CSS 4, tema via variáveis CSS em `app/globals.css` (`baseColor: slate`, `cssVariables: true`). Tema claro/escuro via `next-themes` (`components/providers/theme-provider.tsx`).
