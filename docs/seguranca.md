# Segurança

Este documento reúne os mecanismos de segurança que atravessam vários módulos do backend — autenticação, autorização, JWT, 2FA e o isolamento entre audiências (Admin/Private) e Acesso de Suporte estão documentados em [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md). Tudo abaixo foi confirmado no código atual do repositório (`backend/`); nada aqui é aspiracional.

## Escopo multi-tenant (isolamento entre empresas)

`App\Services\EscopoEntidadeService` é o único ponto do sistema que decide se uma operação deve ser irrestrita ou restrita a uma entidade (empresa), e qual é essa entidade — os Services que possuem uma entidade "dona" dos seus registros (`EmpresaService`, `EmpresaContatoService`, `EmpresaEnderecoService`; a coluna padrão é `grupo_empresa_id`) usam `aplicar()` para filtrar a query e `validarPertence()` para validar antes de criar/atualizar, em vez de reimplementar a regra cada um. Resumo da regra (ver o docblock do próprio serviço para o detalhamento completo):

| Situação | Resultado |
|---|---|
| Admin fora de modo de suporte | Irrestrito — nenhum filtro aplicado, pode apontar para qualquer entidade |
| Admin em Acesso de Suporte ativo | Restrito à entidade concedente impersonada (nunca à do Admin) |
| Private | Restrito à entidade do próprio grupo do usuário autenticado |

Isso depende de `App\AcessoSuporte\AcessoSuporteContexto` como fonte única de verdade sobre "qual entidade está em uso nesta requisição" (ver [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md#acesso-de-suporte-impersonação-temporária-e-auditável)).

## Isolamento por audiência (Admin vs. Private)

`App\Http\Middleware\AudienciaMiddleware` (aliases `audiencia:admin` / `audiencia:private`) garante que um JWT de uma audiência não alcance rotas da outra, mesmo em endpoints que não chamam `$this->authorize()`. Detalhes completos em [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md#isolamento-por-audiência-admin-vs-private).

## Rate limiting

Definidos em `App\Providers\AppServiceProvider::boot()` (`RateLimiter::for`) e aplicados via `throttle:<nome>` nas rotas (`routes/api.php`):

| Limiter | Limite | Chave | Onde é usado |
|---|---|---|---|
| `api-publica` | 10 req/min | IP | Login, primeiro acesso, esqueceu/redefinir senha (Admin e Private) |
| `api-autenticada` | 60 req/min | usuário autenticado, ou IP se não houver | Todo o grupo de rotas autenticadas (Admin + Private + Global + Lookup) |
| `download-anexo` | 120 req/min | IP | `GET /chamados/anexos/{anexo}` (link assinado, uma tela pode carregar várias imagens) |
| `swagger-admin` | 20 req/min | IP | UI/JSON das documentações Swagger `default` e `admin` |

Além do rate limit por IP, o login (Admin e Private) tem um limite específico por tentativa, implementado diretamente em `AuthController::login()` com `RateLimiter::tooManyAttempts()`/`hit()` — chave `login:<ip>:<email>`, 5 tentativas por 5 minutos (300s de bloqueio ao estourar), e a verificação de 2FA tem seu próprio limite por IP (`2fa:<ip>`, 9 tentativas / 5 minutos). Não há hoje um limite de tentativas de login por conta isolado do IP — um ataque distribuído por muitos IPs contra uma única conta não é bloqueado só por esse mecanismo.

## Cabeçalhos de segurança HTTP

`App\Http\Middleware\SecurityHeadersMiddleware` (alias `security.headers`) define, em toda resposta do grupo de rotas `api` (`bootstrap/app.php`, `$middleware->api(append: [...])`) e nas duas documentações Swagger (`config/l5-swagger.php`):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restritivo (`camera=(), microphone=(), geolocation=(), payment=(), usb=()`)
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'` (só quando a resposta ainda não define um CSP próprio — o download de anexos, por exemplo, define o seu, ver abaixo)
- `Strict-Transport-Security` apenas em produção e sobre HTTPS

O frontend Next.js define seu próprio conjunto de cabeçalhos, incluindo CSP, separadamente em `frontend/next.config.ts`.

## CORS

`backend/config/cors.php`: `allowed_origins` vem de `CORS_ALLOWED_ORIGINS` (vazio por padrão — nenhuma origem cross-site é aceita até ser explicitamente configurada), `supports_credentials` é `false` e não há uso de `*`. A comunicação normal entre o frontend e o backend não depende de CORS liberado no navegador, pois passa pelo BFF do Next.js (rotas `app/api/**`, que chamam o Laravel servidor-a-servidor) — ver [`arquitetura.md`](./arquitetura.md).

## Upload e download de arquivos

### Avatar de usuário

`PerfilController::atualizarAvatarBase64` recebe a imagem em base64 (`AtualizarAvatarBase64Request`), que decodifica o conteúdo e valida o **MIME real via `finfo_buffer`** (nunca a extensão ou o `Content-Type` declarado pelo cliente) contra uma lista fechada de tipos permitidos, além de limitar o tamanho do conteúdo decodificado.

### Anexos de chamado

- Upload: mesma validação de MIME real + tamanho, na criação/resposta de um chamado (`Chamado*Request`);
- Download: `GET /chamados/anexos/{anexo}` (`App\Http\Controllers\Global\ChamadoAnexoController::baixar`), fora do grupo autenticado por JWT — a rota usa o middleware `signed:relative` do Laravel em vez de `jwt`, porque o link é aberto diretamente pelo navegador (`<img>`/`<a>`), que não envia `Authorization: Bearer`. A autorização é a própria assinatura da URL (só gerada para quem já tinha acesso ao chamado) somada à expiração embutida na assinatura, e ao rate limit `download-anexo` (ver acima);
- A resposta do download define seu próprio `Content-Security-Policy: sandbox` e `X-Content-Type-Options: nosniff`, e serve PDFs sempre como `attachment` (nunca `inline`) — evita que um arquivo malicioso enviado por um usuário seja renderizado como conteúdo ativo no domínio da API.

## Tratamento de exceções e exposição de informação

Centralizado em `backend/bootstrap/app.php` (`withExceptions`): `ValidationException`, `AccessDeniedHttpException`, `ModelNotFoundException`, `BusinessException`, `QueryException` e exceções genéricas são tratadas de forma consistente. Em produção (`app()->isProduction()`), erros inesperados e mensagens de `QueryException` nunca vazam a mensagem/stack trace original — retornam uma mensagem genérica. Fora de produção, a mensagem real é retornada para facilitar o desenvolvimento.

## Mass assignment

Os models expõem `$fillable` (ex.: `Usuario::$fillable` inclui `status` e `grupo_id`), mas os Controllers nunca fazem `Model::create($request->all())`: toda entrada passa por um Form Request (validação) e é normalizada em um DTO (`app/DTO`) antes de chegar ao Service/Model, que monta explicitamente os campos a persistir. Isso significa que a superfície real de mass assignment é a lista de campos aceitos por cada DTO/Request — não a lista `$fillable` do model.

## Auditoria

A trait `App\Auditoria\Auditavel` (models como `Usuario`) registra alterações automaticamente, gravadas de forma assíncrona via `GravarAuditoriaJob` (ver [`filas-e-eventos.md`](./filas-e-eventos.md)). Registros feitos durante um Acesso de Suporte carregam o `acesso_suporte_id` correspondente, permitindo auditar especificamente o que foi feito por um Admin em nome de uma entidade concedente.

## O que fica fora deste documento

- **SQL Injection:** não foi encontrado uso de `DB::raw`/`whereRaw`/`selectRaw` com interpolação de entrada do usuário no código revisado — todas as ocorrências usam bind (`?`) ou strings estáticas. Eloquent/Query Builder é parametrizado no restante do código.
- **Dependências vulneráveis (CVE):** não há, no momento, um passo de `composer audit`/`npm audit` automatizado documentado neste repositório — recomenda-se rodar manualmente antes de cada deploy relevante.
- **Race conditions:** não há um mecanismo genérico de lock documentado; ao introduzir fluxos concorrentes sensíveis (ex.: financeiro), avaliar `lockForUpdate()`/chaves de idempotência caso a caso.
