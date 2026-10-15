# Plano de implementação e acompanhamento

Documento central de continuidade. **Atualize ao concluir cada tarefa** (checkbox, B, A, E, G).
Regras: [`../CLAUDE.md`](../CLAUDE.md) · mapa técnico: [`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md) · Repository: [`repositories.md`](./repositories.md).
Só marque `[x]` depois de verificar (teste executado, lint/tsc, leitura do resultado).

---

## A. Resumo do estado atual (2026-10-15)

- **Padronização:** instruções permanentes e docs criadas e já publicadas no `main` (commit `213ed62`); convenções registradas sem alterar a arquitetura existente (ela já era coerente).
- **Repository Pattern:** adotado de forma deliberada e restrita (dados com dono). `GrupoRepository` e `UsuarioRepository` existem; consumidores: `GrupoService`, `UsuarioService`, `GrupoEmpresaService::cadastrar`. Guarda estrutural em `tests/Unit/RepositoriesEscopoTest.php`.
- **Auditoria dos demais módulos (REPO-002, concluída):** nenhum precisa de Repository novo; o isolamento já é garantido por outros mecanismos (tabela em `repositories.md`). A auditoria encontrou e corrigiu 3 falhas reais de autorização/escopo (SEC-001..003).
- **Módulos padronizados:** Grupo, Usuario (Repository); Empresa/Contato/Endereco (`EscopoEntidadeService`); Chamado/Mensagem (dono = usuário passado pelo controller); Banner/Release (audiência por contexto); AcessoSuporte (filtro pelo ator).
- **Verificação:** backend **375 testes verdes** (1549 asserções; baseline inicial 357); frontend 109 testes verdes, `tsc` limpo, ESLint 0 erros / 70 avisos (baseline inicial: 2 testes falhando + 19 erros de lint).
- **Bloqueios/riscos:** nenhum bloqueio. Não há CI; sem execução via Sail/Docker (verificado com PHP 8.3 + PostgreSQL 16 local — PROJECT_GUIDE §12). Auditoria de segurança **não é completa**: cobriu escopo/tenant, chaves de `authorize()` e fluxo de proxy.
- **Atenção em produção (SEC-001):** grupos *personalizados* que tinham só `*.empresa.contato.atualizar` deixam de poder editar endereços (corrigido: exige `*.empresa.endereco.atualizar`). Grupos semeados/onboarding recebem ambas e não são afetados.

### Achados da auditoria

| # | Prio | Achado | Evidência | Status |
|---|---|---|---|---|
| F-1 | P1 | `lib/media-url.ts` documentado e exigido por testes, mas nunca commitado | `git log --all -- frontend/lib/media-url.ts` vazio | **Resolvido** (FRONT-001) |
| F-2 | P1 | Onboarding criava `Grupo`/`Usuario` direto no Eloquent, sem teste | grep + ausência de teste | **Resolvido** (REPO-001) |
| F-3 | P2 | 19 erros `import/order` no lint | `npx eslint .` | **Resolvido** (FRONT-002) |
| F-4 | P2 | Lookups de Usuario sem escopo fora de repository (`MensagemService::buscarUsuarios` é global por design; admin em `AcessoSuporteService`/`ConcederRequest`; listeners/job) | grep em `app/` | Aberto → REPO-003 |
| F-5 | P2 | Sem CI/CD nem `composer audit`/`npm audit` automatizados | não existe `.github/` | Aberto → CI-001 |
| F-6 | P2 | Frontend com testes só em lib/proxy/banner/perfil/validações | `frontend/tests/**` | Aberto → TEST-001 |
| F-7 | P3 | Pint não aplicado ao legado (340/501 arquivos fora do preset) vs `AGENTS.md` | `pint --test` | Decisão D-005; opcional → QUAL-001 |
| F-8 | P3 | Docs com referências quebradas (`pentest-avaliacao-seguranca.md`, `docs/pentest/`), Next 16.3.7 vs 16.3.8 | `ls docs`; `package.json` | Aberto → DOC-002 |
| F-9 | P3 | 70 avisos de lint | `npm run lint` | Aberto → FRONT-003 |
| F-10 | **P1** | `EmpresaEnderecoController::atualizar` (**Admin e Private**) autorizava com `*.empresa.contato.atualizar` em vez de `*.endereco.atualizar`: quem só tinha a permissão de contato editava endereços (200) e quem tinha a de endereço levava 403, enquanto o frontend exibe o botão pela permissão de endereço | testes vermelhos antes da correção; seeders e `frontend/**` usam `endereco.atualizar` | **Resolvido** (SEC-001) |
| F-11 | P2 | Form Requests Private de contato/endereço consultavam dados da empresa **sem escopo**, antes do gate do Service: um usuário que conheça o UUID de outra empresa distinguia "tem principal" (422) de "não tem" (400) e "contato existe" de "não existe" | 4 testes vermelhos antes da correção | **Resolvido** (SEC-002) |
| F-12 | P2 | `EmpresaService::excluir`/`ativar` não aplicavam o escopo (só `atualizar`/`visualizar`/`listar` aplicavam). Inalcançável hoje (rotas só do Admin; modo de suporte recusa `/admin`), mas dependia disso | 2 testes vermelhos antes da correção | **Resolvido** (SEC-003) |
| F-13 | P3 | `ChamadoService::responder`/`atualizarStatus`… recebem o id sem checar o dono; o controller Private faz `visualizarPrivate($id, Auth::id())` antes. Seguro hoje, frágil para novos chamadores | leitura de `ChamadoService`/`Private\ChamadoController` | Aberto → SEC-004 |

Verificado e **sem achado**: toda chave usada em `authorize()` existe nos seeders; nenhum controller usa chave de outro recurso (varredura por script); Requests **Admin** têm as mesmas consultas sem escopo, mas o Admin é irrestrito por design (modo de suporte recusa `/admin`).

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

### REPO-002 — Auditoria das consultas com dono nos Services não migrados
- **Escopo auditado:** `EmpresaService`, `EmpresaContatoService`, `EmpresaEnderecoService`, `ChamadoService`, `BannerService`, `ReleaseService`, `MensagemService`/`MensagemDestinatarioService`, `DashboardService`, `AcessoSuporteService` + Form Requests Private + controllers de autorização.
- **Resultado:** tabela módulo → decisão em `docs/repositories.md` (nenhum novo Repository); falhas F-10, F-11 e F-12 corrigidas (abaixo). Contato/Endereco: confirmado por script que **todos** os métodos chamam `validarAcessoEmpresa`.
- **Verificação:** para cada correção, teste escrito e visto **falhar** antes; suíte completa 375 verdes.

### SEC-001 — Permissão correta na atualização de endereço (F-10)
- **Arquivos:** `backend/app/Http/Controllers/{Admin,Private}/EmpresaEnderecoController.php`; teste novo `backend/tests/Feature/EmpresaEnderecoAutorizacaoTest.php` (4 casos: com a permissão de endereço → 200; só com a de contato → 403; Admin e Private).
- **Pendência:** comunicar a mudança de comportamento para grupos personalizados (ver A).

### SEC-002 — Form Requests Private não revelam dados de outra empresa (F-11)
- **Arquivos:** `EscopoEntidadeService::empresaVisivel()` (novo método) e guarda no início do `withValidator` de `Private/EmpresaContato/{Cadastrar,Atualizar}Request` e `Private/EmpresaEndereco/{Cadastrar,Atualizar}Request`.
- **Resultado:** empresa fora do escopo ⇒ a validação não consulta dados dela e o Service responde o 400 padrão "Empresa não encontrada"; na **própria** empresa a validação de principal duplicado segue igual (422, coberto por teste).
- **Verificação:** 5 testes novos em `tests/Feature/EscopoEntidadeTest.php` (4 vermelhos antes, todos verdes depois).

### SEC-003 — Escopo em `EmpresaService::excluir`/`ativar` (F-12)
- **Arquivos:** `backend/app/Services/EmpresaService.php`; testes em `EscopoEntidadeTest.php` (caracterização do Admin via HTTP + 3 casos de service com contexto Private).
- **Resultado:** sem mudança para o Admin (`irrestrito`); defesa em profundidade para qualquer chamador futuro.

## C. Tarefas em andamento

Nenhuma. (Última unidade coerente concluída: REPO-002 + SEC-001..003.)

---

## D. Backlog priorizado

Legenda de prioridade: P1 > P2 > P3. Ordem sugerida = ordem da lista.

- [ ] **REPO-003 (P2) — Lookups de Usuario sem escopo (F-4)**
  - Escopo: `AcessoSuporteService::conceder` + `ConcederRequest` (`Usuario::with('grupo.entidadeTipo')->find`), `MensagemService::buscarUsuarios`, listeners `InvalidarSessoesDosUsuariosDoGrupo[Empresa]`, `PopularDestinatariosMensagemJob`.
  - Regra de decisão: só migrar se a consulta duplicada ficar mais legível; método sem escopo entra em `METODOS_SEM_ESCOPO` com justificativa. É aceitável **concluir descartando** a migração e registrando o porquê.
  - Dependência: REPO-002 (concluída; confirmou que não há outros módulos a migrar). Testes: `AcessoSuporteTest`, `MensagemTest` (se existir; senão caracterização), `RepositoriesEscopoTest`. Status: pendente.
- [ ] **SEC-004 (P3) — Dono do chamado dentro do Service (F-13)**
  - Objetivo: `ChamadoService` deixar de depender só do controller para a posse. Opção mínima: `responder` receber/validar `usuario_id` do dono quando o chamador é Private (ou método `buscarDoUsuario`). Pode ser **descartada** se registrado o motivo.
  - Testes: `ChamadoTest` já cobre "cliente não visualiza chamado de outro"; incluir chamada direta ao Service. Status: pendente.
- [ ] **SEC-005 (P3) — Guarda automática de chaves de permissão:** teste Unit que falha se um `authorize('x')` não existir nos seeders (a varredura da REPO-002 mostrou 0 casos hoje). Limite conhecido: não pega chave **existente porém errada** (caso F-10) — isso exige teste de comportamento por rota. Status: pendente.
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

**REPO-003 — Lookups de Usuario sem escopo (F-4).**
Por que agora: fecha a trilha do Repository Pattern (objetivo prioritário). A REPO-002 já confirmou que nenhum outro módulo exige Repository, então resta decidir os 5 lookups de Usuario (admin em `AcessoSuporteService::conceder` + `ConcederRequest`, `MensagemService::buscarUsuarios`, listeners de sessão, `PopularDestinatariosMensagemJob`). É aceitável concluir **descartando** a migração se o ganho for só mover uma linha — registrar o porquê (regra de decisão do `CLAUDE.md`).
Para iniciar: `docs/repositories.md` (seção "Consultas de Usuario fora do repository"), `UsuarioRepository` + `METODOS_SEM_ESCOPO` em `tests/Unit/RepositoriesEscopoTest.php`, skill `laravel-best-practices` (`rules/architecture.md`), `testes` de `AcessoSuporteTest`. Nenhuma decisão do usuário é necessária.
Alternativa se preferir priorizar segurança/qualidade: **CI-001** (requer aprovação para criar `.github/`).

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
| D-007 | REPO-002: manter `EscopoEntidadeService::aplicar` para Empresa/Contato/Endereco e "usuário como dono" em Chamado/Mensagem; **nenhum Repository novo** | Auditoria mostrou isolamento já correto; Repository só moveria código | Repository para Empresa/Chamado |
| D-008 | Guarda de escopo em Form Requests via `EscopoEntidadeService::empresaVisivel()` (um método, 4 chamadas) | Regra num lugar só; sem classe/trait nova; precedente: Requests já usam `EscopoEntidadeService` | Trait nos Requests; duplicar a consulta em cada um |
| D-009 | Corrigir F-10 trocando a chave de permissão (e documentar o impacto), sem camada de compatibilidade | A chave "certa" já existe nos seeders e no frontend | Aceitar ambas as permissões |

---

## G. Histórico de execução

| Data | Tarefas | Principais arquivos | Verificações | Próximo passo |
|---|---|---|---|---|
| 2026-10-14 | ARCH-001, REPO-001, FRONT-001, FRONT-002, DOC-001 | `CLAUDE.md`, `docs/{PROJECT_GUIDE,IMPLEMENTATION_PLAN}.md`, `GrupoEmpresaService`, `GrupoEmpresaOnboardingTest`, `RepositoriesEscopoTest`, `frontend/lib/{media-url,proxy-admin,proxy-private}.ts` | Pest 362 ✔; Vitest 109 ✔; `tsc` ✔; ESLint 0 erros | REPO-002 |
| 2026-10-15 | REPO-002, SEC-001, SEC-002, SEC-003 | `EmpresaService`, `EscopoEntidadeService`, `EmpresaEnderecoController` (Admin/Private), 4 Form Requests Private, `EscopoEntidadeTest`, `EmpresaEnderecoAutorizacaoTest`, `docs/repositories.md` | Pest 375 ✔ (cada correção vista vermelha antes); varredura de `authorize()` × seeders ✔ | REPO-003 |
