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

Sessões inativas há mais de 30 minutos são encerradas pelo comando agendado `usuario-sessao:limpar-expiradas` (a cada 10 min, `routes/console.php`).

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

## Frontend

- Login, logout, refresh, 2FA, primeiro acesso e redefinição de senha são *route handlers* em `app/api/auth/{admin,private}/**`, que chamam o backend e gerenciam os cookies `httpOnly` (`admin_access_token` / `private_access_token`);
- Chamadas autenticadas a outros endpoints passam pelo proxy (`app/api/proxy/{admin,private}/route.ts`), que injeta `Authorization: Bearer <token>` a partir do cookie e repassa headers de origem (`User-Agent`, `X-Forwarded-For`, `X-Real-IP`) para o backend registrar na sessão;
- Quando o backend responde `401`, o proxy limpa o cookie correspondente, forçando novo login;
- `middleware.ts` decodifica o JWT (sem validar assinatura — só checa expiração) para decidir redirecionamentos antes da página carregar, com base em `routes/routes.ts` (ordenado da rota mais específica para a mais genérica).
