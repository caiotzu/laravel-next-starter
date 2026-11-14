# Testes e CI

Os testes validam o **comportamento do código**. Nenhum deles lê arquivos de documentação.

---

## Visão geral

| Camada | Ferramenta | Observação |
|---|---|---|
| Backend | Pest 5 | PostgreSQL **real** (banco `testing`) |
| Frontend | Vitest 5 + Testing Library | `tests/session/redis-real.test.ts` só roda com `REDIS_URL` |
| Frontend (E2E) | Playwright (Chromium) | app de produção + **backend simulado** + Redis real |
| Tipos e lint | `tsc` e ESLint | 0 erros e 0 avisos |

## Como rodar

```bash
# Backend (em backend/, com o Sail ligado)
./vendor/bin/sail artisan test --compact
./vendor/bin/sail artisan test --filter=GrupoTest     # um arquivo/teste

# Frontend (em frontend/)
npm test                       # Vitest
REDIS_URL=redis://127.0.0.1:6379 npm test    # inclui os testes com Redis real
npx tsc --noEmit               # tipos
npm run lint                   # ESLint
npm run build && npm run e2e   # ponta a ponta (precisa de Redis)
```

O banco `testing` é criado pelo Sail. Sem Docker: PHP 8.5, PostgreSQL local, `.env` com `DB_HOST=127.0.0.1`, `APP_KEY` e `JWT_SECRET` gerados e o banco `testing` criado.

---

## O que é testado

### Backend (`tests/Feature` e `tests/Unit`)

| Área | Testes |
|---|---|
| Autenticação | `AuthFluxoTest` (login, 2FA, primeiro acesso, redefinição, refresh, logout) |
| Segurança | `SegurancaTest`, `AvaliacaoSegurancaTest`, `SwaggerTest` |
| Isolamento entre empresas | `EscopoEntidadeTest`, `RepositoriesTest`, `UsuarioEscopoTest`, `UsuarioTest`, `GrupoTest` |
| Permissões | `EmpresaEnderecoAutorizacaoTest`, `PermissoesAuthorizeTest` |
| Acesso de Suporte | `AcessoSuporteTest` |
| Módulos | `BannerTest`, `ReleaseTest`, `ChamadoTest`, `MensagemBuscaUsuariosTest`, `DashboardTest`, `GrupoEmpresaOnboardingTest` |
| Arquivos | `ArmazenamentoDeArquivosTest` |
| Produção | `ProducaoComandosTest`, `ProxiesConfiaveisTest` |

**Guardas arquiteturais** (falham se a regra for quebrada)

- `RepositoriesEscopoTest` — toda leitura de dado com dono recebe o escopo da empresa.
- `PermissoesAuthorizeTest` — toda chave de `authorize()` existe nos seeders.

### Frontend (Vitest)

| Área | Pasta |
|---|---|
| BFF, sessão e proxy | `tests/api`, `tests/session`, `tests/proxy` |
| CSP, sanitização, `/storage` | `tests/lib` |
| Formulários e telas | `tests/features` |
| Services de domínio | `tests/domains` |
| Componentes e hooks | `tests/components`, `tests/hooks` |
| Verificador de produção | `tests/scripts` |

### Ponta a ponta (Playwright, `e2e/`)

| Arquivo | Cobre |
|---|---|
| `autenticacao.e2e.ts` | login, cookie opaco, JWT fora do navegador, 2FA |
| `multiusuario.e2e.ts` | várias sessões, logout independente, sessão vencida |
| `sessao-e-rotas.e2e.ts` | rotas protegidas, cabeçalhos e recusa de origem diferente |
| `csp.e2e.ts` | CSP imposta pelo navegador, nonce, `/storage` |
| `responsivo.e2e.ts` | tela de 375 px sem rolagem horizontal |

Primeira vez: `npx playwright install chromium`. Sem acesso ao download, aponte `PW_CHROMIUM_PATH` para um Chromium instalado. Portas usadas: 3100 (app) e 4010 (backend simulado).

---

## Convenções

- Dado com dono ⇒ **sempre** um caso cross-tenant (A não vê nem altera B), com resposta que não revele se existe.
- Teste novo de segurança: veja-o **falhar** sem a correção antes de confiar nele.
- Antes de refatorar código sem cobertura, escreva um teste de caracterização.
- Não dependa da ordenação do banco (a *collation* do PostgreSQL muda a ordem).
- Backend: `test('frase em português', …)`. Frontend: mocke o proxy nos services e use `waitFor`/`findBy*` com componentes Radix.

---

## CI (`.github/workflows/ci.yml`)

Roda em `push` na `main` e em `pull_request`:

| Job | Executa |
|---|---|
| `backend` | PHP 8.5, PostgreSQL 17, Pest, `composer audit` |
| `frontend` | Node 22, Redis 7, `tsc`, lint, Vitest, `npm audit` |
| `frontend-build` | `npm run build` |

Os audits bloqueiam só severidade **alta ou crítica**. O E2E **não** roda no CI: rode localmente ao mexer no BFF, em `lib/session/`, `proxy.ts`, cookies ou cabeçalhos.

## Lacunas conhecidas

- O E2E usa backend simulado: não valida a API Laravel real.
- Não há E2E das telas de negócio nem medição de cobertura.
- A segurança é comprovada por testes e revisão, **não** por pentest independente.
