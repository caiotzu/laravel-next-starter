# Roteiro de homologação (cerca de 1 hora)

Teste manual no ambiente de homologação, com a **mesma configuração de produção** (HTTPS, Redis com senha e TLS, `TRUSTED_PROXIES`, e-mail real). Marque cada item; qualquer falha em um item **crítico (★)** adia a publicação, o resto vai para o backlog.

Antes de começar:

- [ ] `php -v` mostra **PHP 8.5** no servidor web e no CLI (worker de fila).
- [ ] `php artisan producao:verificar` (backend) e `npm run verificar:producao` (frontend) terminam **sem ERRO**.
- [ ] Você tem: 1 usuário **admin** (criado por `admin:criar-inicial`), 1 empresa **cliente** com 1 usuário, e um segundo navegador/aba anônima. Para o item 0, um celular com dados móveis (4G/5G, fora do Wi-Fi).

## 0. ★ IP do usuário (prova do `TRUSTED_PROXIES`) — 5 min

Sem isso todos os usuários dividem a mesma cota de limite de requisições.

1. No computador (rede A), faça login como admin.
2. No celular em 4G/5G (rede B), faça login como o mesmo ou outro usuário.
3. Em **Admin > Auditorias**, abra os dois registros de login: o **IP gravado deve ser diferente em cada um** e igual ao IP público real de cada rede (confira em um site "qual é meu IP").
4. Se os dois mostrarem o mesmo IP (o do servidor Next/balanceador) ou um IP interno: **pare**. `TRUSTED_PROXIES` (backend) ou `TRUSTED_PROXY_HOPS` (frontend) estão errados. Ver `docs/checklist-producao.md`.

## 1. ★ Login sem 2FA — 5 min

- [ ] Admin: login com e-mail e senha corretos entra em `/admin/home`.
- [ ] Senha errada: mensagem genérica em português, sem dizer se o e-mail existe.
- [ ] E-mail inexistente: **mesma** mensagem da senha errada.
- [ ] Cliente (`/`): login entra na home do cliente; o cliente **não** abre `/admin/...` (é redirecionado/recusado).
- [ ] Sair (logout) e usar o botão "voltar" do navegador não reabre a área logada.

## 2. ★ Login com 2FA — 10 min

1. Em **Perfil**, habilite o 2FA (QR code no app autenticador). Guarde os códigos de recuperação, se houver.
2. Saia e entre de novo:
   - [ ] Pede o código de 6 dígitos depois da senha.
   - [ ] Código errado: recusado em português. Depois de **5 erros** o fluxo é descartado e é preciso refazer o login.
   - [ ] Código certo: entra.
   - [ ] O mesmo código usado de novo (reenvio) é **recusado** (anti-replay).
3. Repita com um usuário do cliente.
4. Desabilite o 2FA em um deles e confirme que o login volta a ser só e-mail e senha.

## 3. ★ Conceder acesso de suporte — 10 min

1. Como **cliente** (com a permissão de conceder suporte), vá em **Acesso ao suporte** e conceda acesso a um administrador, com duração (ex.: 30 min).
   - [ ] A lista de administradores aparece com o **e-mail mascarado** (só os 2 primeiros caracteres e o domínio).
   - [ ] A duração é obrigatória.
2. Como **admin** concedido:
   - [ ] Recebeu a mensagem automática.
   - [ ] Consegue operar **somente** a empresa que concedeu (não enxerga outras).
   - [ ] Alterações feitas ficam na **Auditoria** com o admin real e o acesso de suporte usado.
3. Como cliente, **revogue** o acesso:
   - [ ] A próxima ação do admin é recusada imediatamente.
4. Conceda de novo com duração curta (1 a 2 min) e espere expirar:
   - [ ] Depois de expirar, o admin perde o acesso (o status pode levar até o ciclo do agendador para mudar na tela, mas o acesso é recusado).

## 4. Enviar mensagem — 7 min

1. Como admin, em **Mensagens**, envie uma mensagem para uma empresa (ou usuário, buscando por parte do nome).
   - [ ] A busca de usuários mostra só nome e e-mail.
2. Como cliente:
   - [ ] A mensagem aparece (e o aviso de não lida, se houver).
   - [ ] O conteúdo formatado (negrito, links) aparece sem scripts: cole `<script>alert(1)</script>` no texto e confirme que **nada executa**.

## 5. ★ Abrir chamado com anexo — 10 min

1. Como cliente, abra um chamado com assunto, mensagem e **anexo** (PDF ou imagem pequena).
   - [ ] Recebe um número de ticket.
   - [ ] Anexo com extensão não permitida (ex.: `.exe`) é **recusado**.
   - [ ] Anexo acima do limite (10 MB) é **recusado** com mensagem clara.
   - [ ] Anexo de ~9 MB **é aceito** (confere o limite de 16 MB do servidor web/PHP do checklist).
2. Como admin com permissão de atender:
   - [ ] O chamado aparece na lista e o admin foi notificado.
   - [ ] O download do anexo funciona (link assinado) e **não** abre sem estar logado.
   - [ ] Responder, mudar prioridade e definir responsável funcionam; o cliente é notificado.
3. Encerre o chamado:
   - [ ] Novas respostas são bloqueadas.

## 6. Trocar avatar — 5 min

- [ ] Em **Perfil**, envie uma imagem (JPG/PNG pequena): aparece no topo e no perfil.
- [ ] Troque por outra: a nova aparece e a antiga some.
- [ ] Arquivo que não é imagem (ex.: PDF renomeado para `.png`) é recusado.
- [ ] Imagem muito grande é recusada com mensagem em português (não erro genérico).

## 7. Limites e e-mails — 5 min

- [ ] "Esqueci minha senha": o e-mail **chega** (verifique spam), o link leva ao frontend de produção (HTTPS) e a nova senha funciona; as outras sessões são encerradas.
- [ ] Convidar um usuário novo: o e-mail de primeiro acesso chega e o fluxo ativa a conta.
- [ ] Tentar mais de 5 vezes "esqueci minha senha" para o mesmo e-mail em 1 minuto: a resposta passa a ser 429 em português, e outro e-mail do mesmo IP continua livre.

## 8. Resiliência — 3 min

- [ ] `GET /api/health` do frontend responde 200.
- [ ] Reinicie o Redis (se for AOF, o login continua válido ao voltar): durante a queda o login responde 503 e, ao voltar, tudo normaliza.
- [ ] Confirme que o worker de fila está ativo (e-mails e auditoria saem em segundos).

## Fechamento

- [ ] Nenhuma mensagem em inglês visível nos formulários testados.
- [ ] Nenhum erro 500 ou tela em branco durante o roteiro (olhe o log do Laravel e do Next).
- [ ] Rode `php artisan producao:verificar` mais uma vez no servidor de **produção** antes de abrir aos usuários.

Achados fora dos itens ★ que não sejam críticos vão para o backlog (`docs/IMPLEMENTATION_PLAN.md`) e **não** adiam o lançamento.
