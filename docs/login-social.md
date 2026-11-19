# Login social (Google e novos provedores)

Permite entrar com uma conta Google (e, no futuro, Microsoft, GitHub...) nas áreas **Admin** e **Private**.

> **Regra central: o login social nunca cria usuário.** A conta do provedor só entra se o e-mail dela já pertencer a um usuário **cadastrado e ativo** daquela área. Convidado, inativo, bloqueado, expirado ou inexistente → recusado, sempre com a mesma mensagem.

## Como funciona

```
Navegador          Next (BFF)                    Laravel                     Provedor
   │ clica "Entrar com Google"
   ├─ POST /api/auth/{ctx}/social/google/iniciar ──► gera binding, pede a URL
   │                                  │──── POST /login/social/google/iniciar {binding}
   │                                  │         guarda state + PKCE no cache (10 min)
   │ ◄── cookie {ctx}_social=binding (httpOnly) + { url }
   ├─────────────────────────────────────────────────────────────────────────► login no Google
   │ ◄──────────────── 302 /api/auth/{ctx}/social/google/callback?code&state ──┘
   ├─ GET callback (cookie vai junto) ─► lê e APAGA o binding
   │                                  │──── POST /login/social/google/callback {codigo,state,binding}
   │                                  │         valida state+binding, troca o code, acha o usuário
   │                                  │ ◄── { token } ou { temp_token } (2FA)
   │ ◄── 303 + cookie de sessão opaco (JWT só no Redis) → /{home}?login_social=1
   │     (com 2FA: 303 → login#social-2fa=<temp_token>; o código TOTP conclui em /2fa/verificar)
```

### Decisões de segurança

| Risco | Proteção |
|---|---|
| Criar conta sem permissão | `AutenticacaoSocialService` só busca usuários existentes (`obterUsuarioAtivoPorEmail/Id`), do **tipo de entidade da rota**. Um Admin não entra pela área Private e vice-versa. |
| "Login CSRF" (injetar o code de outra pessoa no seu navegador) | `state` de uso único + `binding` aleatório gravado em cookie `httpOnly` e conferido no backend (`hash_equals`). Sem o cookie do mesmo navegador, o callback nem chega ao backend. |
| Interceptar o code | PKCE (S256); o `code_verifier` nunca sai do servidor. |
| Tomar conta pelo e-mail | Exige `email_verified`. Depois do 1º login, vale o `sub` do provedor (estável), não o e-mail. Outra conta Google com o e-mail de quem já está vinculado é recusada. |
| Enumerar contas | Todas as recusas devolvem a mesma mensagem; o motivo real vai só para o log (`login_social.recusado`, e-mail em hash). |
| Burlar o 2FA | Usuário com 2FA recebe `temp_token` e conclui em `/2fa/verificar`, como no login por senha. |
| Token no navegador | Igual ao login por senha: o JWT fica no Redis; o `temp_token` vai no fragmento da URL (não chega a servidor, log ou `Referer`). |
| Força bruta | `throttle:autenticacao` + teto de 30 falhas por IP / 5 min. |

O primeiro login cria um vínculo em `usuario_identidades_sociais` (auditado, aparece no histórico do usuário). Um usuário tem **uma** conta por provedor; uma conta do provedor pertence a **um** usuário.

## Configurar o Google

1. Google Cloud Console → *APIs e serviços* → *Credenciais* → **ID do cliente OAuth** (aplicativo da Web).
2. **URIs de redirecionamento autorizados** (uma por área que for usar; o host é o do **frontend**, `APP_URL_FRONTEND`):
   - `https://SEU-FRONTEND/api/auth/admin/social/google/callback`
   - `https://SEU-FRONTEND/api/auth/private/social/google/callback`
3. No `backend/.env`:

```
AUTENTICACAO_SOCIAL_GOOGLE_ATIVO="true"
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

4. `php artisan migrate`. Sem o `ATIVO` ou sem as credenciais, o provedor **não aparece** na tela e `/iniciar` responde 404.

## Adicionar um novo provedor (Microsoft, GitHub...)

O fluxo (state, PKCE, vínculo, sessão, 2FA, rotas, telas) é único. Um provedor novo é só:

1. **Classe** `app/Services/External/AutenticacaoSocial/<Nome>Service.php` implementando `ProvedorSocialInterface` (`configurado`, `usaPkce`, `urlAutorizacao`, `obterIdentidade`), seguindo `GoogleService`. Ela devolve um `IdentidadeSocialDTO` (`id` estável, `email`, `emailVerificado`).
2. **Credenciais** em `config/services.php` + `.env.example`.
3. **Entrada** em `config/api.php` → `autenticacao_social.provedores` (`adapter`, `nome`, `ativo`).
4. **Teste:** copie o padrão de `tests/Feature/LoginSocialTest.php` (Http::fake do provedor).
5. *(opcional)* ícone de marca em `ICONES` (`components/forms/social-login-buttons.tsx`); sem ele o botão usa um ícone genérico.

O frontend lê a lista em `GET /…/login/social/provedores`: **não precisa de mudança** para o botão aparecer.

Cuidados por provedor:

- **`emailVerificado` precisa ser verdadeiro de verdade.** Se o provedor não garante e-mail verificado (ex.: Microsoft multi-tenant; no GitHub só o e-mail marcado como `verified` e `primary` de `/user/emails`), devolva `false` — o serviço recusa. Nunca marque `true` por padrão.
- **GitHub não é OIDC:** use `/login/oauth/access_token` + `/user` + `/user/emails`. Se o provedor rejeitar PKCE, `usaPkce()` devolve `false`.
- Cada provedor exige a sua própria URI de retorno (`…/social/<chave>/callback`).

## Limitações atuais

- Não há tela no perfil para vincular/desvincular contas: o vínculo nasce no primeiro login (e-mail verificado coincidente). Para exigir vínculo explícito, desative o vínculo automático em `AutenticacaoSocialService::resolverUsuario` e crie a tela de perfil.
- `Admin\AuthController` e `Private\AuthController` ainda têm a própria cópia de `finalizarLogin`; o login social usa `LoginService` (mesma regra). Unificar é uma refatoração futura, com teste de caracterização.
- O e-mail é comparado em minúsculas; o login por senha compara exatamente o digitado (comportamento já existente).
