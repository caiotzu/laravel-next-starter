# Autenticação e autorização

## Backend

### JWT e sessões

Autenticação via **JWT** (`tymon/jwt-auth`), com endpoints espelhados para os contextos Admin e Private (`routes/api.php`):

- `POST /admin/login` e `POST /login` — autenticação por e-mail/senha;
- `POST /admin/2fa/verificar` e `POST /2fa/verificar` — segunda etapa quando o 2FA está habilitado;
- `POST /admin/primeiro-acesso` / `POST /primeiro-acesso` (+ `/validar`) — definição de senha no primeiro acesso, via token enviado por e-mail;
- `POST /admin/esqueceu-senha` / `POST /esqueceu-senha` e `POST /admin/redefinir-senha` / `POST /redefinir-senha` (+ `/validar`) — recuperação de senha por token;
- `GET /admin/me` / `GET /me`, `POST /admin/refresh` / `POST /refresh`, `POST /admin/logout` / `POST /logout`.

Toda rota autenticada passa pelo middleware `jwt` (`App\Http\Middleware\JwtMiddleware`), que:

1. Valida o token (`JWTAuth::parseToken()->authenticate()`);
2. Extrai o `session_id` do payload;
3. Confirma que a sessão em `usuario_sessoes` ainda está ativa (`UsuarioSessaoService::validarSessaoAtiva`) — permitindo revogar sessões mesmo com um JWT ainda válido (ex.: "encerrar sessão" no perfil).

Sessões inativas há mais de 30 minutos são encerradas pelo comando agendado `usuario-sessao:limpar-expiradas` (a cada 10 min, `routes/console.php`); além disso, o próprio `validarSessaoAtiva` encerra a sessão na hora se o último acesso for anterior a 30 minutos e atualiza `ultimo_acesso_em` a cada requisição autenticada.

Parâmetros do JWT (`backend/config/jwt.php`): algoritmo HS256 (`JWT_ALGO`), validade `JWT_TTL` (padrão 60 min), janela de refresh `JWT_REFRESH_TTL` (padrão 20160 min = 14 dias), *blacklist* habilitada (`JWT_BLACKLIST_ENABLED`) e `lock_subject`. O endpoint `POST /refresh` existe no backend, mas **o frontend não possui handler de refresh nem chamada a ele**: o cookie expira em 1 hora e o usuário precisa se autenticar novamente.

**Login:** limite de 5 tentativas por `ip + e-mail` a cada 5 minutos; a segunda etapa do 2FA aceita 9 tentativas por IP e o `temp_token` (válido por 5 min, guardado em cache) é descartado após 5 códigos inválidos. Detalhes de política de senha e 2FA em [`seguranca.md`](./seguranca.md#política-de-senha-e-credenciais).

### 2FA

TOTP via `pragmarx/google2fa` + QR Code:

- `POST /admin/2fa/habilitar` / `POST /2fa/habilitar` — gera segredo e QR Code;
- `POST /admin/2fa/confirmar` / `POST /2fa/confirmar` — confirma com o primeiro código gerado;
- `DELETE /admin/2fa/desabilitar` / `DELETE /2fa/desabilitar`.

### Autorização por permissões

Não há `Policy`/`Gate::define` individuais — um único `Gate::before` centraliza tudo:

```php
// app/Providers/AuthServiceProvider.php
Gate::before(function ($user, string $ability) {
    if (!method_exists($user, 'temPermissao')) {
        return null;
    }
    return $user->temPermissao($ability) ?: null;
});
```

- Permissões são registros em banco (`permissoes`), associados a grupos (`grupo_permissoes`);
- `Usuario::temPermissao()` consulta essas permissões com cache por grupo/versão (`permissoesCache()`), invalidado quando a versão do grupo muda;
- Controllers chamam `$this->authorize('admin.usuario.cadastrar')` no início de cada ação — string no padrão `contexto.recurso.acao`;
- O JWT carrega `grupo_id` e `grupo_versao` como claims customizados, usados para manter o cache de permissões consistente entre requisições.

### Isolamento por audiência (Admin vs. Private)

O `Gate::before` acima só bloqueia quem não tem a permissão correta — mas nem todo endpoint chama `$this->authorize()` (ex.: `GET /banners/disponiveis`, `GET /permissoes`, que são catálogos sem uma ação específica a autorizar). Sem outra camada, um JWT válido de qualquer audiência alcançaria esses endpoints, mesmo os de uma área diferente da sua.

`App\Http\Middleware\AudienciaMiddleware` fecha essa lacuna: aplicado como `->middleware('audiencia:admin')` no grupo `/admin` e `->middleware('audiencia:private')` no grupo Private (`routes/api.php`), ele compara o tipo de entidade do grupo do usuário autenticado (`Usuario->grupo->entidadeTipo->chave`) com a audiência esperada pela rota, retornando `403` em caso de divergência. Deve rodar sempre depois de `jwt` (precisa do usuário autenticado) e de `suporte.contexto` (ver seção seguinte).

### Acesso de Suporte (impersonação temporária e auditável)

Um usuário Admin pode atuar, por tempo limitado, no escopo de uma entidade Private (e, no futuro, de outras entidades concedentes — o mecanismo não conhece "Private" especificamente, só o tipo de entidade genérico já usado por `Grupo::entidade()`). O fluxo:

1. Um usuário da entidade concedente (hoje, Private) **concede** o acesso: `POST /acessos-suporte` (`App\Http\Controllers\Private\AcessoSuporteController::conceder`), gravando um registro em `acessos_suporte` (model `App\Models\AcessoSuporte`) com `expira_em`, `status = ativo` e o Admin autorizado;
2. Para usar o acesso, o Admin envia o header `X-Acesso-Suporte-Id: <id>` em qualquer requisição às rotas autenticadas. `App\Http\Middleware\AcessoSuporteMiddleware` (alias `suporte.contexto`, aplicado a **todo** o grupo autenticado, antes de `audiencia`) valida dono/expiração/status via `AcessoSuporteService::validarAtiva()` e, se válido, ativa `App\AcessoSuporte\AcessoSuporteContexto` para o restante da requisição — sem alterar `Auth::user()`, que continua sendo sempre o Admin real;
3. Com o contexto ativo, os Services que aplicam escopo por tenant (`EscopoEntidadeService`, ver [`banco-de-dados.md`](./banco-de-dados.md)) passam a enxergar a entidade concedente em vez da do Admin, e `AudienciaMiddleware` passa a considerar a audiência da entidade concedente (não a do Admin) ao decidir se a rota Private pode ser acessada;
4. O acesso pode ser revogado a qualquer momento por quem concedeu (`DELETE /acessos-suporte/{id}`, Private) ou encerrado pela gestão (`DELETE /admin/acessos-suporte/{id}`), e expira sozinho após `expira_em`;
5. Ações feitas durante um Acesso de Suporte carregam o `acesso_suporte_id` correspondente na auditoria (coluna adicionada em `auditorias`), permitindo reconstruir depois o que foi feito em nome de qual concessão.

## Frontend

- Login, logout, 2FA, primeiro acesso, esqueceu/redefinição de senha (com as respectivas validações de token) são *route handlers* em `app/api/auth/{admin,private}/**` (16 handlers), que validam a origem da requisição, chamam o backend e gerenciam os cookies `httpOnly` (`admin_access_token` / `private_access_token`, 1 hora, `sameSite=lax`, `secure` em produção);
- Chamadas autenticadas a outros endpoints passam pelo proxy (`app/api/proxy/{admin,private}/route.ts`), que injeta `Authorization: Bearer <token>` a partir do cookie e repassa `User-Agent` e um único IP de cliente validado (`X-Forwarded-For`/`X-Real-IP`, ver `lib/client-ip.ts` e `TRUSTED_PROXY_HOPS`) para o backend registrar na sessão; o destino, o método e os headers aceitos passam por `lib/proxy-guard.ts` (ver [`seguranca.md`](./seguranca.md#camada-bff-nextjs));
- Quando o backend responde `401`, o proxy limpa o cookie correspondente, forçando novo login;
- Em uma aba de suporte, o `middleware.ts` aceita o cookie Admin para navegar nas páginas Private (só a navegação visual): a autorização real continua no backend, que exige `X-Acesso-Suporte-Id` válido;
- `middleware.ts` decodifica o JWT (sem validar assinatura — só checa expiração) para decidir redirecionamentos antes da página carregar, com base em `routes/routes.ts` (ordenado da rota mais específica para a mais genérica).
