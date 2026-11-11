# Segurança

Este documento reúne os mecanismos de segurança que atravessam vários módulos do backend — autenticação, autorização, JWT, 2FA e o isolamento entre audiências (Admin/Private) e Acesso de Suporte estão documentados em [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md). Tudo abaixo foi confirmado no código atual do repositório (`backend/` e `frontend/`); nada aqui é aspiracional. Para uma visão consolidada por camada, veja a [matriz de controles](#matriz-de-controles-por-camada); para o que já foi avaliado e o que não foi, veja [Avaliação de segurança](#avaliação-de-segurança).

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
| `api-publica` | 30 req/min | IP | Primeiro acesso, redefinir senha, esqueceu senha e `/version` (Admin e Private). |
| `autenticacao` | 120 req/min | IP | **Login e 2FA** (Admin e Private): só teto de inundação. As proteções contra adivinhar senha e código ficam nos controllers e contam apenas **falhas** (abaixo). |
| `esqueceu-senha` | 5 req/min | e-mail de destino (ou IP, se vazio) | `POST /esqueceu-senha` (somado ao `api-publica`): impede inundar a caixa de entrada de outra pessoa, mesmo de vários IPs |
| `api-autenticada` | 60 req/min | usuário autenticado, ou IP se não houver | Todo o grupo de rotas autenticadas (Admin + Private + Global + Lookup) |
| `download-anexo` | 120 req/min | IP | `GET /chamados/anexos/{anexo}` (link assinado, uma tela pode carregar várias imagens) |
| `swagger-admin` | 20 req/min | IP | UI/JSON das documentações Swagger `default` e `admin` |

**Limites de falha nos controllers (contam só FALHAS; acertos de colegas do mesmo IP não gastam a cota):** login por IP + e-mail (5 em 5 min), login por IP (60 em 5 min, contra "password spraying"), 2FA por usuário (9 em 5 min) e 2FA por IP (60 em 5 min). **Atenção em produção:** todos esses limites dependem de `TRUSTED_PROXIES` correto; sem ele o backend enxerga o IP do Next.js e **todos os usuários dividem a mesma cota**. O 429 volta em português, com `Retry-After`.

Todos os limites por IP dependem de o Laravel enxergar o IP real do usuário final. Como quem chama a API é o servidor Next.js (BFF), é necessário configurar `TRUSTED_PROXIES` no backend (`config/trustedproxy.php`, vazio por padrão = não confia em nenhum proxy) e `TRUSTED_PROXY_HOPS` no frontend (ver [BFF](#camada-bff-nextjs)). Sem isso, todos os usuários compartilham o mesmo IP aos olhos do rate limit. Ainda não existe um limite de tentativas de login por conta isolado do IP: um ataque distribuído por muitos IPs contra uma única conta não é bloqueado só por esse mecanismo.

## Cabeçalhos de segurança HTTP

`App\Http\Middleware\SecurityHeadersMiddleware` (alias `security.headers`) define, em toda resposta do grupo de rotas `api` (`bootstrap/app.php`, `$middleware->api(append: [...])`) e nas duas documentações Swagger (`config/l5-swagger.php`):

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` restritivo (`camera=(), microphone=(), geolocation=(), payment=(), usb=()`)
- `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'` (só quando a resposta ainda não define um CSP próprio — o download de anexos, por exemplo, define o seu, ver abaixo)
- `Strict-Transport-Security` apenas em produção e sobre HTTPS

O frontend Next.js define seu próprio conjunto de cabeçalhos: a **CSP completa das páginas, com nonce por requisição, é montada em `frontend/proxy.ts`** (`lib/security/csp.ts`); os demais cabeçalhos e a CSP da API ficam em `frontend/next.config.ts`; `/storage` tem os seus no Route Handler (ver a seção do BFF).

## CORS

`backend/config/cors.php`: `allowed_origins` vem de `CORS_ALLOWED_ORIGINS` (vazio por padrão — nenhuma origem cross-site é aceita até ser explicitamente configurada), `supports_credentials` é `false` e não há uso de `*`. A comunicação normal entre o frontend e o backend não depende de CORS liberado no navegador, pois passa pelo BFF do Next.js (rotas `app/api/**`, que chamam o Laravel servidor-a-servidor) — ver [`arquitetura.md`](./arquitetura.md).

## Upload e download de arquivos

### Avatar de usuário

`PerfilController::atualizarAvatarBase64` recebe a imagem em base64 (`AtualizarAvatarBase64Request`), que decodifica o conteúdo e valida o **MIME real via `finfo_buffer`** (nunca a extensão ou o `Content-Type` declarado pelo cliente) contra uma lista fechada de tipos permitidos, além de limitar o tamanho do conteúdo decodificado. O tamanho do **texto** base64 também é limitado nas regras do campo (`App\Support\LimiteBase64`, com 5% de folga para quebras de linha) e a decodificação é pulada quando o campo já foi reprovado. O limite do corpo da requisição no servidor web está no [`checklist-producao.md`](./checklist-producao.md).

### Anexos de chamado

- Upload: mesma validação de MIME real + tamanho, na criação/resposta de um chamado (`Chamado*Request`);
- Download: `GET /chamados/anexos/{anexo}` (`App\Http\Controllers\Global\ChamadoAnexoController::baixar`), fora do grupo autenticado por JWT — a rota usa o middleware `signed:relative` do Laravel em vez de `jwt`, porque o link é aberto diretamente pelo navegador (`<img>`/`<a>`), que não envia `Authorization: Bearer`. A autorização é a própria assinatura da URL (só gerada para quem já tinha acesso ao chamado) somada à expiração embutida na assinatura, e ao rate limit `download-anexo` (ver acima);
- A resposta do download define seu próprio `Content-Security-Policy: sandbox` e `X-Content-Type-Options: nosniff`, e serve PDFs sempre como `attachment` (nunca `inline`) — evita que um arquivo malicioso enviado por um usuário seja renderizado como conteúdo ativo no domínio da API.

## Tratamento de exceções e exposição de informação

Centralizado em `backend/bootstrap/app.php` (`withExceptions`): `ValidationException`, `AccessDeniedHttpException`, `ModelNotFoundException`, `BusinessException`, `QueryException` e exceções genéricas são tratadas de forma consistente. Em produção (`app()->isProduction()`):

- erros inesperados devolvem `Erro interno do servidor.`;
- `RuntimeException` e `InvalidArgumentException` (muitas vindas de bibliotecas: Flysystem, PDO, Redis…) devolvem `Não foi possível processar sua solicitação.`; a mensagem original continua nos logs e só aparece fora de produção;
- `QueryException` devolve mensagem genérica quando `APP_DEBUG` é falso.

Fora de produção a mensagem real é devolvida para facilitar o desenvolvimento. `HttpException` e `BusinessException` devolvem a própria mensagem (escrita para o usuário): não coloque texto interno sensível nelas.

## Mass assignment

Os models expõem `$fillable` (ex.: `Usuario::$fillable` inclui `status` e `grupo_id`), mas os Controllers nunca fazem `Model::create($request->all())`: toda entrada passa por um Form Request (validação) e é normalizada em um DTO (`app/DTO`) antes de chegar ao Service/Model, que monta explicitamente os campos a persistir. Isso significa que a superfície real de mass assignment é a lista de campos aceitos por cada DTO/Request — não a lista `$fillable` do model.

## Auditoria

A trait `App\Auditoria\Auditavel` (models como `Usuario`) registra alterações automaticamente, gravadas de forma assíncrona via `GravarAuditoriaJob` (ver [`filas-e-eventos.md`](./filas-e-eventos.md)). Registros feitos durante um Acesso de Suporte carregam o `acesso_suporte_id` correspondente, permitindo auditar especificamente o que foi feito por um Admin em nome de uma entidade concedente.

## Política de senha e credenciais

- Senhas (primeiro acesso, redefinição e troca no perfil) exigem no mínimo 8 caracteres com maiúsculas e minúsculas, letras, números e símbolos (`Password::min(8)->mixedCase()->letters()->numbers()->symbols()` nos Form Requests) e confirmação idêntica;
- O hash de senha é feito com `Hash::make` (bcrypt, `BCRYPT_ROUNDS=12` no `.env.example`);
- No login, se o e-mail não existe o controller executa um hash de custo equivalente e devolve a mesma mensagem e o mesmo status (401) de uma senha errada, para não permitir enumerar usuários (coberto por `SegurancaTest`);
- O segredo TOTP do 2FA é armazenado criptografado (`google2fa_secret` com cast `encrypted` em `Usuario`); o código TOTP só é aceito uma vez (anti-replay, `verifyKeyNewer`); o `temp_token` da etapa de 2FA vive 5 minutos no cache e é descartado após tentativas inválidas;
- Trocar a senha encerra as demais sessões do usuário; tokens de primeiro acesso/redefinição têm expiração e não podem ser reutilizados.

## Sanitização de conteúdo HTML e validação de imagens

- **Releases:** o conteúdo rich text (Tiptap) é sanitizado no servidor por `App\Support\HtmlSanitizer`, um sanitizador por *allowlist* (tags de formatação básica; scripts, iframes, SVG, formulários etc. são descartados; nenhum atributo é mantido exceto `href`/`target`/`rel` em links, com esquema `http`, `https`, `mailto` ou `tel`). O frontend também sanitiza com DOMPurify ao exibir — defesa em profundidade;
- **Banners:** as imagens (JPEG, PNG ou WebP, até 5 MB cada, máximo de 10 imagens e 10 links por banner) têm o tipo verificado pelos bytes reais via `finfo_buffer` em `BannerService`, como nos demais uploads.

## Camada BFF (Next.js)

Como o navegador só fala com o Next.js, o BFF também aplica controles próprios:

- **Sessão no servidor:** o JWT de acesso **não existe mais no navegador**. Fica no Redis (`bff:sess:<sid>`, JSON `{contexto, token, criadaEm, expiraEm}`, TTL nativo = tempo restante do JWT, teto de 12 h) e o navegador guarda só o `sid` (32 bytes aleatórios, base64url, 43 caracteres) no cookie `admin_sid` / `private_sid` — `__Host-admin_sid` / `__Host-private_sid` em produção — com `HttpOnly`, `Secure` (produção), `SameSite=Lax`, `Path=/` e **sem `Domain`**. O `sid` é validado por formato antes de qualquer consulta ao Redis; a sessão guarda o contexto (um `sid` Admin não abre rota Private e vice-versa); login destrói a sessão anterior do mesmo navegador (anti fixação); 401 do backend e logout destroem a sessão; Redis fora do ar → 503 (proxy/login) ou redirecionamento ao login (navegação), nunca acesso liberado. O Redis precisa de **rede privada, senha e TLS em produção** (ver [`redis-producao.md`](./redis-producao.md));
- **Validação de origem (mitigação de CSRF):** rotas `app/api/auth/**` e `app/api/proxy/**` chamam `validarOrigem()` (`lib/utils.ts`): exigem `Origin` igual ao de `FRONTEND_URL` ou, na ausência de `Origin`, `Sec-Fetch-Site: same-origin`; caso contrário respondem `403`;
- **Guarda do proxy genérico** (`lib/proxy-guard.ts`): o destino é resolvido contra `BACKEND_URL` e rejeitado se sair do host/prefixo `/api` (bloqueia `//host`, `\\`, caracteres de controle e `%2e`/`%2f`/`%5c`/`%00` no path — proteção contra SSRF/path traversal); só os métodos GET, POST, PUT, PATCH e DELETE são aceitos; o cliente só pode enviar o header `X-Acesso-Suporte-Id` (validado como UUID) — `Authorization`, `X-Forwarded-For` etc. nunca vêm do navegador;
- **IP do cliente** (`lib/client-ip.ts`): o BFF repassa ao backend um único IP válido, calculado a partir do `X-Forwarded-For` com `TRUSTED_PROXY_HOPS` (padrão `1`; `0` = não repassa nada), evitando que um cliente forje o IP para escapar dos rate limits;
- **Content-Security-Policy completa:** `proxy.ts` gera um **nonce novo a cada requisição de página** e envia `script-src 'self' 'nonce-…' 'strict-dynamic'` (sem `'unsafe-inline'` nem `'unsafe-eval'` em produção), `default-src 'self'`, `connect-src 'self'`, `img-src 'self' data: blob:` + a origem do backend (os anexos de chamado são URLs assinadas carregadas direto dele), `frame-src 'none'`, `object-src 'none'`, `base-uri`/`form-action 'self'` e `frame-ancestors 'none'`. Um `<script>` ou `onerror=` injetado sem o nonce é bloqueado pelo navegador. O nonce chega ao Next (que o aplica nos próprios scripts) e ao layout (`x-nonce`, para o script do tema). Por isso as páginas são **renderizadas sob demanda** (`dynamic = "force-dynamic"` nos layouts raiz). `style-src` mantém `'unsafe-inline'` (React, Radix, Recharts, Sonner e Tiptap usam estilos inline; risco bem menor que o de scripts). `CSP_MODO=report-only` troca para `Content-Security-Policy-Report-Only` (o navegador só registra), útil para validar um ambiente novo. O zod roda em modo `jitless` (`lib/zod.ts`) para não gerar violação de CSP. **Testado em navegador real** (`e2e/csp.e2e.ts`): cabeçalho único com nonce novo a cada resposta, nenhuma violação nas telas públicas e autenticadas, tema escuro funcionando, e bloqueio de `<script>`/`onerror` injetados (sem nonce), `eval`, iframe, `fetch`/imagem/formulário para outro site e `<base>`. A API tem `default-src 'none'`.
- **`/storage` (arquivos enviados por usuários):** é um Route Handler (`app/storage/[...caminho]/route.ts`, `lib/storage-proxy.ts`): valida o caminho (sem `..`, barras ou caracteres de controle), busca só em `<origem do backend>/storage/…` (o navegador não escolhe o host; redirecionamentos não são seguidos), repassa apenas cabeçalhos de cache e responde com `nosniff`, CSP `sandbox`, `X-Frame-Options: DENY` e `Cross-Origin-Resource-Policy`. **Só imagens (png/jpeg/webp/gif) são exibidas inline**; qualquer outro tipo (SVG, HTML…) vira download. Não vaza o endereço interno do backend.
- **Sanitização de HTML:** `lib/sanitize-html.ts` usa uma allowlist fechada igual à do backend (mesmas tags; só `href`/`target`/`rel`; links `http`, `https`, `mailto`, `tel`; `rel="noopener noreferrer"` forçado), testada contra 50 ataques e conteúdo legítimo (`tests/lib/sanitize-html.test.ts`). Atenção: `USE_PROFILES` do DOMPurify **substitui** a allowlist e não pode ser usado.
- **Token fora do corpo da resposta e fora do navegador:** os handlers `app/api/auth/{admin,private}/login` e `/2fa` criam a sessão no Redis e devolvem ao navegador somente os demais campos (a função `separarTokenDeSessao`, em `lib/auth-response.ts`). O `temp_token` do 2FA **continua** chegando ao navegador, porque é ele que a tela reenvia ao confirmar o código; ele não é o token da sessão. No login com 2FA a sessão **não é criada nem tocada** até o código correto. Coberto por `tests/api/auth-bff.test.ts`, `tests/session/*` e pelos E2E (`e2e/autenticacao.e2e.ts`, `e2e/multiusuario.e2e.ts`), que conferem no navegador real que o JWT não está em nenhuma resposta, no HTML, em `document.cookie`, `localStorage` nem `sessionStorage`, e que ele existe só no Redis;
- **O proxy não encaminha endpoints de autenticação:** o Laravel tem `POST /admin/refresh` e `POST /refresh`, que devolvem um JWT novo no corpo; como o proxy repassa o corpo ao navegador, um script na página poderia pedir um token e ficar com ele, anulando a garantia de que o JWT não chega ao navegador. `lib/proxy-guard.ts` (`resolverUrlBackend`) agora recusa (400) `login`, `2fa/verificar`, `refresh` e `logout`, com ou sem `admin/`, ignorando maiúsculas, `//`, barra final, query e percent-encoding (`/admin/refre%73h`). Esses fluxos têm handlers próprios em `app/api/auth/**`. A aplicação **não usa renovação de token** (as rotas `/refresh` continuam no backend, mas o frontend não as chama);
- **Verificação de saúde:** `GET /api/health` (público, só leitura) responde 200 se o Redis das sessões responde ao PING e 503 se não, sem host, versão nem mensagem de erro (`lib/session/saude.ts`); serve a monitoramento, balanceador e healthcheck de container. Sem `REDIS_URL`, o BFF registra no terminal (no máximo a cada 10 s) uma linha `[sessao] REDIS_URL não está definida…` explicando o que fazer, em vez de só devolver 503;
- `proxy.ts` (antigo `middleware.ts`) só decodifica o JWT para checar expiração (verificação de UX); a validação real de assinatura, sessão e permissão acontece no backend.

## Matriz de controles por camada

| Camada | Controles confirmados no código |
|---|---|
| Rede / borda | Rate limit por IP e por usuário; CORS fechado por padrão; `TRUSTED_PROXIES` / `TRUSTED_PROXY_HOPS`; HSTS em produção |
| BFF (Next.js) | Sessão no Redis com cookie opaco (`HttpOnly`/`Secure`/`SameSite=Lax`/`__Host-`); validação de origem; guarda de URL/método/headers do proxy; CSP com nonce e demais cabeçalhos; `/storage` com cabeçalhos próprios |
| Autenticação | JWT (TTL padrão 60 min, `JWT_TTL`), sessão em banco revogável, expiração por inatividade (30 min), 2FA TOTP com anti-replay, limite de tentativas de login e de 2FA |
| Autorização | `Gate::before` com permissões por grupo; `AudienciaMiddleware` (Admin × Private); `EscopoEntidadeService` (multi-tenant); Acesso de Suporte temporário e auditável |
| Aplicação | Form Requests + DTOs; sanitização de HTML por allowlist; validação de MIME real em uploads; tratamento central de exceções |
| Dados | UUID como chave; soft delete; segredo 2FA criptografado; hash de senha; arquivos de chamado em disco privado com link assinado e expirável |
| Auditoria | Trait `Auditavel` + `GravarAuditoriaJob`; `acesso_suporte_id` nos registros de suporte |
| Documentação da API | Swagger Admin com Basic Auth *fail-closed* e rate limit próprio |

## Avaliação de segurança

**Pentest independente (terceiros, black-box): não há evidência no repositório.** Não é possível afirmar que o sistema passou por esse tipo de teste. O que existe é uma revisão **white-box** (leitura do código e verificações dinâmicas sobre o código real: sanitizador de HTML, proxy do BFF, IP do cliente, CSRF por origem, `proxy.ts`) somada aos controles automáticos abaixo. Comunique a segurança como "controles implementados, testados automaticamente e avaliados por revisão white-box", nunca como "aprovado em pentest".

### Controles garantidos por teste automático

- Isolamento entre empresas: `EscopoEntidadeTest`, `RepositoriesTest`, `UsuarioEscopoTest`.
- Services não montam consultas fora dos repositories: `RepositoriesEscopoTest`.
- Toda chave de `authorize()` existe nos seeders: `PermissoesAuthorizeTest`. A permissão do recurso certo é exigida: `EmpresaEnderecoAutorizacaoTest`.
- Anti-enumeração no login, anti-replay do TOTP, anexos por link assinado, sanitização: `SegurancaTest`.
- Lookup de administradores, exceções em produção, teto de base64, limites de 2FA e de login: `AvaliacaoSegurancaTest`.
- Frontend: sessão no Redis, proxy, CSP e sanitização (Vitest) e, em navegador real, cookie `HttpOnly`, JWT fora de qualquer resposta, proteção de rotas, sessão expirada, logout, cabeçalhos e recusa de origem diferente (`e2e/`).

### Comportamentos de segurança relevantes

- **Lookup de administradores** (`/lookup/administradores`): quem não é Admin precisa de `private.acesso_suporte.conceder` (403 sem ela); o e-mail vai mascarado (`ma***@dominio.com`); `%` e `_` da busca são texto, não curingas; a lista é limitada.
- **2FA:** limite por usuário (9 falhas em 5 min, zerado só quando o próprio usuário acerta) mais um teto generoso por IP (60 falhas em 5 min), para que colegas atrás do mesmo IP público (escritório) não se bloqueiem. Continuam valendo o limite de 5 códigos errados por `temp_token` e o limite de login por IP + e-mail.
- **Acesso de Suporte** só pode ser concedido a administrador **ativo**.
- **Proxy do BFF** recusa `login`, `2fa/verificar`, `refresh` e `logout`, e `/storage/*` é servido com cabeçalhos próprios, só imagens inline.

### Dependências

O CI roda `composer audit` e `npm audit` a cada push e bloqueia só severidade **alta ou crítica** (npm: só dependências de produção). Na última verificação, `npm audit --omit=dev` tinha 0 críticas e 0 altas e 2 avisos moderados (`postcss-selector-parser`, via `@tailwindcss/typography`): afetam o processamento de CSS **no build**, não o servidor em execução, e a correção publicada é um downgrade de versão major.

### Riscos residuais conhecidos

- `style-src` da CSP mantém `'unsafe-inline'`; removê-lo exige nonce nos estilos.
- O Redis de produção (senha, TLS, rede privada, persistência) é decisão de infraestrutura: ver [`redis-producao.md`](./redis-producao.md).
- A API Laravel não foi atacada por um cliente externo em ambiente implantado; não houve fuzzing nem teste de TLS/infraestrutura. Nada disto substitui um pentest independente em homologação.

Se um pentest de terceiros for realizado, arquive no repositório apenas um **resumo** (escopo, severidades e situação de cada achado), sem detalhes exploráveis, e mantenha o relatório completo em local privado.

### Como reverificar

```bash
# frontend (precisa de Redis: REDIS_URL, ou redis-server local)
cd frontend && npm run lint && npx tsc --noEmit && npm test && npm audit --omit=dev --audit-level=high
npm run build && npm run e2e          # inclui e2e/csp.e2e.ts

# backend
cd backend && composer test && composer audit
```

Antes de publicar, siga o [`checklist-producao.md`](./checklist-producao.md).

## O que fica fora deste documento

- **SQL Injection:** não foi encontrado uso de `DB::raw`/`whereRaw`/`selectRaw` com interpolação de entrada do usuário no código revisado — todas as ocorrências usam bind (`?`) ou strings estáticas. Eloquent/Query Builder é parametrizado no restante do código.
- **Dependências vulneráveis (CVE):** o CI roda `composer audit` e `npm audit` a cada push e **bloqueia só severidade alta ou crítica** (npm: somente dependências de produção); avisos menores aparecem no relatório sem bloquear. Rode `composer audit --locked` e `npm audit` localmente antes de um deploy relevante e acompanhe os avisos moderados.
- **Race conditions:** não há um mecanismo genérico de lock documentado; ao introduzir fluxos concorrentes sensíveis (ex.: financeiro), avaliar `lockForUpdate()`/chaves de idempotência caso a caso.
