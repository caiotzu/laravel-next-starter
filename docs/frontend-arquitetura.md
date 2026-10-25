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
| Framework | Next.js 16.3.8 (App Router, Turbopack), React 19.1 |
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

O frontend foi atualizado do Next.js 15.5.6 para o **16.3.7** e hoje está na **16.3.8** (`next` e `eslint-config-next` fixados na mesma versão), principalmente para eliminar as vulnerabilidades críticas da 15.5.6 (achado F-01 da avaliação de segurança de 2026-09-29; o relatório foi removido do repositório, ver [`seguranca.md`](./seguranca.md)). A estrutura de pastas, as rotas e o BFF **não mudaram**: o comportamento em runtime (proxy, validação de origem, guarda do proxy e cabeçalhos de segurança) foi idêntico entre 15.5.6 e 16.3.7 nos testes feitos na época.

O que mudou por causa da atualização:

- **Node.js**: o Next.js 16 exige Node ≥ 20.9; este projeto fixa `engines.node >= 22.22.2` no `package.json` e o CI usa Node 22;
- **`middleware.ts` foi migrado para `proxy.ts`** (convenção do Next 16) com o codemod oficial; a lógica e o `matcher` não mudaram e o arquivo antigo já foi removido;
- **ESLint**: o `eslint-config-next@16` é *flat config* nativo; o `eslint.config.mjs` importa `eslint-config-next/core-web-vitals` e `eslint-config-next/typescript` e mantém as regras `import/order` do projeto. As regras do React Compiler (`react-hooks/set-state-in-effect`, `react-hooks/purity`, `react-hooks/static-components`, `react-hooks/incompatible-library`) ficam como **aviso**, e hoje o projeto está com **0 avisos** (ver "Qualidade do código" abaixo);
- **`tsconfig.json`**: `jsx` passou de `preserve` para `react-jsx` e `.next/dev/types/**/*.ts` entrou em `include`;
- O `next build` do Next 16 **não executa mais o lint**; use `npm run lint` separadamente (o CI faz isso).

### Correções mínimas para o build de produção (pré-existentes)

Ao validar o build, foram encontrados dois bloqueios que já existiam na 15.5.6 e foram corrigidos de forma mecânica:

1. seis páginas usavam `useSearchParams()` sem `<Suspense>` (login Admin/Private, primeiro acesso e redefinir senha, das duas áreas) — cada página agora renderiza o mesmo conteúdo dentro de um `<Suspense fallback={null}>`;
2. erro de tipo em `app/admin/providers/acesso-suporte-provider.tsx` (perda de *narrowing* dentro de um *closure*) — o valor `expiraEm` é lido antes do closure.

## Qualidade do código

Comandos (em `frontend/`): `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. O CI roda os quatro. Estado em 2026-10-17: lint com **0 erros e 0 avisos**, 183 testes.

**Política de lint.** Corrija a causa do aviso. A exceção é pontual e sempre explicada, no formato `// eslint-disable-next-line <regra> -- <motivo>`; hoje existem 10 dessas (regras do React Compiler e de navegação), todas onde o `useEffect` é a forma correta de sincronizar com um sistema externo ou onde a navegação completa é intencional, mais 1 antiga em `components/upload/AnexoChip.tsx` (`<img>` para pré-visualização de anexo):

- `banner-provider` (Admin e Private): sincroniza com um sinal de uso único no `sessionStorage` e precisa limpar o cache **antes** de habilitar a consulta;
- `acesso-suporte-provider` (Admin) e `acesso-suporte-bootstrap` (Private): leem o `sessionStorage` (a leitura tem efeito colateral) e inicializam a partir da URL; o redirecionamento ao expirar é uma **navegação completa** de propósito, para descartar o cache do TanStack Query da área do cliente;
- `proxy-admin.ts`: navegação completa após `401`, em módulo fora de React;
- `components/data-table.tsx`: o TanStack Table é incompatível com o React Compiler por design (o componente usa `"use no memo"`).

**Padrões de estado adotados** (no lugar de `useEffect` com `setState`):

- estado que acompanha uma prop ou dado do servidor: hook `useSyncedState` (`hooks/use-synced-state.ts`), usado nos avatares e no 2FA;
- reiniciar estado quando um valor muda (carrossel de banners, menu lateral): ajuste **durante a renderização**, comparando com o valor anterior;
- tamanho da tela: `useSyncExternalStore` (`hooks/use-mobile.ts`);
- valores de formulário que a tela precisa exibir: `useWatch({ control, name })` do React Hook Form, em vez de `watch()`; para ler os valores no envio, `getValues()`.

**Paginação.** Listas paginadas usam `components/data-tables/Pagination` (props `currentPage`, `lastPage`, `total`, `from`, `to`, `onPageChange`): a barra mostra sempre a primeira e a última página e uma janela ao redor da atual (`1 … 9 10 11 … 20`), então não é preciso avançar de página em página.

**Ambiente de testes.** `tests/setup.ts` limpa o DOM e o storage a cada teste e define um *stub* de `ResizeObserver` (o jsdom não o tem e o Radix o exige). Detalhes e lacunas em [`testes.md`](./testes.md).

**Autenticação no BFF.** Os handlers `app/api/auth/{admin,private}/{login,2fa}` guardam o JWT da sessão **somente** no cookie `httpOnly` (`SameSite=Lax`, `Secure` em produção, 1 hora) e devolvem ao navegador o restante da resposta do backend, sem o `token` (`lib/auth-response.ts`). O `temp_token` da etapa do 2FA continua indo ao navegador, porque a tela o reenvia ao confirmar o código. No login com 2FA o cookie de sessão não é tocado. O servidor não anuncia `X-Powered-By` (`poweredByHeader: false`).

**Testes de ponta a ponta.** `playwright.config.ts` + `e2e/`: navegador real (Chromium) contra o app de produção e um backend simulado (`e2e/mock-backend.mjs`). Cobrem autenticação, sessão, proteção de rotas, logout e cabeçalhos de segurança. `npm run build && npm run e2e`. Os arquivos terminam em `.e2e.ts` para o Vitest não os capturar. Detalhes em [`testes.md`](./testes.md).
