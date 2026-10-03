# Frontend — estrutura e padrões

## `domains/` + `features/`

O padrão `domains/{contexto}/{recurso}` + `features/{contexto}/{recurso}` se repete para cada recurso de negócio (usuário, empresa, grupo, grupo-empresa, permissão, mensagem, banner, chamado, release, acesso-suporte, perfil, lookup), tanto em `admin` quanto em `private` — exceto `auditoria`, `dashboard` e `usuario-grupo-empresa`, que só existem em `domains/admin` (não têm equivalente Private).

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

- `app/admin/**` — área administrativa (`/admin`, `/admin/home`, `/admin/dashboard`, `/admin/usuarios`, `/admin/grupos`, `/admin/grupos-empresas`, `/admin/empresas`, `/admin/mensagens`, `/admin/banners`, `/admin/chamados`, `/admin/releases`, `/admin/acessos-suporte`, `/admin/auditorias`, `/admin/perfil`, `/admin/(auth)/**`);
- `app/(private)/**` — área privada, usando um *route group* (`(private)`) para não afetar a URL — páginas ficam acessíveis a partir da raiz (`/`, `/home`, `/dashboard`, `/usuarios`, `/grupos`, `/empresas`, `/chamados`, `/releases`, `/acesso-suporte`, `/perfil`, `/(auth)/**`).

Cada grupo tem seu próprio `layout.tsx` e pasta `providers/`. Rotas protegidas e mapeamento de cookie por rota ficam em `routes/routes.ts`, ordenado da mais específica para a mais genérica — consumido por `proxy.ts` (veja [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md#frontend)).

## Estado

Estado de servidor é gerenciado com **TanStack Query**, via hooks em `domains/{contexto}/{recurso}/hooks`. Não há store de estado global (Redux/Zustand); estado de UI local usa `useState`/`useReducer`.

## Estilização

Tailwind CSS 4, tema via variáveis CSS em `app/globals.css` (`baseColor: slate`, `cssVariables: true`). Tema claro/escuro via `next-themes` (`components/providers/theme-provider.tsx`).

## Bibliotecas relevantes (confirmadas em `package.json`)

| Necessidade | Biblioteca |
|---|---|
| Framework | Next.js 16.3.7 (App Router, Turbopack), React 19.1 |
| Dados/cache de servidor | TanStack Query 5, TanStack Table 8 |
| Formulários e validação | React Hook Form + Zod 4 (`@hookform/resolvers`) |
| UI | Tailwind CSS 4, shadcn/ui (Radix UI, `@base-ui/react`), lucide-react, Tabler Icons, sonner, vaul |
| Editor rich text | Tiptap 3 (starter-kit, link, placeholder) — conteúdo exibido é sanitizado com DOMPurify |
| Gráficos | Recharts 2 (dashboard Admin) |
| Tabelas com arrastar-e-soltar | dnd-kit (`components/data-table.tsx`) |
| 2FA | `react-qr-code`, `input-otp` |
| HTTP no BFF | axios; `jsonwebtoken` só para decodificar/verificar expiração no `proxy.ts` |

## Tamanho do frontend

65 páginas (`page.tsx`): 40 na área Admin e 25 na Private; 18 *route handlers* do BFF (16 de autenticação e 2 de proxy); ~50 mil linhas de TypeScript/TSX.

## Next.js 16 (atualização de 2026-09-30)

O frontend foi atualizado do Next.js 15.5.6 para o **16.3.7** (`next` e `eslint-config-next` fixados em `16.3.7`), principalmente para eliminar as vulnerabilidades críticas da 15.5.6 (ver [`pentest-avaliacao-seguranca.md`](./pentest-avaliacao-seguranca.md), achado F-01). A estrutura de pastas, as rotas e o BFF **não mudaram**: a tabela de 84 rotas geradas pelo `next build` e o comportamento em runtime (middleware, validação de origem, guarda do proxy e cabeçalhos de segurança) foram idênticos entre 15.5.6 e 16.3.7 nos testes descritos em [`pentest/evidencias/06_upgrade_next16_validacao.md`](./pentest/evidencias/06_upgrade_next16_validacao.md).

O que mudou por causa da atualização:

- **Node.js ≥ 20.9** passa a ser exigido pelo Next.js 16 (o `.nvmrc`/imagem de CI/deploy deve refletir isso);
- **`middleware.ts` foi migrado para `proxy.ts`** (convenção do Next 16) com o codemod oficial `npx @next/codemod@canary middleware-to-proxy .` em 2026-10-01; o aviso de depreciação deixou de aparecer. A lógica e o `matcher` não mudaram e o smoke test HTTP deu o mesmo resultado. **O arquivo antigo `frontend/middleware.ts` deve ser removido** (com os dois presentes o Next acusa erro);
- **ESLint**: o `eslint-config-next@16` é *flat config* nativo; o `eslint.config.mjs` deixou de usar `FlatCompat` e importa `eslint-config-next/core-web-vitals` e `eslint-config-next/typescript`. Todas as regras `import/order` do projeto foram mantidas. As novas regras do React Compiler (`react-hooks/set-state-in-effect`, `react-hooks/purity`, `react-hooks/static-components`) foram mantidas como **aviso** para não mudar o resultado do `npm run lint`;
- **`tsconfig.json`**: `jsx` passou de `preserve` para `react-jsx` e `.next/dev/types/**/*.ts` entrou em `include` (o Next 16 faz essas duas mudanças automaticamente);
- O `next build` do Next 16 **não executa mais o lint**; use `npm run lint` separadamente.

### Correções mínimas para o build de produção (pré-existentes)

Ao validar o build, foram encontrados dois bloqueios que já existiam na 15.5.6 (o `next build` falhava também nela) e que foram corrigidos de forma mecânica:

1. seis páginas usavam `useSearchParams()` sem `<Suspense>` (login Admin/Private, primeiro acesso e redefinir senha, das duas áreas) — cada página agora renderiza o mesmo conteúdo dentro de um `<Suspense fallback={null}>`;
2. erro de tipo em `app/admin/providers/acesso-suporte-provider.tsx` (perda de *narrowing* dentro de um *closure*) — o valor `expiraEm` é lido antes do closure.

**Pendência não relacionada à atualização:** existem 18 erros de `import/order` reportados por `npm run lint` desde antes (corrigíveis com `npx eslint . --fix`); com o Next 16 eles deixam de bloquear o `next build`.
