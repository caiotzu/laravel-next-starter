# CLAUDE.md — Laravel Next Starter

Regras permanentes para a IA. Curto de propósito: detalhes ficam em `docs/`.
Se algo aqui contradisser o código, **o código vence**: investigue e corrija a doc.

## Stack

- **Backend** (`backend/`): PHP ^8.5, Laravel 13, PostgreSQL 17, JWT (`tymon/jwt-auth`), Pest 4, Pint, Swagger.
- **Frontend** (`frontend/`): Next.js 16 (App Router, BFF), React 19, TypeScript, Tailwind 4, shadcn/ui, TanStack Query/Table, React Hook Form + Zod 4, Vitest.
- Dois contextos espelhados nas duas camadas: **Admin** e **Private** (por empresa).

## Como começar uma tarefa

1. Leia só o doc do assunto (tabela abaixo) e as skills aplicáveis.
2. Inspecione apenas os arquivos da tarefa + vizinhos; siga o padrão dos irmãos.
3. Amplie a análise só se: mudar arquitetura compartilhada, houver risco de segurança, a doc contradisser o código ou os testes indicarem problema sistêmico.

## Onde ler cada assunto

| Assunto | Documento |
|---|---|
| Rodar na máquina | `docs/instalacao-local.md` |
| Publicar e conferir produção | `docs/implantacao-servidor.md`, `docs/checklist-producao.md` |
| Backend: camadas, auth, permissões, multi-tenant, banco, filas, API | `docs/backend.md` |
| Frontend: BFF, pastas, convenções, lint | `docs/frontend.md` |
| Dispositivos de segurança | `docs/seguranca.md` |
| Upload de arquivos (disco/S3) | `docs/armazenamento-de-arquivos.md` |
| Testes e CI | `docs/testes.md` |
| Validação manual | `docs/roteiro-de-validacao.md` |

## Skills

| Tarefa | Skill (leia o `SKILL.md` e as `rules/` do índice) |
|---|---|
| PHP/Laravel (controller, model, service, request, migration, job) | `backend/.claude/skills/laravel-best-practices` |
| Testes Pest | `backend/.claude/skills/testing-best-practices` |
| Runtime do Next | `frontend/.claude/skills/next-dev-loop` |
| Bundle / carga inicial | `frontend/.claude/skills/next-bundle-optimizer` |

Notas: `backend/.claude`, `.agents` e `.cursor` têm o mesmo conteúdo (use `.claude`). No frontend, `.claude/skills` são symlinks para `.agents/skills`. Não existe skill de React/shadcn: siga o código existente e `docs/frontend.md`. Leia também `backend/AGENTS.md` ao trabalhar no backend.

## Arquitetura aprovada

**Backend:** `Route → Controller → Form Request → DTO → Service → (Repository) → Model → Resource`.

| Camada | Faz | Não faz |
|---|---|---|
| Controller | `authorize('chave')`, chama o Service, devolve Resource, OpenAPI | regra de negócio |
| Form Request | valida a entrada | autoriza |
| DTO | normaliza dados validados | lógica |
| Service | regra, `DB::transaction`, eventos, `BusinessException` | consulta de Usuario/Grupo; `Auth::user()` para decidir empresa |
| Repository | consulta de **uma** entidade | regra, transação, evento |

**Repositories:** classes concretas, **sem interface e sem `BaseRepository`**; só para dados com dono (hoje `GrupoRepository` e `UsuarioRepository`). Toda leitura recebe `EscopoEntidade` como 1º parâmetro (de `EscopoEntidadeService::atual()`); o filtro vive em **um** método privado `noEscopo()`; exceções entram em `METODOS_SEM_ESCOPO` (`RepositoriesEscopoTest`). Novo Repository só se a consulta já existe num Service, é acesso a dados, tem dono ou complexidade real **e** o Service fica mais legível.

**Frontend:** `domains/` = dados · `features/` = UI · `components/` = só o compartilhado. O navegador **nunca** chama o Laravel: tudo passa por `lib/proxy-admin.ts` / `proxy-private.ts` → `app/api/proxy/*`. O backend é a autoridade de validação e autorização.

## Comandos

| Onde | Comando |
|---|---|
| Backend (em `backend/`) | `./vendor/bin/sail artisan test --compact` (mais estreito primeiro: `--filter=`) |
| Backend | `pint caminho/novo.php` **só em arquivo novo** |
| Frontend (em `frontend/`, Node ≥ 22.22.2) | `npm test` · `npx tsc --noEmit` · `npm run lint` · `npm run build` · `npm run e2e` |

O CI roda as mesmas suítes (+ `composer audit` e `npm audit`, que só bloqueiam severidade alta/crítica). **O E2E não roda no CI.** Antes de concluir, rode localmente o equivalente. Mudança em `package-lock.json`/`composer.lock` só com justificativa.

## Segurança (não enfraquecer)

- Autorização por chave no controller. Use a chave do **recurso e da ação** do próprio método; ao criar rota, teste com usuário que tenha **só** essa permissão (200) e outro com permissão vizinha (403).
- Dado com dono: nunca consultar sem escopo, **inclusive em Form Requests** (`EscopoEntidadeService::empresaVisivel()`) e em `excluir`/`ativar`/`restaurar`. O erro não pode distinguir "existe em outra empresa" de "não existe". Não aceitar `entidade_id`/`grupo_empresa_id` do payload sem `validarPertence`.
- Use `validated()`, nunca `$request->all()`. HTML de usuário passa por `HtmlSanitizer` (backend) e `lib/sanitize-html.ts` (frontend; sem `USE_PROFILES`).
- Frontend: importe o zod de `@/lib/zod`; sem scripts inline, `eval` nem hosts externos de script/imagem/fonte (a CSP bloqueia e o `e2e/csp.e2e.ts` falha).
- JWT **só no servidor** (Redis). `lib/proxy-guard.ts` recusa `login`, `2fa/verificar`, `refresh` e `logout`. Nunca grave token em cookie, resposta, log ou storage do navegador.
- Uploads só por `FileStorageInterface`; anexos de chamado são privados com link assinado.
- Não altere `.env`, credenciais, banco ou dados reais sem pedido explícito.

## Regras para novas funcionalidades

- Siga o módulo irmão mais parecido; nomes de domínio em **português**.
- Use só as camadas necessárias. Proibido sem justificativa: interface por hábito, Repository por obrigação, Service que só repassa, DTO para dado trivial.
- Mudou comportamento ⇒ teste (Pest ou Vitest). Teste de caracterização **antes** de refatorar código sem cobertura.
- Mudou endpoint ⇒ atualize os atributos OpenAPI.
- Uma unidade coerente por vez; sem refatorar o que não é da tarefa.
- **Lint do frontend em 0 avisos.** Exceção só com `// eslint-disable-next-line <regra> -- <motivo>`.
- Mudou BFF de auth, `lib/session/`, `proxy.ts`, cookies ou cabeçalhos ⇒ rode `npm run build && npm run e2e` e `REDIS_URL=… npm test` (precisa de Redis).

## Decisões já tomadas (não rediscutir)

- `backend/AGENTS.md` diz "só crie docs se pedido": vale para docs **novas**; `CLAUDE.md`, `docs/` e READMEs devem ser mantidos atualizados.
- `backend/AGENTS.md` manda `pint --dirty`, mas a maioria dos arquivos legados não segue o Pint: **formate só arquivos novos**.
- `backend/AGENTS.md` cita `.ai/rules`, que não existe aqui; ignore.
- Rode a suíte completa antes de marcar uma tarefa como concluída, quando o ambiente permitir.

## Critério de tarefa concluída

Convenções seguidas · skills consultadas · testes relevantes **executados e verdes** (se não der, registre o motivo e diga "implementada, não verificada") · lint/tsc sem erros novos · docs afetadas atualizadas. Nunca descreva como pronto o que não foi verificado.
