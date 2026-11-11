# Testes e qualidade

Para a contagem atual, rode os comandos da seção "Como executar". Este documento descreve **o que cada suíte cobre** e como escrever testes novos.

## Visão geral

| Camada | Ferramenta | Observação |
|---|---|---|
| Backend | Pest 4 sobre PHPUnit, **PostgreSQL real** (banco `testing`) | `Feature` (rota → banco) e `Unit` (enums, DTOs, helpers, guardas arquiteturais) |
| Frontend (unitário e componentes) | Vitest 5 + Testing Library (jsdom) | `tests/session/redis-real.test.ts` só roda com `REDIS_URL` definida |
| Frontend (ponta a ponta) | Playwright, Chromium real | contra `next start` de produção, backend simulado e **Redis real** |
| Tipos | `npx tsc --noEmit` | sem erros |
| Lint | `npm run lint` (ESLint 9, flat config) | 0 erros e 0 avisos |

Os testes validam **comportamento do código**. Nenhum deles lê arquivos de documentação (`docs/`, README).

## Como executar

```bash
# Backend (em backend/, com o Sail rodando)
./vendor/bin/sail artisan test --compact           # tudo
./vendor/bin/sail artisan test --filter=GrupoTest  # só um arquivo/teste (comece pelo mais estreito)

# Frontend (em frontend/)
npm test            # Vitest, uma execução
npx tsc --noEmit    # tipos
npm run lint        # ESLint
npm run build       # build de produção (precisa de internet para o Google Fonts)
npm run e2e         # ponta a ponta (exige `npm run build` antes; sobe o app e um backend simulado)

# Vitest com o teste de Redis real
REDIS_URL=redis://127.0.0.1:6379 npm test
```

O banco `testing` é criado pelo Sail (`create-testing-database.sql`, montado no serviço `pgsql`). Sem Docker, é preciso PHP 8.5 com as extensões do projeto, PostgreSQL local, `.env` com `DB_HOST=127.0.0.1`, `APP_KEY` e `JWT_SECRET` gerados e o banco `testing` criado. Se o `npm test` usar uma versão do Vitest diferente da do `package-lock.json`, rode `npm ci`.

## Backend

**Feature** (`tests/Feature`, banco real): cada arquivo define seus próprios helpers de cenário (empresas, grupos, usuários e um JWT com sessão), então os testes não dependem uns dos outros.

| Área | Arquivos |
|---|---|
| Autenticação e sessão | `AuthFluxoTest` (login, 2FA, primeiro acesso, redefinição, refresh, logout, nos dois contextos) |
| Segurança | `SegurancaTest` (anti-enumeração, anti-replay do TOTP, sessões, anexos por link assinado, sanitização), `SwaggerTest` (CSP e credenciais), `AvaliacaoSegurancaTest` (lookup de administradores, exceções em produção, teto de base64, limites de 2FA e de login) |
| Isolamento entre empresas | `EscopoEntidadeTest`, `RepositoriesTest`, `UsuarioEscopoTest`, `UsuarioTest`, `GrupoTest` |
| Autorização por permissão | `EmpresaEnderecoAutorizacaoTest` (a permissão do **recurso certo** é exigida) |
| Acesso de Suporte | `AcessoSuporteTest` (concessão só a administrador **ativo**, expiração, revogação, auditoria, escopo) |
| Onboarding de empresa | `GrupoEmpresaOnboardingTest` |
| Conteúdo | `BannerTest`, `ReleaseTest`, `ChamadoTest`, `MensagemBuscaUsuariosTest`, `DashboardTest` |
| Arquivos | `ArmazenamentoDeArquivosTest` (drivers, disco privado, migração de anexos) |
| Produção | `ProducaoComandosTest` (`producao:verificar`, `admin:criar-inicial`), `ProxiesConfiaveisTest` (`TRUSTED_PROXIES`) |

**Unit** (`tests/Unit`): enums, DTOs, models, helpers, `HtmlSanitizer`, `FileStorage` (path traversal e afins), contextos, exceções.

**Guardas arquiteturais** (falham se a regra for quebrada):

- `RepositoriesEscopoTest`: todo método público dos repositories recebe o escopo (exceto a lista revisada `METODOS_SEM_ESCOPO`), o filtro vive em um único método privado, e os services listados não montam consultas de `Usuario`/`Grupo` nem leem o usuário autenticado.
- `PermissoesAuthorizeTest`: toda chave usada em `->authorize('x')` existe nos seeders de permissão. **Limite:** não detecta uma chave que existe mas é a errada para a ação; para isso há testes de comportamento por rota (`EmpresaEnderecoAutorizacaoTest`).

### Convenções

- Dado com dono ⇒ sempre um caso **cross-tenant** (A não vê nem altera B), e a resposta de erro não pode distinguir "existe em outra empresa" de "não existe".
- Antes de refatorar código sem cobertura, escreva um **teste de caracterização** e veja-o passar; depois da mudança ele deve continuar verde.
- Teste novo de regra de segurança: veja-o **falhar** sem a correção (ou faça uma mutação proposital) antes de considerá-lo válido.
- Não dependa da ordenação do banco (a *collation* do PostgreSQL muda a ordem de strings); compare conjuntos quando a ordem não é o que está sendo testado.
- Estilo: `test('frase em português', …)`; Pint só em arquivos **novos**.

## Frontend

Configuração: `vitest.config.mts` (jsdom, alias `@/`) e `tests/setup.ts` (limpa o DOM e o storage a cada teste e define *stubs* para o que o jsdom não implementa e o Radix/`input-otp` exigem: `ResizeObserver`, `document.elementFromPoint` e as APIs de ponteiro/rolagem).

| Área | Pasta / arquivos |
|---|---|
| BFF de autenticação e sessão | `tests/api` (login e 2FA, logout, proxy com sessão), `tests/session` (store, Redis real, `/api/health`), `tests/proxy`, `tests/lib/proxy-guard.test.ts`, `auth-response.test.ts` |
| CSP, sanitização e `/storage` | `tests/lib/csp.test.ts`, `sanitize-html.test.ts`, `storage-proxy.test.ts` |
| Formulários e telas | `tests/features` (usuário, empresa, mensagem, banner, perfil, 2FA, auditoria, acesso de suporte, schemas Zod) |
| Services de domínio (proxy mockado) | `tests/domains` |
| Componentes e hooks | `tests/components`, `tests/hooks` |
| Scripts de produção | `tests/scripts/verificar-producao.test.ts` (regras de `npm run verificar:producao`) |
| Utilitários e validações | `tests/lib`, `tests/validations`, `tests/banner` |

### Convenções

- Services de domínio são testados **mockando o proxy** (`@/lib/proxy-admin` / `@/lib/proxy-private`), conferindo URL, método, corpo, serialização de filtros e o mapeamento para camelCase.
- Teste de tela: simule os hooks de mutação/consulta (`vi.mock` + `vi.hoisted`), digite como o usuário (`userEvent`) e confira o que aparece.
- Componentes do Radix (menus, tooltips, selects) abrem e fecham de forma assíncrona: use `waitFor`/`findBy*`.
- Teste que pode ter sido escrito "para passar": faça uma **mutação proposital** no código (e restaure) e confirme que o teste falha.
- Erro de lint do React Compiler: corrija a causa. Só use `// eslint-disable-next-line <regra> -- <motivo>` quando o `useEffect` for a forma correta de sincronizar com um sistema externo.

### Ponta a ponta (E2E, Playwright)

Navegador **real** (Chromium) contra o app Next de **produção** (`next start`) e um **backend simulado** (`e2e/mock-backend.mjs`), sem Laravel nem banco. Por isso testam o frontend e o BFF, **não** a API real.

| Arquivo | O que cobre |
|---|---|
| `e2e/autenticacao.e2e.ts` | login válido (cookie de sessão opaco, `HttpOnly`, `Secure`, `SameSite=Lax`, `__Host-`; nenhuma resposta, HTML, `document.cookie`, `localStorage` ou `sessionStorage` contém o JWT), F5, fixação de sessão, credenciais inválidas, 2FA |
| `e2e/multiusuario.e2e.ts` | vários usuários com sessões próprias, logout de um não derruba o outro, Admin × Private no mesmo PC, logins simultâneos, sid forjado, sessão vencida, `/refresh` recusado pelo proxy, `/api/health` |
| `e2e/responsivo.e2e.ts` | 375 px sem rolagem horizontal |
| `e2e/csp.e2e.ts` | CSP imposta pelo Chromium no build de produção: nonce novo a cada resposta, nenhuma violação nas telas, bloqueio de script/`onerror` injetados, `eval`, iframe, `fetch`/imagem/formulário para outro site e `<base>`; `/storage` com cabeçalhos de segurança |
| `e2e/sessao-e-rotas.e2e.ts` | rotas protegidas, sessão expirada, logout, sessões separadas Admin × Private, cabeçalhos de segurança e recusa de origem diferente (CSRF) |

Como rodar: `npm run build` e depois `npm run e2e` (sobe os dois servidores nas portas 3100 e 4010). Precisa de Redis: use `REDIS_URL` ou deixe o `redis-server` instalado (a configuração sobe um na porta 6390). Na primeira vez, `npx playwright install chromium`. Sem acesso ao download do Playwright, defina `PW_CHROMIUM_PATH` (e opcionalmente `PW_CHROMIUM_ARGS`) apontando para um Chromium instalado. Falhas geram *trace* em `frontend/test-results/` (`npx playwright show-trace <arquivo>`).

## CI

`.github/workflows/ci.yml` roda em `push` na `main` e em `pull_request`:

| Job | O que roda |
|---|---|
| `backend` | PHP 8.5, PostgreSQL 17, `vendor/bin/pest`, `composer audit` |
| `frontend` | Node 22, Redis 7, `tsc`, `npm run lint`, `npm test` (com `REDIS_URL`), `npm audit` |
| `frontend-build` | `npm run build` |

Os audits só bloqueiam severidade **alta ou crítica**: no Composer, o script `.github/scripts/composer-audit-grave.php` lê o JSON de `composer audit`; no npm, `npm audit --omit=dev --audit-level=high`. O relatório completo roda em passo que não bloqueia. O E2E (Playwright) **não roda no CI**: rode localmente quando mexer no BFF, em `lib/session/`, `proxy.ts`, cookies ou cabeçalhos de segurança.

## Lacunas conhecidas

- O E2E usa **backend simulado**: valida o frontend e o BFF, mas não a integração com a API Laravel real (contrato dos endpoints, banco, permissões). Não existe E2E de pilha completa.
- O E2E cobre autenticação, sessão e proteção de rotas; as telas de negócio (usuários, empresas, chamados…) não têm fluxo E2E.
- Não há medição de cobertura de código.
- Mensagens genéricas do Zod em inglês podem aparecer quando um campo sem valor padrão é enviado vazio; verifique formulário a formulário ao criar telas novas.
- Segurança: a suíte comprova controles implementados; **não substitui** um pentest independente (ver [`seguranca.md`](./seguranca.md#avaliação-de-segurança)).
