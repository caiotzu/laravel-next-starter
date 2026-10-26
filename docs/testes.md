# Testes e qualidade

Estado verificado em **2026-10-18**. Contagens obtidas pelos relatórios do próprio Pest (JUnit) e do Vitest (JSON);
para conferir de novo, rode os comandos da seção "Como executar".

## Visão geral

| Camada | Ferramenta | Testes | Resultado |
|---|---|---|---|
| Backend | Pest 4 sobre PHPUnit, **PostgreSQL real** (banco `testing`) | **393** em 29 arquivos (1618 asserções) | verde |
| Frontend (unitário e de componentes) | Vitest 5 + Testing Library (jsdom) | **270** em 28 arquivos | verde |
| Frontend (ponta a ponta) | Playwright, Chromium real | **28** em 3 arquivos (os 2 de `responsivo.e2e.ts`, 375 px, verificados contra `next dev`; os 26 anteriores não foram reexecutados em 2026-10-25) | verde (local); no CI, ainda não bloqueante |
| Tipos | `npx tsc --noEmit` | — | sem erros |
| Lint | `npm run lint` (ESLint 9, flat config) | — | 8 erros `import/order` pré-existentes nos handlers `app/api/auth/**` (ver `IMPLEMENTATION_PLAN.md`, TEST-007); 0 avisos |
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
npm run e2e         # testes de ponta a ponta (exige `npm run build` antes; sobe o app e um backend simulado)
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

Configuração: `vitest.config.mts` (jsdom, alias `@/`) e `tests/setup.ts` (limpa o DOM e o storage a cada teste e define *stubs* para o que o jsdom não implementa e o Radix/`input-otp` exigem: `ResizeObserver`, `document.elementFromPoint` e as APIs de ponteiro/rolagem).

| Área | Arquivos (testes) |
|---|---|
| BFF de autenticação (cookie e token) | `api/auth-bff.test.ts` (24: login e 2FA, Admin e Private), `lib/auth-response.test.ts` (4) |
| Schemas Zod dos domínios críticos | `features/schemas.test.ts` (24: usuário, grupo, empresa, contato, endereço, onboarding; Admin e Private) |
| Services de domínio (proxy mockado) | `domains/services-crud.test.ts` (16: usuário, grupo, empresa), `services-bff.test.ts` (3), `banner-mappers.test.ts` (3), `constants.test.ts` (3) |
| Telas e formulários | `features/perfil-e-senha.test.tsx` (22: perfil e senha, Admin e Private), `features/two-factor-section.test.tsx` (10), `features/auditorias-filters.test.tsx` (10), `features/acesso-suporte-form-conceder.test.tsx` (7) |
| Componentes e hooks | `components/paginacao.test.tsx` (9), `components/nav-main.test.tsx` (8), `components/refatoracao-lint.test.tsx` (9: formulários de senha, `useIsMobile`, avatar, carrossel, skeleton), `components/react-query-provider.test.tsx` (3), `components/imagens.test.tsx` (4), `hooks/use-synced-state.test.ts` (5) |
| Proxy do BFF | `lib/proxy-guard.test.ts` (15), `proxy/middleware.test.ts` (10), `proxy/proxy-clients.test.ts` (8), `lib/client-ip.test.ts` (6), `lib/media-url.test.ts` (6), `lib/acesso-suporte-storage.test.ts` (6) |
| Banner | `banner/banner-provider.test.tsx` (9), `banner/banner-sessao-storage.test.ts` (4) |
| Utilitários e validações | `lib/utils.test.ts` (21), `validations/validations.test.ts` (11) |

### Convenções

- Services de domínio são testados **mockando o proxy** (`@/lib/proxy-admin` / `@/lib/proxy-private`), conferindo URL, método, corpo, serialização de filtros e o mapeamento para camelCase. O service Private de empresa **não** exporta cadastrar/excluir/ativar, e um teste garante isso.
- Teste de tela: simule os hooks de mutação/consulta (`vi.mock` + `vi.hoisted`), digite como o usuário (`userEvent`) e confira o que aparece. O estado local que acompanha uma prop (`useSyncedState`) é testado no componente real.
- Componentes do Radix (menus, tooltips, selects) abrem e fecham de forma assíncrona: use `waitFor`/`findBy*`, nunca assuma o estado logo após o clique.
- Teste que pode ter sido escrito "para passar": faça uma **mutação proposital** no código (e restaure) e confirme que o teste falha. Assim foram validados os testes desta seção.
- Erro de lint do React Compiler: corrija a causa. Só use `// eslint-disable-next-line <regra> -- <motivo>` quando o `useEffect` for a forma correta de sincronizar com um sistema externo (hoje há 10 exceções, todas justificadas no próprio código, mais 1 antiga de `<img>` em `AnexoChip.tsx`).

### Ponta a ponta (E2E, Playwright)

Navegador **real** (Chromium) contra o app Next de **produção** (`next start`) e um **backend simulado** (`e2e/mock-backend.mjs`, um servidor Node sem dependências que responde como o Laravel nos fluxos de login e 2FA). Não precisam de Laravel nem de banco; por isso testam o frontend e o BFF, **não** a API real.

| Arquivo | Testes | O que cobre |
|---|---|---|
| `e2e/autenticacao.e2e.ts` | 9 | login válido (cookie `httpOnly`, `SameSite=Lax`, **JWT fora do corpo da resposta**), credenciais inválidas, 2FA (só o `temp_token` chega ao navegador e o cookie só nasce após o código), código errado, e usuário Admin recusado no login Private (e vice-versa) |
| `e2e/sessao-e-rotas.e2e.ts` | 17 | rotas protegidas sem sessão, sessão expirada, sessão válida na tela de login, telas públicas, logout (menu **Sair**), cookies separados Admin × Private, cabeçalhos de segurança (`X-Frame-Options`, CSP `frame-ancestors`, `nosniff`, sem `X-Powered-By`) e recusa de origem diferente (CSRF) |

Como rodar: `npm run build` e depois `npm run e2e` (a configuração em `playwright.config.ts` sobe os dois servidores nas portas 3100 e 4010). A primeira vez, `npx playwright install chromium`. Sem acesso ao download do Playwright, defina `PW_CHROMIUM_PATH` (e opcionalmente `PW_CHROMIUM_ARGS`) apontando para um Chromium instalado. Falhas geram *trace* em `frontend/test-results/` (`npx playwright show-trace <arquivo>`).

**Validação:** os 9 testes de autenticação foram executados contra um build com os handlers **antigos** (antes da SEC-007) e **6 falharam**: o JWT aparecia no corpo da resposta e o cookie de sessão era gravado vazio na etapa do 2FA. Contra o código corrigido, os 26 passam.

## CI

`.github/workflows/ci.yml` roda em `push` na `main` e em `pull_request`: backend (Pest com PostgreSQL 17), frontend (`tsc`, `npm run lint`, Vitest), `npm run build` e os testes E2E (este último ainda **não bloqueante**: passou localmente, mas não rodou nos servidores do GitHub). Os audits (`composer audit`, `npm audit`) só bloqueiam severidade **alta ou crítica**; o relatório completo roda sem bloquear. Detalhes: `PROJECT_GUIDE.md` §16.

## Lacunas conhecidas

- O E2E usa um **backend simulado**: ele valida o frontend e o BFF, mas **não** a integração com a API Laravel real (contrato dos endpoints, banco, permissões). Um E2E de pilha completa (Laravel + PostgreSQL + frontend) continua sem existir.
- O E2E cobre autenticação, sessão e proteção de rotas; as telas de negócio (usuários, empresas, chamados...) não têm fluxo E2E.
- Não há medição de cobertura de código (*coverage*).
- Formulários sem teste de renderização: `UsuarioFormCreate`/`Edit`, `EmpresaFormCreate`/`Edit`, `EmpresaContatosTab`, `MensagemFormCreate`, `BannerForm` e `UsuarioCard` (têm teste de schema e de service); `chart-area-interactive` também não tem.
- Mensagens genéricas do Zod em inglês ("Invalid input: expected string, received undefined") podem aparecer quando um campo sem valor padrão é enviado vazio; o caso do formulário de concessão de Acesso de Suporte foi corrigido, os demais precisam de verificação formulário a formulário (FRONT-005).
- Segurança: a suíte comprova controles implementados; **não substitui** um pentest independente (ver [`seguranca.md`](./seguranca.md)).

## Histórico resumido

Em 2026-10-01 a suíte do backend tinha 153 testes (14 falhavam, depois corrigidos), o frontend não tinha testes e não havia CI.
Desde então: 357 testes de backend na auditoria de 2026-10-14, 393 hoje; frontend de 0 para 260 testes unitários e 26 de ponta a ponta; CI criado e verde.
