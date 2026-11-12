# Roteiro de validação

Teste manual para confirmar que tudo funciona. Marque cada item; falha em item **★** adia a entrega.

| Parte | Quando | Duração |
|---|---|---|
| **A — Localhost** | depois da [instalação local](./instalacao-local.md) | ~30 min |
| **B — Produção** | no ambiente real, antes de abrir para os usuários | ~1 hora |

---

# Parte A — Localhost

**Antes:** backend e frontend rodando e banco com `migrate --seed`. Se a fila for `database`, deixe `./vendor/bin/sail artisan queue:work` rodando (ou use `sync`).

### A1 ★ Ambiente

- [ ] `./vendor/bin/sail ps` mostra `laravel.test`, `pgsql` e `redis` como `Up`
- [ ] `curl -i http://localhost/up` → `200`
- [ ] `curl http://localhost:3000/api/health` → `{"status":"ok","redis":"ok"}`
- [ ] <http://localhost/api/documentation> abre o Swagger

### A2 ★ Login

- [ ] Admin (`admin@admin.com.br` / `Admin123@`) entra em `/admin/home`
- [ ] Senha errada e e-mail inexistente mostram a **mesma** mensagem
- [ ] Cliente (`private@private.com.br` / `Private123@`) entra na home do cliente e **não** abre `/admin/...`
- [ ] Sair e usar "voltar" do navegador não reabre a área logada
- [ ] Admin e cliente ao mesmo tempo (janela anônima): sair de um **não** derruba o outro

### A3 ★ 2FA

- [ ] Em **Perfil**, habilitar o 2FA (QR code); ao entrar de novo, pede o código
- [ ] Código errado é recusado; o mesmo código usado duas vezes também
- [ ] Desabilitar o 2FA volta o login ao normal

### A4 Mensagens e chamados

- [ ] Admin envia mensagem a uma empresa; o cliente a recebe; `<script>alert(1)</script>` no texto **não** executa
- [ ] Cliente abre chamado com anexo pequeno; anexo `.exe` e anexo acima de 10 MB são recusados
- [ ] Admin vê o chamado, baixa o anexo e responde

### A5 Perfil e avatar

- [ ] Enviar imagem pequena como avatar; um PDF renomeado para `.png` é recusado

### A6 Acesso de Suporte e auditoria

- [ ] Cliente concede acesso (com duração) ao Admin; o Admin só opera aquela empresa
- [ ] Depois de **revogar**, a próxima ação do Admin é recusada
- [ ] Em **Admin > Auditorias** aparecem os registros (precisa do worker de fila, se a fila for `database`)

### A7 Redis fora do ar

- [ ] `./vendor/bin/sail stop redis` → `/api/health` responde `503` e o login mostra "Serviço de sessão temporariamente indisponível"
- [ ] `./vendor/bin/sail start redis` → volta ao normal (é preciso entrar de novo)

### A8 Testes automáticos

- [ ] `./vendor/bin/sail artisan test --compact` sem falhas
- [ ] `npx tsc --noEmit`, `npm run lint` e `npm test` sem erros

---

# Parte B — Produção

Faça no ambiente com a **mesma configuração de produção** (HTTPS, Redis com senha e TLS, `TRUSTED_PROXIES`, e-mail real).

### B1 ★ IP real do usuário

- [ ] Duas pessoas em redes diferentes erram a senha: o limite de uma **não** bloqueia a outra
- [ ] O IP mostrado em **Perfil → Sessões** é o do usuário, não o do servidor

### B2 ★ Login sem 2FA

- [ ] Entrar com o admin criado por `admin:criar-inicial` e trocar a senha, se pedido
- [ ] No navegador (DevTools): cookie `__Host-admin_sid` com `HttpOnly` e `Secure`; **nenhum** JWT em respostas, `localStorage` ou `document.cookie`
- [ ] Sair destrói a sessão; "voltar" não reabre a área

### B3 ★ Login com 2FA

- [ ] Habilitar, sair e entrar com o código; código repetido é recusado
- [ ] Após 5 códigos errados, é preciso refazer o login

### B4 ★ Acesso de Suporte

- [ ] Cliente concede; Admin acessa só a empresa dele; revogar bloqueia a próxima ação
- [ ] A ação aparece na auditoria com o acesso de suporte

### B5 ★ Chamado com anexo

- [ ] Abrir chamado com anexo pelo cliente; o Admin baixa pelo link
- [ ] O link assinado **expira** e o arquivo **não** tem URL pública direta
- [ ] Anexo acima do limite é recusado antes de chegar ao PHP (corpo de 16 MB)

### B6 E-mails e mensagens

- [ ] Primeiro acesso e "esqueci minha senha" chegam por e-mail e o link funciona **uma vez**
- [ ] Mensagem enviada pelo Admin chega ao destinatário (worker de fila ativo)

### B7 Limites

- [ ] Depois de 5 tentativas de login erradas em 5 min, a seguinte recebe **429** em português
- [ ] `/api/health` responde `200`

### B8 Resiliência

- [ ] Reiniciar o Redis: usuários precisam entrar de novo (ou **não**, se o AOF estiver ligado)
- [ ] Redis fora do ar: login responde 503 e rotas protegidas voltam ao login

### Fechamento

- [ ] `php artisan producao:verificar` e `npm run verificar:producao` sem ERRO
- [ ] Nenhum erro 500 nem tela em branco (veja `storage/logs/laravel.log`)
- [ ] Falhas **não ★** viram backlog e **não** adiam a entrega

Referência de configuração: [`checklist-producao.md`](./checklist-producao.md).
