# Testes e qualidade

Estado verificado em **2026-10-17**. Contagens obtidas pelos relatórios do próprio Pest (JUnit) e do Vitest (JSON);
para conferir de novo, rode os comandos da seção "Como executar".

## Visão geral

| Camada | Ferramenta | Testes | Resultado |
|---|---|---|---|
| Backend | Pest 4 sobre PHPUnit, **PostgreSQL real** (banco `testing`) | **393** em 29 arquivos (1618 asserções) | verde |
| Frontend | Vitest 5 + Testing Library (jsdom) | **183** em 21 arquivos | verde |
| Tipos | `npx tsc --noEmit` | — | sem erros |
| Lint | `npm run lint` (ESLint 9, flat config) | — | **0 erros, 0 avisos** |
| CI | GitHub Actions (`.github/workflows/ci.yml`) | os mesmos comandos acima | verde no `main` |

## Como executar

```bash
# Backend (em backend/)
./vendor/bin/sail artisan test --compact           # tudo
./vendor/bin/sail artisan test --filter=GrupoTest  # só um arquivo/teste (comece pelo mais estreito)

# Frontend (em frontend/)
npm test            # Vitest, uma execução
npx tsc --noEmit    # tipos
npm run lint        # ESLint
npm run build       # build de produção (precisa de internet para o Google Fonts; ver PROJECT_GUIDE §12)
```

Sem Docker: PHP 8.3 + PostgreSQL local, `.env` com `DB_HOST=127.0.0.1`, `APP_KEY` e `JWT_SECRET` gerados e o banco `testing` criado
(detalhes em [`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md) §12). Se o `npm test` mostrar uma versão do Vitest diferente da do
`package-lock.json`, rode `npm ci`.

## Backend

**Feature** (`tests/Feature`, `RefreshDatabase`, banco real): exercitam rota → controller → service → banco.
Cada arquivo define seus próprios helpers de cenário (empresas, grupos, usuários e um JWT com sessão), então os testes não dependem uns dos outros.

| Área | Arquivos (testes) |
|---|---|
| Autenticação e sessão | `AuthFluxoTest` (36: login, 2FA, primeiro acesso, redefinição, refresh, logout, nos dois contextos) |
| Segurança | `SegurancaTest` (12: anti-enumeração, anti-replay do TOTP, sessões, anexos por link assinado, sanitização), `SwaggerTest` (5: CSP e credenciais) |
| Isolamento entre empresas | `EscopoEntidadeTest` (27), `RepositoriesTest` (15), `UsuarioEscopoTest` (14), `UsuarioTest` (12), `GrupoTest` (13) |
| Autorização por permissão | `EmpresaEnderecoAutorizacaoTest` (4: a permissão do **recurso certo** é exigida) |
| Acesso de Suporte | `AcessoSuporteTest` (25: concessão só a administrador **ativo**, expiração, revogação, auditoria, escopo) |
| Onboarding de empresa | `GrupoEmpresaOnboardingTest` (5) |
| Conteúdo | `BannerTest` (29), `ReleaseTest` (8), `ChamadoTest` (16), `MensagemBuscaUsuariosTest` (5), `DashboardTest` (5) |
| Arquivos | `ArmazenamentoDeArquivosTest` (17: drivers, disco privado, migração de anexos) |

**Unit** (`tests/Unit`): enums, DTOs, models, helpers, `HtmlSanitizer` (16), `FileStorage` (33: path traversal e afins), contextos, exceções.

**Guardas arquiteturais** (falham se a regra for quebrada):

- `RepositoriesEscopoTest`: todo método público dos repositories recebe o escopo (exceto a lista revisada `METODOS_SEM_ESCOPO`), o filtro vive em um único método privado, e os services listados não montam consultas de `Usuario`/`Grupo` nem leem o usuário autenticado.
- `PermissoesAuthorizeTest`: toda chave usada em `->authorize('x')` existe nos seeders de permissão. **Limite:** não detecta uma chave que existe mas é a errada para a ação; para isso há testes de comportamento por rota (`EmpresaEnderecoAutorizacaoTest`).

### Convenções

- Dado com dono ⇒ sempre um caso **cross-tenant** (A não vê nem altera B) e a resposta de erro não pode distinguir "existe em outra empresa" de "não existe".
- Antes de refatorar código sem cobertura, escreva um **teste de caracterização** e veja-o passar; depois da mudança ele deve continuar verde.
- Teste novo de regra de segurança: veja-o **falhar** sem a correção (ou faça uma mutação proposital) antes de considerá-lo válido.
- Não dependa da ordenação do banco (a *collation* do PostgreSQL muda a ordem de strings); compare conjuntos quando a ordem não é o que está sendo testado.
- Estilo: `test('frase em português', …)`; Pint só em arquivos **novos** (decisão D-005 do plano).

## Frontend

Configuração: `vitest.config.mts` (jsdom, alias `@/`) e `tests/setup.ts` (limpa o DOM e o storage a cada teste e define um *stub* de `ResizeObserver`, que o jsdom não tem e o Radix exige).

| Área | Arquivos (testes) |
|---|---|
| Schemas Zod dos domínios críticos | `features/schemas.test.ts` (24: usuário, grupo, empresa, contato, endereço, onboarding; Admin e Private) |
| Services de domínio (proxy mockado) | `domains/services-crud.test.ts` (16: usuário, grupo, empresa), `services-bff.test.ts` (3), `banner-mappers.test.ts` (3), `constants.test.ts` (3) |
| BFF e proxy | `lib/proxy-guard.test.ts` (15), `proxy/middleware.test.ts` (10), `proxy/proxy-clients.test.ts` (8), `lib/client-ip.test.ts` (6), `lib/media-url.test.ts` (6), `lib/acesso-suporte-storage.test.ts` (6) |
| Banner | `banner/banner-provider.test.tsx` (9), `banner/banner-sessao-storage.test.ts` (4), `components/imagens.test.tsx` (4) |
| Componentes e hooks | `components/paginacao.test.tsx` (9), `components/nav-main.test.tsx` (8), `components/refatoracao-lint.test.tsx` (9), `components/react-query-provider.test.tsx` (3), `hooks/use-synced-state.test.ts` (5) |
| Utilitários e validações | `lib/utils.test.ts` (21), `validations/validations.test.ts` (11) |

### Convenções

- Services de domínio são testados **mockando o proxy** (`@/lib/proxy-admin` / `@/lib/proxy-private`), conferindo URL, método, corpo, serialização de filtros e o mapeamento para camelCase. O service Private de empresa **não** exporta cadastrar/excluir/ativar, e um teste garante isso.
- Componentes do Radix (menus, tooltips) abrem e fecham de forma assíncrona: use `waitFor`/`findBy*`, nunca assuma o estado logo após o clique.
- Erro de lint do React Compiler: corrija a causa. Só use `// eslint-disable-next-line <regra> -- <motivo>` quando o `useEffect` for a forma correta de sincronizar com um sistema externo (hoje há 10 exceções, todas justificadas no próprio código, mais 1 antiga de `<img>` em `AnexoChip.tsx`).

## CI

`.github/workflows/ci.yml` roda em `push` na `main` e em `pull_request`: backend (Pest com PostgreSQL 17), frontend (`tsc`, `npm run lint`, Vitest) e `npm run build`. Os audits (`composer audit`, `npm audit`) só bloqueiam severidade **alta ou crítica**; o relatório completo roda sem bloquear. Detalhes: `PROJECT_GUIDE.md` §16.

## Lacunas conhecidas

- Não há testes de ponta a ponta com navegador (E2E); a verificação visual é manual.
- Não há medição de cobertura de código (*coverage*).
- Componentes de formulário e telas de domínio têm testes de **schema** e de **service**, mas poucos testes de renderização (os formulários de senha, o carrossel, o menu lateral e a paginação têm).
- O modo `next dev` (import dinâmico do devtools) não é exercitado por teste automático.
- Segurança: a suíte comprova controles implementados; **não substitui** um pentest independente (ver [`seguranca.md`](./seguranca.md)).

## Histórico resumido

Em 2026-10-01 a suíte do backend tinha 153 testes (14 falhavam, depois corrigidos), o frontend não tinha testes e não havia CI.
Desde então: 357 testes de backend na auditoria de 2026-10-14, 393 hoje; frontend de 0 para 183; CI criado e verde.
