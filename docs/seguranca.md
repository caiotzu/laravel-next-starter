# Segurança

Tudo o que o sistema tem hoje para proteger usuários e dados, **confirmado no código**. Cada item traz uma descrição curta; o detalhe técnico está no código e em [`backend.md`](./backend.md) / [`frontend.md`](./frontend.md).

---

## 1. Login e sessão

- **JWT só no servidor** — o token fica no Redis; o navegador recebe apenas um cookie opaco e nunca vê o JWT.
- **Cookie de sessão blindado** — `HttpOnly`, `SameSite=Lax`, sem `Domain`; em produção também `Secure` e prefixo `__Host-`.
- **Sessão em banco, revogável** — dá para encerrar uma sessão mesmo com o JWT ainda válido.
- **Expiração por inatividade** — sessões paradas há mais de 30 minutos são encerradas.
- **2FA (TOTP)** — código de app autenticador; cada código só vale uma vez (anti-replay) e o segredo é guardado criptografado.
- **Anti-fixação de sessão** — um novo login destrói a sessão anterior do mesmo navegador.
- **Anti-enumeração de usuários** — e-mail inexistente e senha errada dão a mesma resposta.
- **Política de senha** — mínimo de 8 caracteres com maiúsculas, minúsculas, números e símbolos; hash bcrypt.
- **Trocar a senha** encerra as demais sessões do usuário.
- **Tokens de primeiro acesso e de recuperação** — têm validade e não podem ser reutilizados.
- **Falha fechada** — com o Redis fora do ar ninguém entra (503); a navegação protegida volta ao login.

## 2. Autorização e isolamento

- **Permissões por grupo** — toda ação do backend exige uma chave de permissão (`admin.usuario.cadastrar`).
- **Admin × Cliente** — um JWT de uma área não alcança rotas da outra (`AudienciaMiddleware`).
- **Isolamento entre empresas** — um único serviço decide "de quem são os dados"; esquecer o filtro de empresa é impossível por construção.
- **Respostas que não vazam** — o erro nunca revela se um dado existe em outra empresa.
- **Acesso de Suporte** — o Admin só entra na empresa do cliente se ele autorizar, por tempo limitado, com revogação a qualquer momento e auditoria própria.
- **Só admin ativo** pode receber um Acesso de Suporte.
- **Lookup de administradores restrito** — exige permissão específica e mostra o e-mail mascarado.

## 3. Proteção contra abuso

- **Limite de requisições por rota** — login, 2FA, "esqueci a senha", API autenticada, download de anexos e Swagger têm limites próprios.
- **Limites contam só falhas** — um colega que erra a senha não bloqueia os outros atrás do mesmo IP (escritório).
- **Login** — 5 falhas por IP + e-mail e 60 por IP em 5 min (contra *password spraying*).
- **2FA** — 9 falhas por usuário e 60 por IP em 5 min; o código temporário vale 5 min e é descartado após 5 erros.
- **"Esqueci a senha"** — 5 pedidos por minuto por e-mail de destino (não dá para inundar a caixa de outra pessoa).
- **IP real do usuário** — `TRUSTED_PROXIES` (backend) e `TRUSTED_PROXY_HOPS` (frontend) evitam que um cliente forje o IP.
- **Respostas 429 em português**, com `Retry-After`.

## 4. Navegador e frontend (BFF)

- **CSP com nonce** — nonce novo a cada página; scripts injetados sem ele não executam; sem `eval`.
- **Cabeçalhos de segurança** — `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS em produção.
- **Validação de origem (CSRF)** — rotas do BFF só aceitam a origem do próprio site.
- **Proxy restrito** — só chega a caminhos da API, só métodos esperados, e o navegador só pode enviar o header de Acesso de Suporte.
- **Sem rotas de token pelo proxy** — `login`, `2FA`, `refresh` e `logout` não passam pelo proxy genérico, para nenhum JWT voltar ao navegador.
- **Anti-SSRF e path traversal** — caminhos com `//`, `\`, `%2e`, `%2f`, `%00` e semelhantes são recusados.
- **Sanitização de HTML** — conteúdo rico passa por lista de permissões, no backend **e** no frontend (DOMPurify).
- **`/storage` seguro** — só imagens (png, jpeg, webp, gif) aparecem; qualquer outro tipo vira download; o endereço interno do backend não vaza.

## 5. Dados e arquivos

- **Validação do tipo real do arquivo** — pelo conteúdo, nunca pela extensão ou pelo tipo declarado.
- **Limites de tamanho** — avatar 2 MB, banner 5 MB, anexo de chamado 10 MB (também no texto base64).
- **Anexos de chamado privados** — só saem por link assinado e com validade, em disco sem URL pública.
- **Download seguro** — `sandbox` e `nosniff`; PDF sempre como anexo.
- **Nomes gerados pelo servidor** — o nome enviado pelo usuário nunca vira caminho de arquivo.
- **Entradas validadas** — Form Request + DTO; nunca `$request->all()` direto no model.
- **Chaves UUID** e *soft delete* nos registros principais.
- **Erros genéricos em produção** — exceções internas, de bibliotecas e de banco não aparecem para o usuário.

## 6. Auditoria

- **Trilha de alterações** — quem fez o quê e quando, gravada em segundo plano.
- **Rastreio de suporte** — ações feitas em Acesso de Suporte levam o identificador do acesso.
- **Tela de auditoria** para a gestão (Admin).

## 7. Operação e infraestrutura

- **Verificadores de produção** — `producao:verificar` (backend) e `verificar:producao` (frontend) acusam configuração insegura.
- **Seeder de produção sem usuários** — contas de desenvolvimento não vão para produção; o primeiro admin é criado com senha escolhida.
- **Swagger Admin fechado por padrão** — exige senha (HTTP Basic) e tem limite de requisições.
- **CORS fechado por padrão** — nenhuma origem externa é aceita até ser configurada.
- **Redis protegido** — rede privada, senha, TLS, `noeviction` e persistência.
- **Healthchecks** — `/api/health` (frontend) e `/up` (API).
- **Dependências auditadas** — o CI roda `composer audit` e `npm audit` e bloqueia severidade alta ou crítica.

---

## Garantido por testes automáticos

| O quê | Onde |
|---|---|
| Isolamento entre empresas e uso do escopo | `EscopoEntidadeTest`, `RepositoriesTest`, `RepositoriesEscopoTest` |
| Toda chave de permissão existe e a do recurso certo é exigida | `PermissoesAuthorizeTest`, `EmpresaEnderecoAutorizacaoTest` |
| Anti-enumeração, anti-replay, anexos assinados, sanitização | `SegurancaTest` |
| Lookup, exceções em produção, limites de 2FA e login | `AvaliacaoSegurancaTest` |
| Sessão, proxy, CSP e sanitização do frontend | Vitest (`tests/session`, `tests/api`, `tests/lib`) |
| JWT fora do navegador, cookies, CSP e CSRF em navegador real | Playwright (`e2e/`) |

---

## Avaliação e riscos residuais

**Não há pentest independente.** O que existe é revisão do código (*white-box*) e os testes acima. Descreva a segurança como "controles implementados, testados automaticamente e revisados", nunca como "aprovado em pentest".

- `style-src` da CSP ainda permite `'unsafe-inline'` (bibliotecas de UI usam estilos inline); removê-lo exige nonce nos estilos.
- Um ataque distribuído por muitos IPs contra **uma** conta não é bloqueado só pelo limite de login.
- Redis, rede, TLS e servidor web são decisão de infraestrutura: veja [`implantacao-servidor.md`](./implantacao-servidor.md).
- `npm audit` tem 2 avisos moderados (`postcss-selector-parser`, via `@tailwindcss/typography`) que afetam o build, não o servidor em execução.

**Reverificar**

```bash
cd frontend && npm run lint && npx tsc --noEmit && npm test && npm audit --omit=dev --audit-level=high
npm run build && npm run e2e        # precisa de Redis
cd ../backend && composer test && composer audit
```

Antes de publicar: [`checklist-producao.md`](./checklist-producao.md).
