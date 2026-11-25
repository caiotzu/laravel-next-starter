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
| Plantar uma "porta dos fundos" com sessão roubada | Vincular exige a **senha atual** (com teto de 5 falhas / 5 min por usuário) e o `state` fica preso ao usuário autenticado. |
| Misturar fluxos | O `state` guarda a finalidade: um state de **login** não vale para **vincular**, nem o contrário; no BFF, um cookie de binding por fluxo e só um deles fica ativo. |
| Força bruta | `throttle:autenticacao` + teto de 30 falhas por IP / 5 min. |

O primeiro login cria um vínculo em `usuario_identidades_sociais` (auditado, aparece no histórico do usuário). Um usuário tem **uma** conta por provedor; uma conta do provedor pertence a **um** usuário.

## Vincular e desvincular (perfil → aba "Login social")

Cada usuário gerencia as próprias contas em **Perfil → Login social** (Admin e Private).

- **Vincular:** o usuário informa a **senha atual**, é levado ao provedor e volta para a mesma aba. A conta do provedor pode ter **e-mail diferente** do cadastro (o usuário provou as duas coisas), mas o e-mail precisa estar **verificado** no provedor. Uma conta do provedor só pode pertencer a **um** usuário, e um usuário tem **uma** conta por provedor.
- **Desvincular:** remove o vínculo; o login por e-mail e senha não é afetado. Funciona mesmo que o provedor tenha sido desativado depois (aparece como "Indisponível no momento").
- Vincular e desvincular ficam no histórico de auditoria do usuário.

```
Navegador          Next (BFF)                              Laravel (JWT da sessão)
   │ Vincular + senha
   ├─ POST /api/auth/{ctx}/social/google/vincular ──► POST /perfil/login-social/google/vincular/iniciar
   │      (sessão → JWT do Redis)                          confere senha, state preso ao usuário
   │ ◄── cookie {ctx}_social_vinculo + { url }
   ├──────────────────────────────────────────────────────────────────────────► provedor
   │ ◄──── GET /api/auth/{ctx}/social/google/callback (MESMA URL do login) ────┘
   ├─ cookie {ctx}_social_vinculo presente ► POST /perfil/login-social/google/vincular/callback
   │ ◄── 303 /{perfil}?aba=login-social&vinculo=ok
```

O retorno do provedor usa a **mesma URI de callback do login**: não há nada novo para cadastrar no Google. O resultado volta por códigos fixos (`?vinculo=ok|invalido|cancelado|limite|indisponivel`), nunca por texto livre na URL.

Rotas (todas do próprio usuário autenticado; `/admin/...` na área Admin):

| Método | Rota | O que faz |
|---|---|---|
| GET | `/perfil/login-social` | Provedores e vínculos do usuário |
| POST | `/perfil/login-social/{provedor}/vincular/iniciar` | Confere a senha e devolve a URL do provedor |
| POST | `/perfil/login-social/{provedor}/vincular/callback` | Associa a conta ao usuário |
| DELETE | `/perfil/login-social/{provedor}` | Desvincula |

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

- O vínculo **automático** no primeiro login (pelo e-mail verificado coincidente) continua existindo, além do vínculo explícito pelo perfil. Para exigir só o explícito, remova o ramo de "primeiro login" de `AutenticacaoSocialService::resolverUsuario`.
- Redefinir a senha **não** remove contas sociais vinculadas. Se a política exigir isso (conta possivelmente comprometida), é um ponto a decidir em `UsuarioService`.
- O e-mail do login social é comparado em minúsculas; o login por senha compara exatamente o digitado (comportamento já existente).
- O fim do 2FA e a emissão de sessão/JWT de **todos** os logins (senha, 2FA e social) passam por `LoginService`; os dois `AuthController` não têm mais cópia própria.
