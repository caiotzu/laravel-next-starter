# Tarefas e atualizações de dependências

Plano para manter o projeto atualizado, em etapas pequenas (um PR por etapa).
Levantamento feito em **13/11/2026**. Versões conferidas no registro do npm e nas tags dos repositórios.

> Regra do projeto: mudança em `package-lock.json` / `composer.lock` só com justificativa. A justificativa de cada etapa está descrita abaixo.

## Como validar cada etapa

| Onde | Comandos |
|---|---|
| Frontend (`frontend/`) | `npx tsc --noEmit` · `npm run lint` · `npm test` · `npm run build` · `npm run e2e` (o E2E **não** roda no CI) |
| Backend (`backend/`) | `./vendor/bin/sail artisan test --compact` · `./vendor/bin/pint --test` |
| Levantar o que está desatualizado | Frontend/backend npm: `npm outdated` · Composer: `./vendor/bin/sail composer outdated --direct` |

## Versões que ficam fixas (de propósito)

Os intervalos com `^` já impedem salto de versão maior. Estes itens só mudam na etapa indicada:

| Pacote | Fica em | Motivo | Etapa |
|---|---|---|---|
| `react-is` | 19.3.1 (exata) | O Recharts 3 usa o `react-is`; ele precisa acompanhar a versão do React (sobe junto com `react`/`react-dom`) | — |
| `@tanstack/react-table` | 8.x | A v9 é uma reescrita; só `components/data-table.tsx` usa | 9 |
| `typescript` | `~6.0.3` (só patches da 6.0) | O `typescript-eslint` 8.72 exige TypeScript `<6.1.0`, e a 7.x (compilador nativo) é incompatível com ele; minors do TypeScript costumam trazer mudanças de comportamento, então não usar `^` | 8 |
| `eslint` | 9.x | `eslint-plugin-import` só declara suporte até o ESLint 9 | 10 |
| `@types/node` | 22.x | O runtime é Node 22 | — |
| `jsdom` | 30.x | A 31.0.1 saiu em 13/11/2026; esperar amadurecer | 10 |
| `next`, `eslint-config-next`, `react`, `react-dom` | versão exata | Já eram fixas; mantêm-se fixas e sobem juntas | — |

## Etapas

### Etapa 1 — Segurança e atualizações seguras do frontend ✅ feita

Justificativa: o Next.js 16.4.4 está abaixo do patch de segurança de 03/11/2026 (corrigido na 16.4.5: 7 falhas, 1 alta). Uma delas (GHSA-pc58-hwjq-p385) envolve aplicações self-hosted que repassam respostas obtidas via `fetch`, padrão do BFF em `app/api/proxy/*`.

- [x] `next` 16.4.4 → 16.4.6 e `eslint-config-next` 16.4.4 → 16.4.6 (exatas, sobem juntas)
- [x] `react` e `react-dom` 19.1.0 → 19.3.1 (exatas)
- [x] `npm update` dentro dos ranges (Tailwind 4.3.5, TanStack Query 5.107, Tiptap 3.33, Vitest 5.1, Playwright 1.65, Radix, Base UI, axios, react-hook-form, jsdom 30.1.3 etc.)
- [x] Remover `@types/dompurify` (depreciado; o `dompurify` já traz os próprios tipos)
- [x] `@hookform/resolvers` 5.9.1 → 7.0.6 (o código do `zodResolver` é idêntico ao da 5.9.1)

Validação (13/11/2026, máquina local): `npm ci`, `tsc`, `lint`, `npm test` (701 testes), `npm run build` (Next.js 16.4.6) e `npm run e2e` (63 testes, incluindo CSP com nonce) passaram.

- [x] Correção de um teste E2E instável (`e2e/multiusuario.e2e.ts`, "Admin e Private no mesmo computador…"): ele lia o Redis logo após clicar em "Sair", sem esperar o logout terminar; agora usa `expect.poll`.
- Requisito local do E2E: `redis-server` instalado (`brew install redis`); ele sobe um Redis próprio na porta 6390.

### Etapa 1b — `npm` do backend (Vite) ✅ feita

Justificativa: `npm audit` apontava 3 críticos e 8 altos (`concurrently`/`shell-quote`, `axios`, `vite`, `tar`, `postcss`, `rollup`…). Esse `package.json` é o esqueleto do Laravel e só o `welcome.blade.php` usa `@vite`.

- [x] `npm update` dentro dos ranges: `vite` 7.3.8, `axios` 1.21.1, `tailwindcss`/`@tailwindcss/vite` 4.3.5, `laravel-vite-plugin` 2.1.0, `concurrently` 9.2.5
- Resultado: `npm audit` → 0 vulnerabilidades; `npm run build` OK.
- [ ] Decidir se o pipeline Vite deve continuar no backend (não é usado pelo CI nem pela API).

### Etapa 2 — `lucide-react` 0.546 → 1.72 ✅ feita

- [x] `lucide-react` `^0.546.0` → `^1.72.0` (124 arquivos importam).
- [x] `npx tsc --noEmit` sem erros: nenhum ícone usado foi removido na v1.
- [x] `lint` e `npm test` (701 testes) passaram.
- [ ] Conferir no navegador (visual): ícones do menu lateral, botões e tabelas.

### Etapa 3 — `recharts` 2.15 → 3.10 ✅ feita (conferir visualmente)

- [x] `recharts` `^2.15.4` → `^3.10.1`.
- [x] `react-is` 19.3.1 adicionado como dependência exata (o Recharts 3 usa o `react-is`; sem isso ele resolvia o 17.0.2 vindo do Testing Library).
- [x] `components/ui/chart.tsx`: `ChartTooltipContent` agora usa `Partial<TooltipContentProps>` e `ChartLegendContent` usa `DefaultLegendContentProps`; a `key` do item do tooltip aceita `dataKey` em função.
- [x] `components/chart-area-interactive.tsx`: `labelFormatter` recebe `ReactNode` na v3, então o valor passa por `String(...)` antes do `new Date`.
- [x] `tsc`, `lint` e `npm test` (701 testes) passaram.
- [ ] Conferir no navegador: gráficos do dashboard (`/admin/dashboard` e `/dashboard`), tooltip ao passar o mouse, legenda e o gráfico de área do `data-table`. Pontos de atenção: `accessibilityLayer` agora é `true` por padrão (borda de foco ao navegar por teclado), ordem de sobreposição do Tooltip e os seletores `.recharts-*` do `chart.tsx`.
- Guia oficial: https://github.com/recharts/recharts/wiki/3.0-migration-guide

### Etapa 4 — Backend: Composer dentro do range ✅ feita

Comando usado (nominal, para não mexer no Pest nem no `l5-swagger`):

```bash
./vendor/bin/sail composer update laravel/framework laravel/sanctum laravel/tinker laravel/pail laravel/sail laravel/pint laravel/boost nunomaduro/collision tymon/jwt-auth laravel-lang/lang --with-all-dependencies
```

- [x] `laravel/framework` 13.34.0 → 13.42.0 · `laravel/sanctum` 4.4.0 · `laravel/tinker` 3.1.0 · `laravel/pail` 1.3.0 · `laravel/sail` 1.70.0
- [x] `laravel/pint` 1.32.3 · `laravel/boost` 2.10.4 · `nunomaduro/collision` 8.9.6 · `tymon/jwt-auth` 2.3.1 · `laravel-lang/lang` 15.38.0
- [x] Só o `composer.lock` mudou (`composer.json` e o `content-hash` ficaram iguais): 44 pacotes atualizados, 2 adicionados (`symfony/polyfill-php82`, `symfony/polyfill-time`) e 3 removidos (`ralouphie/getallheaders`, `symfony/polyfill-php83`, `dragon-code/pretty-array`).
- Dependências indiretas que subiram de versão maior (permitidas pelo `laravel/framework` 13.42): **Guzzle 7.15 → 8.5** (e `guzzlehttp/promises` 3, `psr7` 3) e **Symfony 7.4 → 8.1** (`console`, `translation`, `mailer`, `process`…).
- Não mudaram, de propósito: `pestphp/pest` 4.7.8, `phpunit/phpunit` 12.5.33, `darkaonline/l5-swagger` 11.1.0 e `zircote/swagger-php` 6.11.0 (etapas 5 e 6).

Validação (13/11/2026, Sail): `artisan test --compact` → 461 testes (2674 asserções) passaram; `pint --test` → 513 arquivos PASS; `composer audit` → sem vulnerabilidades. Chamadas reais ao ViaCEP e à BrasilAPI (`Http::` sobre o Guzzle 8) funcionaram.

- Avisos esperados, sem ação: `dragon-code/contracts` e `dragon-code/support` aparecem como abandonados (dependências indiretas do `laravel-lang/publisher`, de dev); avisos de PSR-4 em `app/OpenApi/Shared/*.php` (várias classes por arquivo, só para o Swagger); `storage:link ... already exists` no `post-update-cmd`.
- Não validado: `AmazonSesService` (usa `Http::` sobre o Guzzle 8) exige credenciais reais da AWS.

### Etapa 5 — Backend: Pest 5 ✅ feita

Comando usado:

```bash
./vendor/bin/sail composer require pestphp/pest:^5.0 pestphp/pest-plugin-laravel:^5.0 --dev --with-all-dependencies
```

- [x] `pestphp/pest` `^4.0` → `^5.0` (4.7.8 → 5.3.5) e `pestphp/pest-plugin-laravel` `^4.0` → `^5.0` (4.1.0 → 5.0.1). Exige PHP ≥ 8.4; o projeto usa 8.5.
- [x] PHPUnit 12.5.33 → **13.4.5**, `php-code-coverage` 12 → 14, `paratest` 7.28 e os plugins `arch`, `mutate` e `profanity` na série 5. Removidos: `composer/pcre`, `composer/xdebug-handler`, `theseer/tokenizer`.
- [x] `phpunit.xml` não precisou de ajuste (não foi necessário rodar `pest --migrate-configuration`).
- [x] Menções a "Pest 4" trocadas por "Pest 5": `CLAUDE.md`, `backend/README.md`, `docs/backend.md` e `docs/testes.md`.

Validação (14/11/2026, Sail): `artisan test --compact` → 461 testes (2674 asserções) passaram, igual à etapa 4; `composer audit` → sem vulnerabilidades. O CI continua com `vendor/bin/pest --compact`, sem mudança.

### Etapa 6 — Backend: `l5-swagger` 11.1 → 11.3 ✅ feita

Comando usado (o `swagger-php` foi fixado em `^6.12` no mesmo comando, para o Composer não escolher a 7.x):

```bash
./vendor/bin/sail composer require zircote/swagger-php:^6.12 darkaonline/l5-swagger:^11.3 --with-all-dependencies
```

- [x] `darkaonline/l5-swagger` 11.1.0 → 11.3.1 · `zircote/swagger-php` 6.11.0 → 6.20.4 (série 6, por causa da trava) · `swagger-api/swagger-ui` 5.33.1 → 5.35.0 · `symfony/type-info` 7.4.20 → 8.1.11 · `radebatz/type-info-extras` 1.0.14.
- [x] `composer.json` agora declara `"zircote/swagger-php": "^6.12"` em `require`. Com a etapa 7 feita, essa linha virou `^7.0` (veja abaixo) e continua sendo a trava que impede o Composer de subir para a 8.x.
- [x] Documentação gerada antes e depois (`l5-swagger:generate --all`) e comparada com `diff`: o documento **admin** ficou idêntico; no documento **público** só mudou a representação de duas propriedades `nullable` que apontam para outro schema (a 6.20 passou a incluir uma alternativa `{ "type": "object", "nullable": true, "enum": [null] }` dentro do `oneOf`). Nenhuma rota, schema ou componente foi removido.

Validação (14/11/2026, Sail): `artisan test --compact` → 461 testes (2674 asserções) passaram; `composer audit` → sem vulnerabilidades.

- [ ] Conferir visualmente em `/api/documentation` (público) e `/api/documentation/admin` que o Swagger UI abre e que as duas propriedades acima aparecem como "nullable".

### Etapa 7 — Backend: `swagger-php` 6 → 7 ✅ feita

Comando usado:

```bash
./vendor/bin/sail composer require zircote/swagger-php:^7.0 --with-all-dependencies
```

- [x] `zircote/swagger-php` 6.20.4 → **7.6.0** (só esse pacote mudou no `composer.lock`). O `composer.json` agora declara `"zircote/swagger-php": "^7.0"`.
- [x] Sem mudança de configuração: o `config/l5-swagger.php` não define `mode` nem `open_api_spec_version`, então o `l5-swagger` 11.3 continua usando o modo `classic` e o OpenAPI `3.0.0`. Por isso os padrões novos da 7 (modo híbrido, OpenAPI 3.1.0 e remoção de componentes não referenciados) **não** se aplicam.
- [x] Documentação gerada antes (6.20.4) e depois (7.6.0) e comparada com `diff`: **idêntica** nos dois documentos (público e admin).

Validação (14/11/2026, Sail): `artisan test --compact` → 461 testes (2674 asserções) passaram; `composer audit` → sem vulnerabilidades.

- [ ] Conferir visualmente em `/api/documentation` e `/api/documentation/admin`.
- **Atenção para o futuro:** o modo `classic` e os atributos `OpenApi\Attributes` (usados em ~50 arquivos, ~2.500 atributos) ficam depreciados na 7 e **são removidos na 8**. A trava `^7.0` impede a subida automática para a 8. Quando a 8 for considerada, será necessário migrar para os atributos `OpenApi\Spec` (o guia oficial indica um conjunto de regras do Rector para reescrevê-los); isso deve ser uma tarefa própria, com revisão.
- Não definir `L5_SWAGGER_SCAN_MODE` nem `L5_SWAGGER_OPEN_API_SPEC_VERSION` no `.env`: eles mudariam a saída (modo híbrido e OpenAPI 3.1.0 trazem as diferenças descritas no guia de migração do `swagger-php`).

### Etapa 8 — `typescript` 5.9 → 6.0 ✅ feita

- [x] `typescript` `^5` → `~6.0.3` (instalado 6.0.3). O `~` é intencional: mantém só patches da 6.0, porque o `typescript-eslint` 8.72.2 aceita no máximo `<6.1.0`. **Não usar a 7.x** enquanto o `typescript-eslint`/`eslint-config-next` não a suportarem.
- [x] `tsconfig.json` **sem alteração**: o `tsc --noEmit` passou direto na 6.0.3 (o novo padrão `types: []` não afetou, porque os tipos de Node/Next/React chegam por `next-env.d.ts` e pelos imports).
- [x] `npx tsc --noEmit` (com o cache `tsconfig.tsbuildinfo` removido), `npm run lint`, `next typegen` e `npm test` (701 testes) passaram.
- [x] Build: o passo "Running TypeScript" do Next 16.4.6 terminou sem erros com a 6.0.3 (build conferido com `next build --webpack`, o passo de tipos é o mesmo do `--turbopack`).
- Observação (já existia no TypeScript 5.9.3): a pasta `tests/` é excluída do `tsconfig.json` e tem 5 erros de tipo (`nav-main.test.tsx:85`, `services-crud.test.ts:121-122`, `usuario-forms.test.tsx:170` e um `@ts-expect-error` sem uso em `verificar-producao.test.ts:3`). Não vêm da atualização; podem ser corrigidos numa limpeza separada.
- [ ] Conferir localmente: `npm run build` (Turbopack) e `npm run e2e`.

### Etapa 9 — `@tanstack/react-table` 8 → 9 (adiar)

- [ ] Verificar se `components/data-table.tsx` (exemplo do dashboard) ainda é necessário; se não, remover a dependência em vez de migrar.
- [ ] Se for mantido, planejar a migração própria (reescrita da API) com o guia oficial.

### Etapa 10 — Acompanhar (sem ação agora)

- [ ] `eslint` 10: esperar `eslint-config-next` e `eslint-plugin-import` declararem suporte.
- [ ] `jsdom` 31: reavaliar em algumas semanas.
- [ ] `vite` 8 + `laravel-vite-plugin` 3 (backend): sobem juntos; só se o pipeline for mantido. `concurrently` 10 exige Node ≥ 22.
- [ ] Avisos moderados do `npm audit` do frontend (`typescript-eslint`, `minimatch`, `postcss-selector-parser`): ferramentas de build/lint, sem correção publicada. Não usar `npm audit fix --force` (sugere rebaixar o `eslint-config-next`).

## Rotina recorrente

- [ ] Mensalmente: `npm outdated` (frontend e backend) e `composer outdated --direct`.
- [ ] Acompanhar os avisos de segurança do Next.js (releases programados) e do Laravel.
- [ ] Atualizar este arquivo a cada etapa concluída.
