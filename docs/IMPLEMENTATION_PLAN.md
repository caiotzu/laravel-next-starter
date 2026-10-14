# Plano de implementação e acompanhamento

Documento central de continuidade. **Atualize ao concluir cada tarefa** (checkbox, B, A, E, G).
Regras: [`../CLAUDE.md`](../CLAUDE.md) · mapa técnico: [`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md) · Repository: [`repositories.md`](./repositories.md).
Só marque `[x]` depois de verificar (teste executado, lint/tsc, leitura do resultado).

---

## A. Resumo do estado atual (2026-10-14)

- **Padronização:** instruções permanentes e docs criadas; convenções registradas sem alterar a arquitetura existente (ela já era coerente).
- **Repository Pattern:** adotado de forma deliberada e restrita (dados com dono). `GrupoRepository` e `UsuarioRepository` existem; consumidores: `GrupoService`, `UsuarioService`, `GrupoEmpresaService::cadastrar` (este último migrado nesta sessão, REPO-001). Guarda estrutural em `tests/Unit/RepositoriesEscopoTest.php`.
- **Módulos já padronizados no padrão Repository:** Grupo, Usuario (+ onboarding de GrupoEmpresa).
- **Ainda a avaliar (decisão, não obrigação):** Empresa/EmpresaContato/EmpresaEndereco (usam `EscopoEntidadeService::aplicar`, mecanismo diferente), Chamado, Banner, Release, Mensagem, Dashboard. `docs/repositories.md` já diz que não ter Repository é intencional nesses; falta **verificar** se há consultas com dono sem escopo (REPO-002).
- **Verificação nesta sessão:** backend 362 testes verdes (1520 asserções; baseline inicial 357); frontend 109 testes verdes (baseline 101 + 2 falhando + 1 arquivo sem resolver), `tsc` limpo, ESLint 0 erros (baseline 19) / 70 avisos.
- **Bloqueios/riscos:** nenhum bloqueio crítico. Não foi feita auditoria de segurança completa nesta sessão (a análise cobriu escopo/tenant e o fluxo de proxy); não há CI; sem execução via Sail/Docker (verificado com PHP 8.3 + PostgreSQL 16 local — ver PROJECT_GUIDE §12).

### Achados da auditoria

| # | Prio | Achado | Evidência | Status |
|---|---|---|---|---|
| F-1 | P1 | `lib/media-url.ts` documentado e exigido por testes, mas **nunca commitado**; proxies não normalizavam `/storage` (3 testes falhavam; avatar/banner com `APP_URL` inacessível ao navegador) | `git log --all -- frontend/lib/media-url.ts` vazio; `next.config.ts` e `docs/testes.md` o citam | **Resolvido** (FRONT-001) |
| F-2 | P1 | Onboarding `GrupoEmpresaService::cadastrar` criava `Grupo`/`Usuario` direto no Eloquent, fora do padrão e sem teste | grep `Grupo::create`/`Usuario::create`; nenhum teste de `POST /admin/grupos-empresas` | **Resolvido** (REPO-001) |
| F-3 | P2 | 19 erros `import/order` no lint (já listados como pendência em `frontend-arquitetura.md`) | `npx eslint .` | **Resolvido** (FRONT-002) |
| F-4 | P2 | Lookups de Usuario sem escopo fora de repository: `MensagemService::buscarUsuarios` (global **por design**, documentado), admin em `AcessoSuporteService::conceder` e `ConcederRequest`, listeners de sessão e `PopularDestinatariosMensagemJob` | grep em `app/` | Aberto → REPO-003 |
| F-5 | P2 | Sem CI/CD e sem `composer audit`/`npm audit` automatizados | não existe `.github/` | Aberto → CI-001 |
| F-6 | P2 | Frontend com testes só em lib/proxy/banner/perfil/validações; domínios e features sem testes | `frontend/tests/**` | Aberto → TEST-001 |
| F-7 | P3 | Pint não aplicado ao legado (340/501 arquivos fora do preset) enquanto `AGENTS.md` manda `pint --dirty` | `pint --test` | Decisão registrada (D-005); opcional → QUAL-001 |
| F-8 | P3 | Docs com referências quebradas/desatualizadas: `docs/pentest-avaliacao-seguranca.md` e `docs/pentest/` citados mas ausentes; contagens em `testes.md`/`arquitetura.md`; `frontend-arquitetura.md` diz Next 16.3.7 (real 16.3.8) | `ls docs`; `package.json` | Parcial (contagens/fluxo corrigidos em DOC-001); links → DOC-002 |
| F-9 | P3 | 70 avisos de lint (regras do React Compiler, variáveis não usadas) | `npm run lint` | Aberto → FRONT-003 |

Nenhum achado P0 identificado **nas áreas inspecionadas**.

---

## B. Tarefas concluídas (verificadas)

### ARCH-001 — Auditoria, instruções permanentes e documentação
- **Arquivos:** `CLAUDE.md`, `docs/PROJECT_GUIDE.md`, `docs/IMPLEMENTATION_PLAN.md`.
- **Resultado:** convenções, skills, comandos, decisões e backlog registrados; afirmações da doc conferidas contra `composer.json`, `package.json`, rotas, `bootstrap/app.php`, repositories e estrutura de pastas.
- **Verificação:** leitura cruzada com o código; números de baseline medidos (ver A).
- **Pendências:** nenhuma.

### REPO-001 — Onboarding de empresa passa pelos repositories
- **Arquivos:** `backend/app/Services/GrupoEmpresaService.php`; testes `backend/tests/Feature/GrupoEmpresaOnboardingTest.php` (novo, 5 casos) e `backend/tests/Unit/RepositoriesEscopoTest.php` (guarda estendida a `GrupoEmpresaService`).
- **Resultado:** `cadastrar()` usa `GrupoRepository::criarNoEscopo` (escopo explícito da nova empresa) e `UsuarioRepository::criarNoGrupo`; sem abstração nova, sem método novo nos repositories.
- **Verificação:** testes de caracterização escritos e **verdes antes** da refatoração (3 casos), estendidos (401/422) e verdes depois; guarda confirmada contra o código antigo; suíte completa 362 verdes.
- **Pendências:** nenhuma.

### FRONT-001 — `lib/media-url.ts` e normalização nos proxies
- **Arquivos:** `frontend/lib/media-url.ts` (novo), `frontend/lib/proxy-admin.ts`, `frontend/lib/proxy-private.ts`.
- **Resultado:** `normalizarUrlDeMidia`/`normalizarUrlsDeMidia` conforme o contrato dos testes existentes; proxies devolvem a resposta normalizada.
- **Verificação:** `tests/lib/media-url.test.ts` e `tests/proxy/proxy-clients.test.ts` verdes; suíte completa 109/109; `tsc` limpo.
- **Pendências:** validar manualmente avatar/banner no navegador (não feito: sem ambiente de UI).

### FRONT-002 — Lint `import/order` zerado
- **Arquivos:** 8 arquivos (`app/api/auth/**/route.ts` ×6, `components/ui/combobox.tsx`, `components/ui/input-group.tsx`); só reordenação de imports (`eslint --fix`, sem tocar `.agents/`).
- **Verificação:** ESLint 0 erros; `tsc` limpo; 109 testes verdes.

### DOC-001 — Docs temáticas alinhadas
- **Arquivos:** `docs/repositories.md`, `docs/testes.md`, `docs/arquitetura.md`, `README.md`.
- **Resultado:** Repository no fluxo de arquitetura, consumidores e exceções documentados, contagens/comandos atualizados, links para os novos docs.

---

## C. Tarefas em andamento

Nenhuma. (Última unidade coerente concluída: REPO-001/FRONT-001.)

---

## D. Backlog priorizado

Legenda de prioridade: P1 > P2 > P3. Ordem sugerida = ordem da lista.

- [ ] **REPO-002 (P2) — Auditar consultas com dono nos Services não migrados**
  - Objetivo: decidir, com evidência, quais módulos precisam de Repository/escopo explícito.
  - Escopo: `EmpresaService`, `EmpresaContatoService`, `EmpresaEnderecoService`, `ChamadoService`, `BannerService`, `ReleaseService`, `MensagemService`, `DashboardService`.
  - Procurar: consulta com `entidade_id`/`grupo_empresa_id`/`entidade_tipo_id` sem passar por `EscopoEntidadeService` ou Repository; uso de `aplicar()` vs `atual()`.
  - Dependências: nenhuma. Critério de aceitação: tabela módulo → decisão (manter / migrar / corrigir) com evidência, registrada em `repositories.md` + D-006; se achar vazamento, abrir tarefa P0/P1 com teste cross-tenant que reproduz.
  - Testes: cross-tenant (A não vê/altera B) para cada módulo afetado antes de qualquer mudança. Status: pendente.
- [ ] **REPO-003 (P2) — Lookups de Usuario sem escopo (F-4)**
  - Escopo: `AcessoSuporteService::conceder` + `ConcederRequest` (`Usuario::with('grupo.entidadeTipo')->find`), `MensagemService::buscarUsuarios`, listeners `InvalidarSessoesDosUsuariosDoGrupo[Empresa]`, `PopularDestinatariosMensagemJob`.
  - Regra de decisão: só migrar se a consulta duplicada ficar mais legível; método sem escopo entra em `METODOS_SEM_ESCOPO` com justificativa. É aceitável **concluir descartando** a migração e registrando o porquê.
  - Dependência: REPO-002. Testes: `AcessoSuporteTest`, `MensagemTest` (se existir; senão caracterização), `RepositoriesEscopoTest`. Status: pendente.
- [ ] **CI-001 (P2) — Pipeline de CI** (Pest, Vitest, tsc, ESLint, `composer audit`, `npm audit`)
  - Requer aprovação (cria `.github/`, nova pasta base). Critério: workflow verde no estado atual. Status: pendente.
- [ ] **TEST-001 (P2) — Testes de frontend para domínios críticos** (services via proxy mockado, schemas Zod de grupo/usuário/empresa)
  - Dependência: nenhuma. Critério: ≥1 teste por domínio crítico sem mockar regra de negócio. Status: pendente.
- [ ] **DOC-002 (P3) — Referências quebradas em docs** (`pentest-avaliacao-seguranca.md`, `docs/pentest/**`, versão do Next em `frontend-arquitetura.md`). Restaurar os arquivos ou remover os links. Status: pendente.
- [ ] **FRONT-003 (P3) — Reduzir 70 avisos de lint** (agrupar por regra; não alterar comportamento). Status: pendente.
- [ ] **QUAL-001 (P3) — Decidir Pint:** adotar `pint.json` que reflita o estilo atual **ou** formatar tudo em um commit isolado. Hoje: só arquivos novos (D-005). Status: pendente, depende de decisão do dono.
- [ ] **ARCH-002 (P3) — `infer-conventions` / `.ai/rules`** — somente se o usuário pedir explicitamente (a skill proíbe rodar por conta própria). Status: pendente.

---

## E. Próxima tarefa recomendada

**REPO-002 — Auditar consultas com dono nos Services não migrados.**
Por que primeiro: é o único item que pode revelar risco de isolamento entre empresas (P0/P1 potencial) e define se REPO-003 e novos Repositories fazem sentido; é só leitura + testes de caracterização, portanto de baixo risco.
Para iniciar: `docs/repositories.md` (seção "Hoje" e "Quando criar"), `EscopoEntidadeService`, skill `laravel-best-practices` (`rules/architecture.md`, `rules/security.md`, `rules/db-performance.md`), `testing-best-practices` (`endpoint-tests.md`, `test-data.md`), e os testes existentes `EscopoEntidadeTest`/`UsuarioEscopoTest` como molde. Nenhuma decisão do usuário é necessária.

---

## F. Histórico de decisões

| ID | Decisão | Justificativa | Alternativas descartadas |
|---|---|---|---|
| D-001 | Manter Repository concreto, sem interface/base | Eloquent não será trocado; testes usam banco real (já em `repositories.md`) | Interface por repository; `BaseRepository` |
| D-002 | Repository só com dono ou complexidade real | Evitar camada genérica | Repository para todos os Models |
| D-003 | Onboarding usa `criarNoEscopo` com `EscopoEntidade` montado explicitamente | Reuso dos métodos existentes; escopo da empresa **nova**, não do admin | Novo método `criarAdministradorDaEmpresa`; manter `Grupo::create` |
| D-004 | Corrigir F-1 criando `lib/media-url.ts` conforme os testes | Os testes são a especificação existente; doc e `next.config.ts` já pressupõem o arquivo | Alterar/remover os testes |
| D-005 | Não rodar Pint em legado; formatar só arquivos novos | 340/501 fora do preset; diff gigante sem ganho | `pint --dirty` em arquivos tocados (reformata o arquivo inteiro) |
| D-006 | Um único `CLAUDE.md` na raiz (sem `CLAUDE.md` por subpasta) | Evitar instruções repetidas; `backend/AGENTS.md` já cobre detalhes do Laravel | `CLAUDE.md` em `backend/` e `frontend/` |

---

## G. Histórico de execução

| Data | Tarefas | Principais arquivos | Verificações | Próximo passo |
|---|---|---|---|---|
| 2026-10-14 | ARCH-001, REPO-001, FRONT-001, FRONT-002, DOC-001 | `CLAUDE.md`, `docs/{PROJECT_GUIDE,IMPLEMENTATION_PLAN}.md`, `GrupoEmpresaService`, `GrupoEmpresaOnboardingTest`, `RepositoriesEscopoTest`, `frontend/lib/{media-url,proxy-admin,proxy-private}.ts` | Pest 362 ✔; Vitest 109 ✔; `tsc` ✔; ESLint 0 erros | REPO-002 |
