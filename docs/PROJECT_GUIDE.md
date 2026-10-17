# Guia técnico do projeto

Mapa para trabalhar no repositório **sem releitura global**. Complementa (não substitui) os docs temáticos:
[`arquitetura.md`](./arquitetura.md), [`repositories.md`](./repositories.md), [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md),
[`frontend-arquitetura.md`](./frontend-arquitetura.md), [`testes.md`](./testes.md), [`seguranca.md`](./seguranca.md).
Estado e próximas tarefas: [`IMPLEMENTATION_PLAN.md`](./IMPLEMENTATION_PLAN.md). Regras para o agente: [`../CLAUDE.md`](../CLAUDE.md).

> Tudo abaixo foi conferido no código em 2026-10-14. Divergiu? O código vence — corrija este arquivo.

## 1. Visão geral

Starter full stack: API Laravel (JWT + permissões) e front Next.js atuando como BFF. Domínios de referência: usuários, grupos/permissões, empresas (+ contatos/endereços), grupos-empresa (onboarding de clientes), mensagens, banners, chamados (com anexos), releases, Acesso de Suporte (impersonação temporária e auditável), dashboard e auditoria. Dois contextos espelhados em back e front: **Admin** (interno) e **Private** (cliente, escopado por empresa).

## 2. Stack e versões

| Item | Versão (fonte) |
|---|---|
| PHP | `^8.3` (`composer.json`); Sail roda 8.4 |
| Laravel | 13.x (instalado: 13.34.0) |
| Banco | PostgreSQL 17 (Sail); testes usam o banco `testing` |
| Auth | `tymon/jwt-auth` 2.x, Google2FA, `sanctum` instalado |
| Testes back | Pest 4 + `pest-plugin-laravel`; Pint 1.x; Boost 2.x |
| Next.js / React | 16.3.8 / 19.1.0 (`package.json`) |
| UI | Tailwind 4, shadcn/ui (Radix + `@base-ui/react`), lucide, Tiptap |
| Dados/form | TanStack Query 5 / Table 8, React Hook Form 7, Zod 4 |
| Testes front | Vitest 5 + Testing Library (jsdom); Node ≥ 22.22.2 |

## 3. Estrutura relevante

```text
backend/app/
  AcessoSuporte/   contexto de suporte (singleton por requisição)   Auditoria/  trait Auditavel + contexto
  Contracts/       interfaces de integrações externas (Cep, Email, Storage)
  DTO/{Recurso}/   um DTO por caso de uso                           Enums/ Events/ Listeners/ Jobs/
  Http/{Controllers,Requests,Resources}/{Admin,Private,Global,Lookup}/
  Http/Middleware/ jwt, audiencia, suporte.contexto, security.headers, swagger.admin.auth
  Models/  OpenApi/  Providers/  Repositories/ (Grupo, Usuario)  Services/ (+External, +Storage)  Support/
backend/tests/{Feature,Unit}   backend/routes/{api,console,web}.php
frontend/app/{admin,(private)}/**        páginas        frontend/app/api/{auth,proxy}/**   BFF
frontend/domains/{admin,private}/{recurso}/{types,services,hooks,mappers}
frontend/features/{admin,private}/{recurso}/{components,schemas}
frontend/{components,hooks,lib,constants,types,routes}   frontend/proxy.ts   frontend/tests/**
```

## 4. Fluxo de uma requisição (backend)

`routes/api.php` (grupos por prefixo `admin`/raiz, middlewares `throttle`, `jwt`, `audiencia`, `suporte.contexto`) → Controller (`$this->authorize('chave')`) → Form Request → DTO → Service → Repository (se houver) → Model → Resource.
Erros viram JSON em `bootstrap/app.php`: validação → 422 `{errors}`; sem permissão → 403; `ModelNotFoundException` → 404; `BusinessException` → 400 `{errors.business: [msg]}`.

## 5. Front ↔ back

Navegador → `lib/proxy-admin.ts`/`proxy-private.ts` (axios `POST /api/proxy/{admin|private}` com `{url, method, data, headers}`) → `app/api/proxy/*/route.ts` (valida origem, resolve destino via `lib/proxy-guard.ts`, injeta `Authorization: Bearer` do cookie `httpOnly`) → `BACKEND_URL` (Laravel). Os proxies também normalizam URLs absolutas de `/storage` para relativas (`lib/media-url.ts`); `next.config.ts` faz o rewrite `/storage/*` → backend. `proxy.ts` protege navegação por cookie usando `routes/routes.ts`. Header `X-Acesso-Suporte-Id` só é enviado pelos proxies em modo de suporte.

## 6. Convenções de nomenclatura

| Elemento | Padrão | Exemplo real |
|---|---|---|
| Domínio | português | `GrupoEmpresa`, `AcessoSuporte` |
| Controller | `Http/Controllers/{Admin\|Private\|Global\|Lookup}/{Recurso}Controller` | `Admin/GrupoEmpresaController` |
| Form Request | `Http/Requests/{Contexto}/{Recurso}/{Verbo}Request` | `Admin/GrupoEmpresa/CadastrarRequest` (`Listar`, `Atualizar`…) |
| DTO | `DTO/{Recurso}/{Recurso}{CasoDeUso}DTO` | `GrupoEmpresaCadastroDTO::criarParaCadastro()` |
| Resource | `Http/Resources/{Contexto}/{Recurso}/…Resource` | `Admin/GrupoEmpresa/GrupoEmpresaResource` |
| Service / Repository | `{Recurso}Service` / `{Recurso}Repository` | `GrupoService`, `GrupoRepository` |
| Método de Repository | `{verbo}{Qualificador}NoEscopo` | `buscarComPermissoesNoEscopo` |
| Permissão | `{admin\|private}.{recurso}.{acao}` | `admin.grupo_empresa.cadastrar` |
| Front: arquivos | `{recurso}Service.ts`, `use{Recurso}(s).ts`, `{recurso}.{model\|requests\|responses}.ts`, `{recurso}.mapper.ts`, `{recurso}.schema.ts`, componentes `PascalCase.tsx` | `grupoService.ts`, `useGrupo.ts` |

## 7. Responsabilidade das camadas

Tabela em [`../CLAUDE.md`](../CLAUDE.md#arquitetura-aprovada). Regra de ouro: **a mesma regra de negócio vive em um lugar** (Service). Validação de formato no Request; autorização no Controller; persistência/consulta em Repository ou Model.

## 8. Padrão oficial de repositories

Resumo; completo em [`repositories.md`](./repositories.md).
Concretos, sem interface, sem base class. Existem `GrupoRepository` e `UsuarioRepository` porque Usuario/Grupo têm **dono** (tenant) e eram consultados em ~12 pontos. Leitura exige `EscopoEntidade`; filtro único em `noEscopo()`; exceções em `METODOS_SEM_ESCOPO` (testado). Consumidores atuais: `GrupoService`, `UsuarioService`, `GrupoEmpresaService::cadastrar`, `AcessoSuporteService`/`ConcederRequest` (admin) e `MensagemService` (busca global de destinatários).

```php
// GrupoEmpresaService::cadastrar — onboarding: o escopo é o da NOVA empresa, montado explicitamente
$grupo = $this->grupos->criarNoEscopo(new EscopoEntidade($entidadeTipo->id, $grupoEmpresa->id), 'Administrador');
$usuario = $this->usuarios->criarNoGrupo($grupo, [/* nome, email, senha => null, status */]);
```

## 9. Nova funcionalidade no backend

1. Leia a skill `laravel-best-practices` (índice → regras da tarefa) e o módulo irmão mais parecido.
2. Migration (+ factory/seeder se for Model novo, conforme `AGENTS.md`) → Model.
3. Form Requests por verbo → DTO(s) → Service (transação, evento, `BusinessException` + `ErrorCode`).
4. Repository **só** se atender aos 4 critérios de `repositories.md`; senão Eloquent no Service (como `EmpresaService`, com `EscopoEntidadeService::aplicar()` em **todo** método que busca por id). A chave de `authorize()` deve ser a do **próprio recurso e ação** (ex.: endereço → `*.empresa.endereco.*`).
5. Resource(s), Controller com `authorize('chave')` + atributos OpenAPI, rotas em `routes/api.php`.
6. Permissão nova: `database/seeders/AdminPermissaoSeeder.php` ou `PrivatePermissaoSeeder.php` + ver `autenticacao-e-autorizacao.md`.
7. Testes Pest (item 11) e `docs/` afetadas.

## 10. Nova funcionalidade no frontend

1. Siga `domains/{ctx}/grupo` + `features/{ctx}/grupo` como molde. Tipos em `types/`, chamadas em `services/` via `proxyAdminRequest`/`proxyPrivateRequest` (nunca `fetch` direto ao Laravel), conversão em `mappers/`, hooks TanStack em `hooks/` (`"use client"`).
2. Formulário: schema Zod em `features/.../schemas` + React Hook Form; erros do backend (`ApiErrorResponse`) exibidos ao usuário.
3. Páginas em `app/admin/**` ou `app/(private)/**`; rota protegida em `routes/routes.ts`.
4. Listas paginadas usam `components/data-tables/Pagination` (sempre mostra primeira e última página; props `currentPage`, `lastPage`, `total`, `from`, `to`, `onPageChange`). Componente só vai para `components/` se for reutilizado de fato. Mantenha loading/skeleton e estado vazio como nos módulos existentes.
5. Valide: `npx tsc --noEmit`, `npm run lint`, `npm test`. Para runtime, skill `next-dev-loop`.

## 11. Testes

- **Backend (Pest, banco real `testing`, `RefreshDatabase`)**: `tests/Feature/{Dominio}Test.php` exercita rota→banco; cada arquivo define helpers de cenário próprios (`cenarioGr()`, `tokenGr()`…) criando `EntidadeTipo`, empresas, grupos, usuários e um JWT com sessão. Estilo local: `test('frase em português', fn …)`. `tests/Unit` = enums, DTOs, helpers e **guardas arquiteturais** (`RepositoriesEscopoTest`).
- Dado com dono ⇒ sempre incluir caso cross-tenant (A não vê/altera B) **e** verificar que a resposta de erro não revela se o dado de B existe (mesmo status/mensagem com e sem dado). Escreva **teste de caracterização antes** de refatorar.
- **Frontend (Vitest)**: `tests/{lib,proxy,domains,components,banner,validations}`; alias `@/`.

## 12. Comandos (verificados nesta sessão)

| Onde | Comando | Observação |
|---|---|---|
| backend | `./vendor/bin/sail artisan test --compact` · `./vendor/bin/pest` | baseline atual: **391 verdes** (1615 asserções) |
| backend | `pint <arquivo-novo.php>` | não rodar `--dirty` em legado (ver `CLAUDE.md`) |
| frontend | `npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run build` | baseline: 118 testes (15 arquivos), tsc limpo, `npm run lint` 0 erros / 70 avisos |

Execução fora do Sail (ex.: ambiente sem Docker): PHP 8.3 + PostgreSQL local, `.env` com `DB_HOST=127.0.0.1`, `APP_KEY` e `JWT_SECRET` gerados (`artisan key:generate --force`, `artisan jwt:secret --force`) e banco `testing` criado.

## 13. Skills

Localização e quando usar: tabela em [`../CLAUDE.md`](../CLAUDE.md#skills-leia-o-skillmd-e-os-arquivos-rules-que-o-índice-mapear-para-a-tarefa). Backend: `backend/.claude/skills` (duplicado em `.agents` e `.cursor`, idêntico). Frontend: `frontend/.agents/skills` (+ symlinks em `.claude/skills`); `frontend/skills-lock.json` fixa a origem (`vercel/next.js`).

## 14. Decisões arquiteturais relevantes

| Decisão | Motivo | Onde |
|---|---|---|
| Repository só para dados com dono, sem interface/base | Eloquent não será trocado; testes usam banco real | `repositories.md` |
| `EscopoEntidade` obrigatório nas leituras | impossível esquecer o filtro de empresa | `repositories.md` |
| Identidade (`Auth::user`) ≠ contexto (`EscopoEntidadeService::atual`) | modo de suporte | `repositories.md` |
| Front como BFF + JWT em cookie `httpOnly` | token inacessível a JS | `arquitetura.md`, `seguranca.md` |
| Um DTO por caso de uso | normaliza entrada; evita arrays soltos | `app/DTO` |
| Integrações atrás de `Contracts/` | troca por config | `app/Contracts` |
| Pint não aplicado ao legado | evitar diff gigante | `CLAUDE.md` |

## 15. Limitações conhecidas e pendências

Lista viva em `IMPLEMENTATION_PLAN.md` (seção D). Principais: CI criado mas ainda sem 1ª execução real no GitHub (CI-002); sem teste do frontend para a maioria dos domínios; Pint não aplicado ao legado; docs históricas (`testes.md`, `arquitetura.md`) com contagens desatualizadas; `docs/pentest-avaliacao-seguranca.md` e `docs/pentest/` são citados por `seguranca.md`/`frontend-arquitetura.md`, mas **não existem** em `docs/` neste checkout.

## 16. CI (GitHub Actions)

`.github/workflows/ci.yml`, em `push` na `main` e em `pull_request`: **backend** (PHP 8.3, PostgreSQL 17, `vendor/bin/pest`), **frontend** (`tsc`, `npm run lint`, `npm test`) e **frontend-build** (informativo). Audits: só severidade **alta/crítica** em dependências de produção bloqueia (`composer audit --ignore-severity=low --ignore-severity=medium`, `npm audit --omit=dev --audit-level=high`); o relatório completo roda em passo que não bloqueia. Antes de abrir PR, rode localmente os mesmos comandos da tabela do §12. Estado: simulado localmente, ainda não executado no GitHub (CI-002).
