# CLAUDE.md — Laravel Next Starter

Regras permanentes para sessões do Claude Code. Curto de propósito: detalhes ficam em `docs/`.
Se algo aqui contradisser o código real, **o código vence** — investigue e corrija a doc.

## Stack (verificada em `composer.json`/`package.json`)

- **Backend** (`backend/`): PHP ^8.3 (Sail usa 8.4), Laravel 13, PostgreSQL 17, JWT (`tymon/jwt-auth`), Pest 4, Pint, Swagger (`l5-swagger`).
- **Frontend** (`frontend/`): Next.js 16 (App Router, atua como BFF), React 19, TypeScript, Tailwind 4, shadcn/ui, TanStack Query/Table, React Hook Form + Zod 4, Vitest.
- Dois contextos de acesso espelhados nas duas camadas: **Admin** e **Private** (por empresa).

## Como começar qualquer tarefa (sem reler o repositório inteiro)

1. Leia `docs/IMPLEMENTATION_PLAN.md` → seção **A (estado)** e **E (próxima tarefa)**.
2. Leia só as seções relevantes de `docs/PROJECT_GUIDE.md`.
3. Leia as skills aplicáveis (tabela abaixo) **antes** de editar.
4. Inspecione apenas os arquivos da tarefa + vizinhos (siga o padrão dos arquivos irmãos).
5. Amplie a análise só se: mudar arquitetura compartilhada, houver risco de segurança/integridade, a doc contradisse o código, a refatoração tocar vários módulos, ou os testes indicarem problema sistêmico.

## Skills (leia o `SKILL.md` e os arquivos `rules/` que o índice mapear para a tarefa)

| Tarefa | Skill | Local |
|---|---|---|
| Escrever/alterar PHP Laravel (controller, model, service, repository, request, migration, job) | `laravel-best-practices` | `backend/.claude/skills/laravel-best-practices/SKILL.md` |
| Escrever/revisar testes Pest | `testing-best-practices` | `backend/.claude/skills/testing-best-practices/SKILL.md` |
| Registrar convenções via Boost (`.ai/rules`) | `infer-conventions` | só quando o usuário pedir explicitamente |
| Deploy no Laravel Cloud | `deploying-to-cloud` | só nesse contexto |
| Verificar comportamento em runtime do Next | `next-dev-loop` | `frontend/.claude/skills/next-dev-loop/SKILL.md` |
| Reduzir bundle / carga inicial | `next-bundle-optimizer` | `frontend/.claude/skills/next-bundle-optimizer/` |
| Cache Components / Partial Prefetching | `next-cache-components-*`, `next-partial-prefetching-*` | só se o usuário pedir adoção/otimização |

Notas: `backend/.claude`, `.agents` e `.cursor` têm o **mesmo conteúdo** (use `.claude`). No frontend `.claude/skills` são symlinks para `.agents/skills`. `docs-diagrams` é da documentação do Next.js, não se aplica aqui. **Não existe skill de React/shadcn/design**: no frontend, o padrão é o código existente + `docs/frontend-arquitetura.md`.
Também leia `backend/AGENTS.md` ao trabalhar no backend.

## Arquitetura aprovada

**Backend** — fluxo: `Route → Controller → Form Request → DTO → Service → (Repository) → Model → Resource`.

| Camada | Faz | Não faz |
|---|---|---|
| Controller | `authorize('chave')`, chama Service, devolve Resource; atributos OpenAPI | regra de negócio, consulta extensa |
| Form Request | validação de entrada | autorização por chave (fica no controller) |
| DTO (`app/DTO/{Recurso}`) | normaliza dados validados (`criarParaCadastro`, `paraPersistencia`) | lógica |
| Service | regra de negócio, `DB::transaction`, eventos, `BusinessException`, orquestração | montar consulta de Usuario/Grupo; ler `Auth::user()` p/ decidir tenant |
| Repository | `where/with/paginate/exists/find/create` de **uma** entidade | regra de negócio, transação, evento, `Auth::user()` |
| Model | relacionamentos, casts, scopes | regra de negócio |

**Repository Pattern (decisão oficial — detalhes em `docs/repositories.md`)**
- Classes concretas em `app/Repositories`, **sem interface e sem `BaseRepository`**, injetadas pelo container.
- Só existe para dados **com dono** (tenant) ou consulta realmente complexa. Hoje: `GrupoRepository`, `UsuarioRepository`.
- Todo método de leitura de dado com dono recebe `EscopoEntidade` como 1º parâmetro (obtido por `EscopoEntidadeService::atual()`); o filtro vive em **um** método privado `noEscopo()`.
- Método sem escopo por natureza só entra na lista `METODOS_SEM_ESCOPO` de `tests/Unit/RepositoriesEscopoTest.php`, com justificativa.
- **Novo Repository só se TODAS forem verdade:** a consulta já existe num Service; é acesso a dados; tem dono ou complexidade real; o Service fica mais legível. Antes de criar qualquer abstração, escreva qual problema concreto ela resolve.
- Identidade × contexto: `Auth::user()` = quem é; `EscopoEntidadeService::atual()` = de quem são os dados. Só `EscopoEntidadeService` lê `AcessoSuporteContexto`.

**Frontend** — `domains/{admin|private}/{recurso}/{types,services,hooks,mappers}` = **dados**; `features/{admin|private}/{recurso}/{components,schemas}` = **UI**; `components/` = apenas o realmente compartilhado. O navegador **nunca** chama o Laravel: tudo passa por `lib/proxy-admin.ts` / `lib/proxy-private.ts` → `app/api/proxy/*` (BFF). Estado de servidor = TanStack Query; formulários = RHF + Zod. O backend é a autoridade de validação/autorização; o front não duplica regra de negócio.

## Comandos oficiais

Backend (sempre via Sail, em `backend/`):
- Testes: `./vendor/bin/sail artisan test --compact` (ou `./vendor/bin/pest`; o mais estreito primeiro: `--filter=` / caminho do arquivo)
- Formatação: Pint **só em arquivos novos** — ver "Conflitos conhecidos".
- Rotas: `./vendor/bin/sail artisan route:list`

Frontend (em `frontend/`, Node ≥ 22.22.2):
- `npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run build`

CI: `.github/workflows/ci.yml` roda as mesmas suítes (+ `composer audit`/`npm audit`, que só bloqueiam severidade **alta/crítica**). Antes de concluir uma tarefa, rode localmente o equivalente do que o CI vai rodar. Mudança em `package-lock.json`/`composer.lock` só com justificativa registrada no plano (preferir atualização cirúrgica à regeneração).

## Segurança (não enfraquecer)

- Autorização por chave no controller (`$this->authorize('admin.x.y')`); `Gate::before` em `AuthServiceProvider`.
- Dado com dono: nunca consultar sem escopo — **inclusive em Form Requests** (`EscopoEntidadeService::empresaVisivel()` antes de checar "já existe…") e em métodos `excluir`/`ativar`/`restaurar`. Resposta de erro não pode distinguir "existe em outra empresa" de "não existe".
- `authorize('chave')`: use a chave do **recurso e da ação** do próprio método (copiar de um controller irmão e esquecer de trocar já gerou o bug F-10); ao criar rota, teste com um usuário que tenha **só** essa permissão (200) e outro com permissão de recurso vizinho (403). Não aceitar `entidade_id`/`grupo_empresa_id` do payload sem `EscopoEntidadeService::validarPertence`.
- Usar `validated()`; nunca `$request->all()`. HTML de usuário passa por `HtmlSanitizer`/DOMPurify.
- JWT só em cookie `httpOnly` via BFF; `lib/proxy-guard.ts` restringe destino/métodos/headers. Não ampliar sem justificativa.
- Uploads: somente via `FileStorageInterface`. Anexos de chamado: privados + link assinado.
- Não alterar `.env`, credenciais, banco ou dados reais sem pedido explícito. Não alterar dependências sem aprovação.

## Regras para novas funcionalidades

- Siga o módulo irmão mais parecido (nomes, namespaces, Request/DTO/Resource/Controller em `Admin`/`Private`). Nomes de domínio em **português**, como o resto do projeto.
- Use só as camadas necessárias. Proibido sem justificativa concreta: interface por hábito, Repository por obrigação, Service que só repassa chamada, DTO para dado trivial, BaseRepository/Generic, mover código funcional sem benefício.
- Mudança de comportamento ⇒ teste Pest (backend) ou Vitest (frontend). Teste de caracterização **antes** de refatorar código sem cobertura.
- Mudou endpoint ⇒ atualize os atributos OpenAPI do controller.
- Uma unidade coerente por vez; pequenas mudanças verificáveis; sem refatorar o que não faz parte da tarefa.

## Conflitos conhecidos entre instruções (decisões já tomadas — não rediscutir)

- `backend/AGENTS.md` diz "só crie docs se pedido" → vale para **docs novas fora do plano**; `CLAUDE.md` e `docs/{PROJECT_GUIDE,IMPLEMENTATION_PLAN}.md` foram pedidos explicitamente e **devem** ser mantidos.
- `backend/AGENTS.md` manda `pint --dirty`, mas 340 de 501 arquivos já não seguem o Pint. Reformatar arquivo legado gera diff enorme → **formate só arquivos novos** (`pint caminho/novo.php`); em arquivo existente, siga o estilo local.
- `backend/AGENTS.md` cita `.ai/rules`, que **não existe** neste repositório; ignore até alguém rodar `infer-conventions`.
- Skill diz "pergunte ao usuário antes de rodar a suíte completa"; aqui, rode a suíte completa antes de marcar uma tarefa como concluída quando o ambiente permitir.

## Critério de tarefa concluída

Código implementado seguindo as convenções · skills consultadas · testes relevantes **executados e verdes** (se não der para executar, registre o motivo e use o status "implementada, não verificada") · lint/tsc sem erros novos · sem regressão conhecida · docs afetadas atualizadas · `docs/IMPLEMENTATION_PLAN.md` reflete o estado real (seções A–G).

## Ao concluir cada tarefa (obrigatório)

Atualizar `docs/IMPLEMENTATION_PLAN.md` (checkbox, seção B, A, E e G) e, se mudou arquitetura/fluxo/comando, `docs/PROJECT_GUIDE.md` ou o doc específico (`docs/repositories.md`, `docs/testes.md`...). Nunca marcar `[x]` sem ter verificado.
