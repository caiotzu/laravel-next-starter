# Testes

## Backend (Pest)

O backend usa [Pest](https://pestphp.com/) 4 (`pestphp/pest` + `pestphp/pest-plugin-laravel`), configurado em `backend/phpunit.xml` com as suites `Unit` e `Feature` (`backend/tests/Unit`, `backend/tests/Feature`). Em ambiente de teste, o `phpunit.xml` força `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`, `MAIL_MAILER=array`, `BCRYPT_ROUNDS=4` e `DB_DATABASE=testing` (o banco `testing` é criado pelo script de inicialização do PostgreSQL no `docker-compose.yml` do Sail).

```bash
./vendor/bin/sail artisan test
# ou
composer test
```

### O que está coberto

Os testes de *feature* exercitam a API de ponta a ponta (rota → middleware → controller → service → banco), com foco nos pontos de maior risco: autenticação, isolamento entre contextos e regras de segurança.

| Arquivo | Casos declarados | Foco |
|---|---:|---|
| `AuthFluxoTest.php` | 18 (× 2 audiências = 36 execuções) | Login com/sem 2FA, primeiro acesso, esqueceu/redefinir senha, refresh, logout, `/me` — rodado para **Admin** e **Private** |
| `SegurancaTest.php` | 12 | Isolamento Admin × Private sem `authorize()`, resposta idêntica para e-mail inexistente, expiração do `temp_token` do 2FA, anti-replay de TOTP, troca de e-mail exige senha, encerramento de sessões ao trocar senha, sanitização de conteúdo de release, anexo por link assinado fora do disco público |
| `EscopoEntidadeTest.php` | 17 | Isolamento multi-tenant: Private A não lê/altera dados de B; Admin irrestrito × Admin em modo de suporte |
| `AcessoSuporteTest.php` | 16 | Concessão, expiração, revogação, encerramento, uso por outro admin, auditoria com `acesso_suporte_id`, comando agendado de expiração |
| `UsuarioTest.php` | 12 | Regras de cadastro/atualização/status de usuários |
| `ChamadoTest.php` | 16 | Abertura, resposta, anexos, status/prioridade/responsável |
| `BannerTest.php` | 29 | CRUD, período, direcionamento, imagens e links, restauração |
| `ReleaseTest.php` | 8 | Rascunho/publicação e visibilidade por contexto |
| `DashboardTest.php` | 5 | KPIs do dashboard Admin |
| `ExampleTest.php` (Feature e Unit) | 1 + 1 | Testes de exemplo do skeleton Laravel |

**Total:** 133 casos declarados nos domínios do sistema, que resultam em 151 execuções (o fluxo de autenticação roda uma vez por audiência), mais 2 exemplos do skeleton = **153 testes**. São ~3.900 linhas de teste.

### Resultado da execução (2026-10-01)

A suíte foi executada de verdade (Pest 4, PHP 8.3, PostgreSQL 16 local, banco `testing`), antes e depois da atualização para o Laravel 13:

| Cenário | Passam | Falham |
|---|---:|---:|
| Laravel 12.26.4 (antes) | 138 | 15 |
| Laravel 13.34.0, sem nenhuma outra mudança | 138 | 15 (os mesmos testes, **0 regressões**, mensagens de falha equivalentes) |
| Laravel 13.34.0 + correção F-16 (anti-enumeração no login) | **139** | **14** |

**Os 14 testes que ainda falham já falhavam antes da atualização e não têm relação com a versão do framework.** São testes desatualizados em relação ao código ou pontos que precisam de decisão do dono do projeto:

| Teste(s) | Causa observada |
|---|---|
| `AuthFluxoTest` — primeiro acesso (4, Admin e Private) | O teste compara `$usuario->status` com a string `'ativo'`, mas o model devolve o enum `UsuarioStatus` |
| `AcessoSuporteTest` — entidade diferente de `private` | O teste usa o valor de enum `despachante`, que não existe em `EntidadeTipo` (`ValueError`) |
| `AcessoSuporteTest` — "o mesmo admin pode possuir acessos…" | `UniqueConstraintViolation` em `permissoes_chave_unique`: o teste cria uma permissão que já existe |
| `AcessoSuporteTest` — encerrar o acesso pelo admin | Retorna 403 onde o teste espera 204 |
| `AcessoSuporteTest` — comando agendado que expira acessos | O teste espera um registro de auditoria da mudança de status e não o encontra (**não está confirmado que a auditoria seja gerada**) |
| `EscopoEntidadeTest` — admin em modo de suporte (4) | O admin recebe 403 em rotas `/admin/*` quando envia `X-Acesso-Suporte-Id`; parece mudança de design posterior aos testes, a confirmar |
| `SegurancaTest` — `temp_token` do 2FA | O comportamento está correto (após 5 códigos inválidos o token é descartado), mas o código HTTP devolvido é 422 e o teste espera 401 |
| `UsuarioTest` — empresa A não atualiza usuário da empresa B | O isolamento funciona (resposta 400), porém a mensagem é a da validação de grupo, não "Usuário não encontrado." |

**Verificação adicional (feita só numa cópia de teste, nada disso foi aplicado ao repositório):** corrigindo apenas a comparação de enum, os **36 testes de `AuthFluxoTest` passam na Laravel 13** (login com e sem 2FA, primeiro acesso, esqueci/redefinir senha, refresh e logout, nas duas áreas); e, aceitando 422 no teste do 2FA, o `temp_token` é descartado após 5 códigos inválidos, mesmo que o código correto seja enviado depois.

Recomenda-se corrigir esses testes (ou o código, nos casos de decisão de design) para que `composer test` volte a ficar 100% verde e possa ser usado como porta de entrada no CI.

> **Nota de transparência:** o resultado acima é de um ambiente de teste local do analista, não de um pipeline do projeto. Os artefatos estão em [`pentest/evidencias/`](./pentest/evidencias/).

## Frontend

Não foi identificado no projeto nenhum framework ou script de testes automatizados no frontend (`frontend/package.json` só define `dev`, `build`, `start` e `lint`). A qualidade do frontend é verificada por TypeScript e ESLint.

## CI/CD e verificação de dependências

Não foi identificado pipeline de CI/CD (não existe `.github/workflows` nem equivalente) nem passo automatizado de `composer audit` / `npm audit`. A execução dos testes e a auditoria de dependências dependem, hoje, de execução manual.


---

## Atualização: testes unitários e frontend

### Backend — `backend/tests/Unit` (Pest)

| Arquivo | Foco |
|---|---|
| `EnumsTest.php` | Contrato de todos os enums de `app/Enums` (valores únicos, `from`/`tryFrom`, `label()`), `ChamadoStatus`, lookups, UF |
| `HtmlSanitizerTest.php` | Tags permitidas/descartadas, atributos, esquemas de link perigosos, UTF-8 |
| `HelpersTest.php` | `formatar_cpf_cnpj` (CPF, CNPJ numérico e alfanumérico) |
| `BusinessExceptionTest.php` | Status e código padrão/customizado |
| `DtoTest.php` | `PaginationDTO`, filtros, DTOs de Banner e `EmpresaAtualizacaoDTO` (restrito × irrestrito) |
| `ModelsTest.php` | URL de avatar/imagem de banner, casts, escopo `disponivelAgora` |
| `ContextosTest.php` | `AuditoriaContexto` |

Os 14 testes de *feature* que falhavam foram ajustados para refletir o comportamento atual do código (enum de status, rotas `/admin` recusando o header de suporte, 422 no 2FA etc.). Nenhuma regra de negócio foi alterada.

```bash
cd backend && ./vendor/bin/pest        # 252 testes
```

### Frontend — Vitest + Testing Library (`frontend/tests`)

```bash
cd frontend
npm test               # roda uma vez (109 testes)
npm run test:watch
npm run test:coverage
```

Cobre `lib/*` (media-url, client-ip, utils, proxy-guard, acesso-suporte, banner), proxies axios, `proxy.ts`/rotas, validações, mappers e serviços de banner/perfil, constantes e componentes (perfil e carousel de banner), além do fluxo do `BannerProvider`.

### Imagens (avatar e banner)

O frontend normaliza URLs `/storage/...` para caminho relativo (`lib/media-url.ts`) e o `next.config.ts` faz o *rewrite* `/storage/*` → backend (origem de `BACKEND_URL`, ou `BACKEND_STORAGE_URL` se definido). O backend precisa de `php artisan storage:link`.


### Swagger (regressão)

`backend/tests/Feature/SwaggerTest.php` garante que a tela do Swagger UI recebe uma CSP própria (scripts com *nonce*, sem `unsafe-inline` para JS) e que o JSON da documentação e o restante da API mantêm `default-src 'none'`. Sem isso, o `SecurityHeadersMiddleware` bloqueava CSS/JS da página e ela abria em branco.

### Versões de teste do frontend

Vite 8 + `@vitejs/plugin-react` 6 + Vitest 5 (versões alinhadas) e `jsdom` 30. Node mínimo: **22.22.2** (campo `engines` do `package.json`).
