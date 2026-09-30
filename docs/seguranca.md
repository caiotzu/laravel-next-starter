# Segurança

Este documento reúne os mecanismos de segurança que atravessam vários módulos do backend — autenticação, autorização, JWT, 2FA e o isolamento entre audiências (Admin/Private) e Acesso de Suporte estão documentados em [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md). Tudo abaixo foi confirmado no código atual do repositório (`backend/` e `frontend/`); nada aqui é aspiracional. Para uma visão consolidada por camada, veja a [matriz de controles](#matriz-de-controles-por-camada); para o status de testes de intrusão, veja [Pentest e avaliação de segurança](#pentest-e-avaliação-de-segurança).

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

Além do rate limit por IP, o login (Admin e Private) tem um limite específico por tentativa, implementado diretamente em `AuthController::login()` com `RateLimiter::tooManyAttempts()`/`hit()` — chave `login:<ip>:<email>`, 5 tentativas por 5 minutos (300s de bloqueio ao estourar), e a verificação de 2FA tem seu próprio limite por IP (`2fa:<ip>`, 9 tentativas / 5 minutos). Todos os limites por IP dependem de o Laravel enxergar o IP real do usuário final: como quem chama a API é o servidor Next.js (BFF), é necessário configurar `TRUSTED_PROXIES` no backend (`config/trustedproxy.php`, vazio por padrão = não confia em nenhum proxy) e `TRUSTED_PROXY_HOPS` no frontend (ver [BFF](#camada-bff-nextjs)). Sem isso, todos os usuários compartilham o mesmo IP aos olhos do rate limit. Não há hoje um limite de tentativas de login por conta isolado do IP — um ataque distribuído por muitos IPs contra uma única conta não é bloqueado só por esse mecanismo.

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

Centralizado em `backend/bootstrap/app.php` (`withExceptions`): `ValidationException`, `AccessDeniedHttpException`, `ModelNotFoundException`, `BusinessException`, `QueryException` e exceções genéricas são tratadas de forma consistente. Erros inesperados (fallback genérico) retornam `Erro interno do servidor.` quando `app()->isProduction()`; `QueryException` retorna mensagem genérica quando `APP_DEBUG` é falso (`config('app.debug')`). Fora desses casos a mensagem real é retornada para facilitar o desenvolvimento. **Ponto de atenção:** exceções do tipo `RuntimeException`/`InvalidArgumentException` e `HttpException` devolvem `getMessage()` em qualquer ambiente — evite lançar essas exceções com texto interno sensível.

## Mass assignment

Os models expõem `$fillable` (ex.: `Usuario::$fillable` inclui `status` e `grupo_id`), mas os Controllers nunca fazem `Model::create($request->all())`: toda entrada passa por um Form Request (validação) e é normalizada em um DTO (`app/DTO`) antes de chegar ao Service/Model, que monta explicitamente os campos a persistir. Isso significa que a superfície real de mass assignment é a lista de campos aceitos por cada DTO/Request — não a lista `$fillable` do model.

## Auditoria

A trait `App\Auditoria\Auditavel` (models como `Usuario`) registra alterações automaticamente, gravadas de forma assíncrona via `GravarAuditoriaJob` (ver [`filas-e-eventos.md`](./filas-e-eventos.md)). Registros feitos durante um Acesso de Suporte carregam o `acesso_suporte_id` correspondente, permitindo auditar especificamente o que foi feito por um Admin em nome de uma entidade concedente.

## Política de senha e credenciais

- Senhas (primeiro acesso, redefinição e troca no perfil) exigem no mínimo 8 caracteres com maiúsculas e minúsculas, letras, números e símbolos (`Password::min(8)->mixedCase()->letters()->numbers()->symbols()` nos Form Requests) e confirmação idêntica;
- O hash de senha é feito com `Hash::make` (bcrypt, `BCRYPT_ROUNDS=12` no `.env.example`);
- No login, se o e-mail não existe o sistema executa um hash de custo equivalente e devolve a mesma mensagem de credenciais inválidas — reduz enumeração de usuários por tempo de resposta e por texto de erro (coberto por `SegurancaTest`);
- O segredo TOTP do 2FA é armazenado criptografado (`google2fa_secret` com cast `encrypted` em `Usuario`); o código TOTP só é aceito uma vez (anti-replay, `verifyKeyNewer`); o `temp_token` da etapa de 2FA vive 5 minutos no cache e é descartado após tentativas inválidas;
- Trocar a senha encerra as demais sessões do usuário; tokens de primeiro acesso/redefinição têm expiração e não podem ser reutilizados.

## Sanitização de conteúdo HTML e validação de imagens

- **Releases:** o conteúdo rich text (Tiptap) é sanitizado no servidor por `App\Support\HtmlSanitizer`, um sanitizador por *allowlist* (tags de formatação básica; scripts, iframes, SVG, formulários etc. são descartados; nenhum atributo é mantido exceto `href`/`target`/`rel` em links, com esquema `http`, `https`, `mailto` ou `tel`). O frontend também sanitiza com DOMPurify ao exibir — defesa em profundidade;
- **Banners:** as imagens (JPEG, PNG ou WebP, até 5 MB cada, máximo de 10 imagens e 10 links por banner) têm o tipo verificado pelos bytes reais via `finfo_buffer` em `BannerService`, como nos demais uploads.

## Camada BFF (Next.js)

Como o navegador só fala com o Next.js, o BFF também aplica controles próprios:

- **Cookies de sessão:** `admin_access_token` / `private_access_token` são gravados com `httpOnly`, `secure` (em produção), `sameSite=lax`, `path=/` e `maxAge` de 1 hora;
- **Validação de origem (mitigação de CSRF):** rotas `app/api/auth/**` e `app/api/proxy/**` chamam `validarOrigem()` (`lib/utils.ts`): exigem `Origin` igual ao de `FRONTEND_URL` ou, na ausência de `Origin`, `Sec-Fetch-Site: same-origin`; caso contrário respondem `403`;
- **Guarda do proxy genérico** (`lib/proxy-guard.ts`): o destino é resolvido contra `BACKEND_URL` e rejeitado se sair do host/prefixo `/api` (bloqueia `//host`, `\\`, caracteres de controle e `%2e`/`%2f`/`%5c`/`%00` no path — proteção contra SSRF/path traversal); só os métodos GET, POST, PUT, PATCH e DELETE são aceitos; o cliente só pode enviar o header `X-Acesso-Suporte-Id` (validado como UUID) — `Authorization`, `X-Forwarded-For` etc. nunca vêm do navegador;
- **IP do cliente** (`lib/client-ip.ts`): o BFF repassa ao backend um único IP válido, calculado a partir do `X-Forwarded-For` com `TRUSTED_PROXY_HOPS` (padrão `1`; `0` = não repassa nada), evitando que um cliente forje o IP para escapar dos rate limits;
- **Cabeçalhos** (`next.config.ts`): `Content-Security-Policy` **parcial** (`frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'` — sem `script-src`/`style-src`; o próprio arquivo registra a CSP estrita com nonces como evolução), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` restritivo e, em produção, `Strict-Transport-Security: max-age=31536000`;
- **Ponto de atenção — token no corpo da resposta:** os handlers `app/api/auth/{admin,private}/login` e `/2fa` gravam o JWT no cookie `httpOnly`, mas repassam ao navegador o objeto `data` devolvido pelo backend, que inclui o campo `token`. O cookie continua inacessível a JavaScript, porém o valor também trafega no corpo dessas duas respostas. Removê-lo do JSON (devolver só os demais campos) é uma melhoria simples recomendada;
- `middleware.ts` só decodifica o JWT para checar expiração (verificação de UX); a validação real de assinatura, sessão e permissão acontece no backend.

## Matriz de controles por camada

| Camada | Controles confirmados no código |
|---|---|
| Rede / borda | Rate limit por IP e por usuário; CORS fechado por padrão; `TRUSTED_PROXIES` / `TRUSTED_PROXY_HOPS`; HSTS em produção |
| BFF (Next.js) | Cookies `httpOnly`/`secure`/`sameSite=lax`; validação de origem; guarda de URL/método/headers do proxy; CSP parcial e demais cabeçalhos |
| Autenticação | JWT (TTL padrão 60 min, `JWT_TTL`), sessão em banco revogável, expiração por inatividade (30 min), 2FA TOTP com anti-replay, limite de tentativas de login e de 2FA |
| Autorização | `Gate::before` com permissões por grupo; `AudienciaMiddleware` (Admin × Private); `EscopoEntidadeService` (multi-tenant); Acesso de Suporte temporário e auditável |
| Aplicação | Form Requests + DTOs; sanitização de HTML por allowlist; validação de MIME real em uploads; tratamento central de exceções |
| Dados | UUID como chave; soft delete; segredo 2FA criptografado; hash de senha; arquivos de chamado em disco privado com link assinado e expirável |
| Auditoria | Trait `Auditavel` + `GravarAuditoriaJob`; `acesso_suporte_id` nos registros de suporte |
| Documentação da API | Swagger Admin com Basic Auth *fail-closed* e rate limit próprio |

## Pentest e avaliação de segurança

**Pentest independente (terceiros / black-box): não há evidência no repositório.** Foram pesquisados *pentest*, *penetration*, *OWASP* e *vulnerabilidade* em todos os arquivos e nos 153 commits, além de PDFs e relatórios: nenhum resultado. Não é possível afirmar que o sistema passou por esse tipo de teste.

**Avaliação de segurança white-box (2026-09-29): realizada.** Documentada em [`pentest-avaliacao-seguranca.md`](./pentest-avaliacao-seguranca.md), com scripts e resultados brutos em [`pentest/evidencias/`](./pentest/evidencias/). Resumo:

- **150 verificações dinâmicas** executadas sobre o código real: sanitizador de HTML (55 payloads XSS), proxy do BFF (SSRF/path traversal, métodos, headers), IP do cliente, CSRF por origem e `middleware.ts` — sem falhas de proteção; 1 observação informativa e 1 fraqueza confirmada (F-06, mitigada pelo backend);
- **Revisão estática:** 158 rotas (107 com `authorize()`, 16 públicas, 35 de autoatendimento/catálogo), SQL, uploads, tokens, auditoria, segredos no histórico Git — sem SQL injection, execução de código, IDOR ou segredo real encontrados;
- **Dependências:** `npm audit` (38 avisos em produção; **34 após a atualização para Next.js 16.3.7, sem nenhum crítico**) e cruzamento do `composer.lock` (17 avisos em produção). Concentram os achados mais graves: Next.js 15.5.6 (crítico, **corrigido** na atualização para 16.3.7), axios 1.13.1 (alto), Laravel 12.26.4 e pacotes Symfony/Guzzle (médio);
- **15 achados:** 1 crítico (F-01, **corrigido** em 2026-09-30), 1 alto, 2 médios, 5 baixos e 6 informativos (1 deles, F-15, também corrigido). Os demais permanecem em aberto.

**O que não foi feito:** a API Laravel não foi atacada em execução (sem PHP/Composer/PostgreSQL no ambiente), nem houve testes black-box, fuzzing, TLS/infra ou navegador real. Esta avaliação **não substitui** um pentest independente em homologação. Comunique a segurança como "controles implementados, testados automaticamente e avaliados por revisão white-box", nunca como "aprovado em pentest".

Se um pentest de terceiros tiver sido realizado fora do repositório, arquive o relatório em `docs/pentest/` (data, escopo, achados com severidade, evidências de correção e reteste) e atualize esta seção e as apresentações em `docs/apresentacoes/`.

## O que fica fora deste documento

- **SQL Injection:** não foi encontrado uso de `DB::raw`/`whereRaw`/`selectRaw` com interpolação de entrada do usuário no código revisado — todas as ocorrências usam bind (`?`) ou strings estáticas. Eloquent/Query Builder é parametrizado no restante do código.
- **Dependências vulneráveis (CVE):** não há, no momento, um passo de `composer audit`/`npm audit` automatizado documentado neste repositório — recomenda-se rodar manualmente antes de cada deploy relevante.
- **Race conditions:** não há um mecanismo genérico de lock documentado; ao introduzir fluxos concorrentes sensíveis (ex.: financeiro), avaliar `lockForUpdate()`/chaves de idempotência caso a caso.
