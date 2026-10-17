# Plano de implementação e acompanhamento

Documento central de continuidade. **Atualize ao concluir cada tarefa** (checkbox, B, A, E, G).
Regras: [`../CLAUDE.md`](../CLAUDE.md) · mapa técnico: [`PROJECT_GUIDE.md`](./PROJECT_GUIDE.md) · Repository: [`repositories.md`](./repositories.md).
Só marque `[x]` depois de verificar (teste executado, lint/tsc, leitura do resultado).

---

## A. Resumo do estado atual (2026-10-17)

- **Padronização:** instruções permanentes e docs criadas e já publicadas no `main` (commit `213ed62`); convenções registradas sem alterar a arquitetura existente (ela já era coerente).
- **Repository Pattern (trilha concluída):** adotado de forma deliberada e restrita. `GrupoRepository` e `UsuarioRepository`; consumidores: `GrupoService`, `UsuarioService`, `GrupoEmpresaService`, `AcessoSuporteService`/`ConcederRequest`, `MensagemService`. Guarda estrutural em `tests/Unit/RepositoriesEscopoTest.php` cobre 5 Services. Não há mais consultas de `Usuario`/`Grupo` soltas em Services, exceto as decididas e justificadas em `repositories.md`.
- **Auditoria dos demais módulos (REPO-002, concluída):** nenhum precisa de Repository novo; o isolamento já é garantido por outros mecanismos (tabela em `repositories.md`). A auditoria encontrou e corrigiu 3 falhas reais de autorização/escopo (SEC-001..003).
- **Módulos padronizados:** Grupo, Usuario (Repository); Empresa/Contato/Endereco (`EscopoEntidadeService`); Chamado/Mensagem (dono = usuário passado pelo controller); Banner/Release (audiência por contexto); AcessoSuporte (filtro pelo ator).
- **Verificação:** backend **393 testes verdes** (1618 asserções; baseline inicial 357); frontend **145 testes verdes** (17 arquivos), `tsc` limpo, `npm run lint` 0 erros / **44 avisos** (eram 70), `npm run build` ✔ (local, com Google Fonts simulado), `npm audit --omit=dev --audit-level=high` sem achados.
- **CI:** `.github/workflows/ci.yml` está no GitHub (commit `d3ff70b`) e o **primeiro run passou** (workflow "passing", 3 jobs "completed successfully"). Os jobs `backend`, `frontend` e `frontend-build` agora são todos **bloqueantes**. Falta só decidir a proteção da branch `main` (CI-003).
- **Bloqueios/riscos:** nenhum bloqueio. Não há CI; sem execução via Sail/Docker (verificado com PHP 8.3 + PostgreSQL 16 local — PROJECT_GUIDE §12). Auditoria de segurança **não é completa**: cobriu escopo/tenant, chaves de `authorize()` e fluxo de proxy.
- **Atenção em produção (SEC-001):** grupos *personalizados* que tinham só `*.empresa.contato.atualizar` deixam de poder editar endereços (corrigido: exige `*.empresa.endereco.atualizar`). Grupos semeados/onboarding recebem ambas e não são afetados.

### Achados da auditoria

| # | Prio | Achado | Evidência | Status |
|---|---|---|---|---|
| F-1 | P1 | `lib/media-url.ts` documentado e exigido por testes, mas nunca commitado | `git log --all -- frontend/lib/media-url.ts` vazio | **Resolvido** (FRONT-001) |
| F-2 | P1 | Onboarding criava `Grupo`/`Usuario` direto no Eloquent, sem teste | grep + ausência de teste | **Resolvido** (REPO-001) |
| F-3 | P2 | 19 erros `import/order` no lint | `npx eslint .` | **Resolvido** (FRONT-002) |
| F-4 | P2 | Lookups de Usuario sem escopo fora de repository (admin em `AcessoSuporteService`/`ConcederRequest` com regra duplicada; busca global em `MensagemService`; listeners; job) | grep em `app/` | **Resolvido** (REPO-003): 2 migrados, 3 mantidos com justificativa |
| F-5 | P2 | Sem CI/CD nem audits automatizados | não existia `.github/` | **Resolvido** (CI-001; falta 1ª execução real → CI-002) |
| F-6 | P2 | Frontend com testes só em lib/proxy/banner/perfil/validações | `frontend/tests/**` | Aberto → TEST-001 |
| F-7 | P3 | Pint não aplicado ao legado (340/501 arquivos fora do preset) vs `AGENTS.md` | `pint --test` | Decisão D-005; opcional → QUAL-001 |
| F-8 | P3 | Docs com referências quebradas (`pentest-avaliacao-seguranca.md`, `docs/pentest/`), Next 16.3.7 vs 16.3.8 | `ls docs`; `package.json` | Aberto → DOC-002 |
| F-9 | P3 | 70 avisos de lint | `npm run lint` | Aberto → FRONT-003 |
| F-10 | **P1** | `EmpresaEnderecoController::atualizar` (**Admin e Private**) autorizava com `*.empresa.contato.atualizar` em vez de `*.endereco.atualizar`: quem só tinha a permissão de contato editava endereços (200) e quem tinha a de endereço levava 403, enquanto o frontend exibe o botão pela permissão de endereço | testes vermelhos antes da correção; seeders e `frontend/**` usam `endereco.atualizar` | **Resolvido** (SEC-001) |
| F-11 | P2 | Form Requests Private de contato/endereço consultavam dados da empresa **sem escopo**, antes do gate do Service: um usuário que conheça o UUID de outra empresa distinguia "tem principal" (422) de "não tem" (400) e "contato existe" de "não existe" | 4 testes vermelhos antes da correção | **Resolvido** (SEC-002) |
| F-12 | P2 | `EmpresaService::excluir`/`ativar` não aplicavam o escopo (só `atualizar`/`visualizar`/`listar` aplicavam). Inalcançável hoje (rotas só do Admin; modo de suporte recusa `/admin`), mas dependia disso | 2 testes vermelhos antes da correção | **Resolvido** (SEC-003) |
| F-13 | P3 | `ChamadoService::responder` e afins recebem o id sem checar o dono; o controller Private faz `visualizarPrivate($id, Auth::id())` antes | leitura de `ChamadoService`/`Private\\ChamadoController` | **Descartado** (SEC-004, D-011): controller comentado e testado; teste agora prova ausência de efeitos |
| F-14 | **P1** | 2 vulnerabilidades **críticas** em dependências de produção: `seroval` ≤1.6.2 (CVSS 9.8, desserialização) e `solid-js`, ambas transitivas de `@tanstack/react-query-devtools` | `npm audit --omit=dev` | **Resolvido** (DEP-001) |
| F-15 | P3 | `npm run lint` varria `.agents/` (skills de terceiros) e acusava 1 erro fora do código do projeto; minha afirmação anterior "0 erros" valia só para as pastas da aplicação | `npm run lint` | **Resolvido** (CI-001: `.agents/**` e `.claude/**` ignorados) |
| F-16 | P2 | Paginação compartilhada só mostrava 5 números ao redor da atual: para chegar à última página era preciso avançar de uma em uma | `components/data-tables/Pagination.tsx` (usada em 10 páginas) | **Resolvido** (FRONT-004) |
| F-17 | P3 | `@tanstack/react-query-devtools` estava em `dependencies` (instalado em produção, junto com `solid-js`/`seroval`, que tinham as 2 críticas). Premissa corrigida: no bundle de produção ele **não** entrava (pacote vazio em produção). Os avisos moderados restantes (`@tailwindcss/typography`) e os altos de dev só têm correção semver-major | `npm audit`; `.next/static` sem devtools | **Resolvido** (DEP-002) no que cabia; o restante não bloqueia o CI, por política |
| F-18 | **P1** | A pasta `.github/` (workflow do CI) não chegou ao GitHub no commit `c294610` | `git diff --name-only` | **Resolvido**: enviada em `d3ff70b`; primeiro run verde (CI-002) |
| F-19 | **P1** | O workflow usava `composer audit --ignore-severity`, opção que **não existe em versões antigas do Composer** (confirmado no Composer do dono); o job de backend falharia | saída do dono: `The "--ignore-severity" option does not exist` | **Resolvido** (CI-001): filtro por script que lê o JSON; também removido `--abandoned` |
| F-20 | P3 | `node_modules` do dono desatualizado: `npm test` rodou o vitest **3.2.7**, mas o `package-lock.json` fixa **5.0.3** | saída do dono; `package-lock.json` | Aberto: rodar `npm ci` (o CI já usa `npm ci`) |

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

### REPO-003 — Lookups de Usuario sem escopo (F-4)
- **Arquivos:** `backend/app/Repositories/UsuarioRepository.php` (+2 métodos), `AcessoSuporteService`, `Private/AcessoSuporte/ConcederRequest`, `MensagemService` (agora com construtor), `tests/Unit/RepositoriesEscopoTest.php` (2 métodos em `METODOS_SEM_ESCOPO`; guarda estendida a `MensagemService` e `AcessoSuporteService`), testes novos em `AcessoSuporteTest` (4), `MensagemBuscaUsuariosTest` (novo, 5) e `RepositoriesTest` (2).
- **Resultado:** migrados `buscarAdministradorPorId` (regra "é administrador" deixa de estar duplicada) e `pesquisarEmTodasAsEntidades` (busca global agora auditável); listeners e job mantidos (decisão e motivo em `repositories.md`). Comportamento HTTP inalterado.
- **Verificação:** 9 testes de caracterização escritos e **verdes antes** do refactor; guarda confirmada por mutação (falha ao reintroduzir `Usuario::query()` no `MensagemService`); suíte completa 386 verdes.
- **Pendências:** nenhuma. Observação registrada: `buscarAdministradorPorId` não filtra status (comportamento original preservado).

### SEC-006 — Só administrador ATIVO recebe Acesso de Suporte (decisão do usuário)
- **Arquivos:** `UsuarioRepository` (`buscarAdministradorPorId` → `buscarAdministradorAtivoPorId`, filtra `status = ativo`), `AcessoSuporteService`, `Private/AcessoSuporte/ConcederRequest` (mensagem "…administrador ativo."), `RepositoriesEscopoTest`, `RepositoriesTest`, `AcessoSuporteTest`.
- **Verificação:** testes escritos primeiro e vistos falhar; 4 status (bloqueado, inativo, convidado, expirado) × Request (422) e Service (`BusinessException`); suíte 391 verdes.
- **Atenção:** muda comportamento — antes um admin bloqueado podia receber a concessão.

### DEP-001 — Vulnerabilidades críticas de produção removidas (F-14)
- **Arquivo:** `frontend/package-lock.json` (11 linhas; `package.json` **inalterado**): `seroval` 1.5.6→1.6.9, `seroval-plugins` 1.5.6→1.6.9, `solid-js` 1.9.15→1.9.17 (todas transitivas do devtools do TanStack). Feita com `npm update <pacotes> --package-lock-only`; o `npm audit fix` foi descartado por regenerar dezenas de pacotes opcionais de outras plataformas.
- **Verificação:** `npm ci` limpo, `npm audit --omit=dev --audit-level=high` sem achados, Vitest 118/118, `tsc`, lint.
- **Atenção:** é uma mudança de dependência (lockfile); revise antes do merge.

### CI-001 — Pipeline de CI
- **Arquivos:** `.github/workflows/ci.yml` (novo), `frontend/eslint.config.mjs` (ignora `.agents/**` e `.claude/**`).
- **Jobs:** `backend` (PHP 8.3 + PostgreSQL 17, Pest, `composer audit`), `frontend` (`tsc`, ESLint, Vitest, `npm audit`), `frontend-build` (informativo).
- **Política de audits (decisão do usuário):** bloqueiam só severidade **alta/crítica** (`composer audit --ignore-severity=low --ignore-severity=medium`; `npm audit --omit=dev --audit-level=high`); relatório completo em passo `continue-on-error`.
- **Verificação (local, simulando o job):** YAML válido; backend com `.env.example` limpo + variáveis do job: 391 verdes; frontend `npm ci`/`tsc`/lint/Vitest verdes; `npm audit` de produção sem alta/crítica.
- **NÃO verificado:** execução no GitHub Actions; `composer audit` (o ambiente de desenvolvimento não alcança o Packagist — pode haver advisory alto/crítico no `composer.lock` que faça o primeiro run falhar); `npm run build` (o ambiente não alcança o Google Fonts; por isso o job é não bloqueante).

### FRONT-004 — Paginação com acesso direto à primeira e à última página (F-16)
- **Arquivos:** `frontend/components/data-tables/Pagination.tsx`, `pagination-pages.ts` (função pura `gerarPaginas`), `tests/components/paginacao.test.tsx` (9 testes).
- **Resultado:** barra `1 … 9 10 11 … 20` (7 itens, largura constante) com a primeira e a última página sempre visíveis; `aria-current`, rótulos acessíveis ("Ir para a última página (20)"); reticências não são botões. Mesmas props: **as 10 páginas que usam o componente não foram alteradas**. A prop `maxVisiblePages` (que ninguém usava) foi removida.
- **Verificação:** testes escritos primeiro e vistos falhar; propriedades verificadas para 4 totais × todas as páginas; Vitest 118/118, `tsc`, lint. **Não** validado visualmente no navegador.

### SEC-004 — Posse do chamado (F-13): descartada a mudança de código
- **Arquivos:** `backend/tests/Feature/ChamadoTest.php` (teste existente fortalecido: após a tentativa indevida do cliente B, sem mensagem nova, status `aberto`, `primeira_resposta_em` nulo).
- **Motivo:** `responder` é compartilhado com o Admin; endurecer o Service exigiria método/parâmetro novo para duplicar uma checagem que o controller já faz e que já é testada. Teste validado por mutação (sem a checagem do controller, falha com 201).

### CI-001 (correção de 2026-10-17) — audit do Composer independente de versão
- **Arquivos:** `.github/scripts/composer-audit-grave.php` (novo), `.github/workflows/ci.yml`.
- **Resultado:** o passo roda `composer audit --locked --format=json` e o script falha **só** com advisory `high`/`critical` (ou severidade desconhecida, que não dá para julgar); baixa/média só são reportadas. Não depende de `--ignore-severity` nem de `--abandoned`. `tools: composer:v2` fixado no setup.
- **Verificação:** script testado com 8 cenários simulados (sem advisories, alto, crítico, médio/baixo, severidade nula, misto, JSON inválido, arquivo ausente) — todos com a saída esperada; YAML válido. **Não** executado contra o Packagist real neste ambiente (o dono confirmou `composer audit --locked`: sem advisories).

### SEC-005 — Guarda automática de chaves de `authorize()`
- **Arquivo:** `backend/tests/Unit/PermissoesAuthorizeTest.php` (novo, 2 testes): toda chave usada em `->authorize('x')` precisa existir nos `*PermissaoSeeder`; um teste confere que a guarda não está vazia (>50 chaves de cada lado).
- **Verificação:** validada por mutação (chave com letra a mais num controller → falha com o nome da chave e do arquivo; restaurado). **Limite:** não pega chave que existe mas é a errada (caso F-10); isso só teste de comportamento por rota pega.

### TEST-001 — Testes de frontend dos schemas dos domínios críticos
- **Arquivo:** `frontend/tests/features/schemas.test.ts` (24 testes): usuário, grupo, empresa, contato e endereço (Admin **e** Private via `describe.each`), onboarding de grupo-empresa e troca de status.
- **Destaque:** garante que o schema de edição de empresa do **Private não repassa** `cnpj` nem `grupo_empresa_id`; CNPJ aceita máscara e alfanumérico (14 caracteres); telefone 10/11 dígitos; CEP 8 dígitos.
- **Verificação:** 3 mutações propositais (CNPJ aceitando 13, Private aceitando `cnpj`, telefone sem tamanho) foram detectadas; schemas restaurados. **Fora do escopo:** services/hooks de domínio com proxy mockado → TEST-002.

### FRONT-003 (parcial) — Avisos de lint 70 → 44
- **Arquivos:** 9 componentes/páginas (imports não usados: `BadgeCheck`, `Bell`, `CreditCard`, `ArrowLeft`, `Send`, `Card*`), `eslint.config.mjs` (`@typescript-eslint/no-unused-vars` com `ignoreRestSiblings` e prefixo `_`, que cobre `const { status, ...rest } = x` e os `_f/_u/_p` dos testes).
- **Verificação:** `tsc` limpo, Vitest 142/142, lint 0 erros. Zero mudança de comportamento.
- **Restam 44** (todos do React Compiler/Next, ver backlog FRONT-003).

### CI-002 — Primeiro run do CI no GitHub
- **Evidência:** `.github/` enviada em `d3ff70b`; a página de Actions mostra o Run 1 "completed successfully" (selo "CI - passing") com os 3 jobs concluídos com sucesso: Backend (Pest) 50 s, Frontend (tsc, lint, Vitest) 1 min 9 s, Frontend (build) 1 min 3 s. O `composer audit` filtrado por script, que era a incógnita, passou.
- **Limite da evidência:** li o **resumo** do GitHub (página pública). Os passos individuais não puderam ser lidos (a página de job é montada por JavaScript e a API pública deu *rate limit*); como os passos do `composer audit` e do build não são `continue-on-error` no backend/frontend, o job verde implica que passaram.
- **Resultado:** job `frontend-build` promovido a **bloqueante** (removido `continue-on-error`), pois passou no GitHub e localmente.
- **Pendência:** proteção da branch `main` → CI-003 (decisão do dono).

### DEP-002 — Devtools do TanStack fora das dependências de produção (F-17)
- **Arquivos:** `frontend/components/providers/react-query-provider.tsx` (import dinâmico sem SSR, só em `NODE_ENV === "development"`), `frontend/package.json` (devtools movido para `devDependencies`, 1 linha), `frontend/package-lock.json` (31 pacotes marcados `dev`, **nenhuma versão alterada**), teste novo `frontend/tests/components/react-query-provider.test.tsx` (3 testes, inclui guarda de que o devtools não volta a `dependencies`).
- **Verificação:** `tsc`, lint 0 erros, Vitest 145/145; `npm run build` ✔; `npm prune --omit=dev` removeu `react-query-devtools`, `solid-js`, `seroval` e `typescript` (restaram 184 pacotes) e o `next start` **respondeu HTTP 200** em `/esqueceu-senha`, `/primeiro-acesso` e `/redefinir-senha`, sem erros no log. **Não** testado: o modo `next dev` no navegador (o import dinâmico do devtools em desenvolvimento).
- **Descoberta:** o build local passou a ser possível simulando o Google Fonts (ver `PROJECT_GUIDE.md` §12).

## C. Tarefas em andamento

Nenhuma. (Última unidade coerente concluída: REPO-002 + SEC-001..003.)

---

## D. Backlog priorizado

Legenda de prioridade: P1 > P2 > P3. Ordem sugerida = ordem da lista.

- [ ] **CI-003 (P2) — Proteção da branch `main` (decisão do dono, ~2 minutos)**: no GitHub, Settings → Branches → Add rule para `main` → marcar "Require status checks to pass" e escolher `Backend (Pest)`, `Frontend (tsc, lint, Vitest)` e `Frontend (build)`. Assim ninguém faz merge com o CI vermelho. Só o dono do repositório pode fazer isso. Status: pendente.
- [ ] **DOC-002 (P3) — Referências quebradas em docs** (`pentest-avaliacao-seguranca.md`, `docs/pentest/**`, versão do Next em `frontend-arquitetura.md`). Restaurar os arquivos ou remover os links. Status: pendente.
- [ ] **FRONT-003 (P3) — Avisos restantes de lint (44)**: `react-hooks/incompatible-library` ×20 (`watch()` do React Hook Form e `useReactTable`; trocar por `useWatch` caso a caso), `react-hooks/set-state-in-effect` ×19, `react-hooks/static-components` ×2 (`StatusIcon` criado no render em `ChamadoConversa`), `@next/next/no-location-assign-relative-destination` ×2 (`window.location.href` em `proxy-admin.ts` e no provider de suporte), `react-hooks/purity` ×1 (`Math.random` em `components/ui/sidebar.tsx`, componente gerado do shadcn). Todos são **avisos por decisão** (`eslint.config.mjs`) e cada correção muda o fluxo de render/efeitos: fazer um arquivo por vez, com teste. Status: pendente.
- [ ] **TEST-002 (P3) — Testes de services/hooks dos domínios** (proxy mockado) para usuário, grupo e empresa, além dos schemas já cobertos. Status: pendente.
- [ ] **QUAL-001 (P3) — Decidir Pint:** adotar `pint.json` que reflita o estilo atual **ou** formatar tudo em um commit isolado. Hoje: só arquivos novos (D-005). Status: pendente, depende de decisão do dono.
- [ ] **ARCH-002 (P3) — `infer-conventions` / `.ai/rules`** — somente se o usuário pedir explicitamente (a skill proíbe rodar por conta própria). Status: pendente.

---

## E. Próxima tarefa recomendada

**CI-003 — Proteger a branch `main` com o CI** (ação sua, ~2 minutos, passo a passo em D). É o que transforma o CI de "avisa" em "impede": sem isso, qualquer push com CI vermelho ainda entra na `main`.
**O que posso implementar sozinho em seguida:** **FRONT-003** (44 avisos de React Compiler, um arquivo por vez, com teste) ou **TEST-002** (services/hooks de domínio). Pendências que dependem de decisão sua: **DOC-002** (os arquivos de pentest existem em outro lugar?), **QUAL-001** (Pint) e **ARCH-002** (`.ai/rules`).

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
| D-010 | REPO-003: migrar só os 2 lookups com problema concreto (regra duplicada; leitura global sensível); manter listeners e job | Critério do `CLAUDE.md`: abstração só com problema real; listeners/job são sistema, 1 chamador, fan-out por design | Mover todos os 5; mover nenhum |
| D-011 | SEC-004: não alterar o Service; fortalecer o teste do chamado | Controller já checa a posse (comentado e testado); mudar o Service só duplicaria a regra. O invariante real (sem efeitos colaterais) agora é testado | Novo método `responderComoCliente`; parâmetro `somenteDono` |
| D-012 | Audits do CI só bloqueiam alta/crítica; resto é relatório | Decisão do usuário: bloquear só o que for grave | Bloquear qualquer advisory |
| D-013 | Corrigir os críticos do npm por atualização cirúrgica do lockfile, não por `npm audit fix` | `audit fix` regenerava dezenas de pacotes opcionais (ruído) ; a cirúrgica mexe em 3 pacotes transitivos e não toca `package.json` | `npm audit fix`; `overrides` no `package.json` |
| D-014 | `buscarAdministradorAtivoPorId`: só admin ativo recebe Acesso de Suporte | Decisão do usuário | Manter qualquer status |
| D-015 | Paginação: primeira/última sempre visíveis + janela, no componente compartilhado, sem mudar props | Resolve em 10 páginas de uma vez, sem tocar nelas | Botões "primeira/última" separados; paginação por página |
| D-016 | Filtrar gravidade do `composer audit` por script que lê o JSON, em vez de `--ignore-severity` | A opção não existe em Composer antigo (confirmado pelo dono); o script funciona em qualquer versão. Severidade desconhecida bloqueia (não dá para julgar) | Exigir Composer recente; ignorar o resultado do audit |
| D-017 | Guarda `authorize()` × seeders por leitura de arquivos (regex) | Barata, sem banco, e a mutação prova que acusa. Limite documentado (não pega chave errada-mas-existente) | Teste só de comportamento por rota (caro para as ~94 chaves) |
| D-018 | `ignoreRestSiblings` + prefixo `_` no `no-unused-vars` | É o idioma padrão para omitir uma chave por desestruturação; evita 10 falsos avisos | Desabilitar a regra; renomear variáveis |
| D-019 | DEP-002: devtools em `devDependencies` + `next/dynamic` (`ssr: false`) só em desenvolvimento | Tira `solid-js`/`seroval` da instalação de produção; o ramo morto é descartado no build; comprovado com prune + `next start` | Manter em `dependencies`; `overrides` para versões corrigidas |
| D-020 | Job `frontend-build` do CI passa a bloquear | Passou no GitHub e localmente; build quebrado é impeditivo de deploy | Manter informativo |

---

## G. Histórico de execução

| Data | Tarefas | Principais arquivos | Verificações | Próximo passo |
|---|---|---|---|---|
| 2026-10-14 | ARCH-001, REPO-001, FRONT-001, FRONT-002, DOC-001 | `CLAUDE.md`, `docs/{PROJECT_GUIDE,IMPLEMENTATION_PLAN}.md`, `GrupoEmpresaService`, `GrupoEmpresaOnboardingTest`, `RepositoriesEscopoTest`, `frontend/lib/{media-url,proxy-admin,proxy-private}.ts` | Pest 362 ✔; Vitest 109 ✔; `tsc` ✔; ESLint 0 erros | REPO-002 |
| 2026-10-15 | REPO-002, SEC-001, SEC-002, SEC-003 | `EmpresaService`, `EscopoEntidadeService`, `EmpresaEnderecoController` (Admin/Private), 4 Form Requests Private, `EscopoEntidadeTest`, `EmpresaEnderecoAutorizacaoTest`, `docs/repositories.md` | Pest 375 ✔ (cada correção vista vermelha antes); varredura de `authorize()` × seeders ✔ | REPO-003 |
| 2026-10-16 | REPO-003 | `UsuarioRepository`, `AcessoSuporteService`, `ConcederRequest`, `MensagemService`, `RepositoriesEscopoTest`, `AcessoSuporteTest`, `MensagemBuscaUsuariosTest`, `RepositoriesTest`, `docs/repositories.md` | Pest 386 ✔; caracterização verde antes do refactor; guarda validada por mutação | CI-001 (aprovação) ou TEST-001 |
| 2026-10-16 (2ª) | SEC-006, DEP-001, CI-001, FRONT-004, SEC-004 (descartada) | `UsuarioRepository`, `AcessoSuporteService`, `ConcederRequest`, `frontend/package-lock.json`, `.github/workflows/ci.yml`, `eslint.config.mjs`, `Pagination.tsx` + `pagination-pages.ts`, `ChamadoTest`, docs | Pest 391 ✔; Vitest 118 ✔; `tsc` ✔; lint 0 erros ✔; `npm audit` prod alta/crítica ✔; CI simulado localmente (não executado no GitHub) | CI-002 |
| 2026-10-17 | CI-001 (correção), SEC-005, TEST-001, FRONT-003 (parcial) | `.github/scripts/composer-audit-grave.php`, `ci.yml`, `PermissoesAuthorizeTest`, `tests/features/schemas.test.ts`, `eslint.config.mjs` + 9 componentes | Pest 393 ✔; Vitest 142 ✔; `tsc` ✔; lint 0 erros / 44 avisos; mutações detectadas; script de audit com 8 cenários | CI-002 (push do `.github/`) |
| 2026-10-17 (2ª) | CI-002, DEP-002 | `ci.yml` (build bloqueante), `react-query-provider.tsx`, `package.json`, `package-lock.json`, `react-query-provider.test.tsx`, docs | Run 1 do CI verde (GitHub); Vitest 145 ✔; `tsc` ✔; lint 0 erros; build ✔; prune + `next start` HTTP 200 | CI-003 (dono) / FRONT-003 |
