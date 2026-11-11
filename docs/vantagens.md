# Por que essa arquitetura

Este documento resume as decisões de design do starter e o que elas trazem na prática, para quem está avaliando usá-lo como base de um novo projeto. Tudo o que está aqui existe no código; os trade-offs aparecem em [Limitações](#limitações-a-ter-em-mente).

## Arquitetura

### Separação clara de responsabilidades no backend

O fluxo `Controller → Request → DTO → Service → (Repository) → Model → Resource` mantém cada camada com uma única responsabilidade (o Repository só existe onde há dado com dono, como usuários e grupos — ver [`repositories.md`](./repositories.md)):

- **Controller** só orquestra (validação, autorização, chamada ao service, resposta);
- **Request** valida a entrada;
- **DTO** desacopla o Service do formato bruto da requisição HTTP;
- **Service** concentra a regra de negócio — é o único lugar que muda quando a regra muda;
- **Resource** controla exatamente o que é exposto na resposta.

Na prática: regra de negócio nunca fica presa a um controller específico, o que facilita reuso (ex.: o mesmo `Service` pode ser chamado por um job ou um comando artisan) e torna os testes de unidade mais diretos.

### Domínios já modelados como referência

Empresas, usuários, grupos/permissões, mensagens, banners, chamados de suporte, releases e auditoria já implementam o padrão completo (Controller → ... → Resource, DTOs, Requests, eventos). Um novo domínio pode ser criado copiando essa estrutura, em vez de decidir do zero como organizar cada peça.

### Dois contextos de acesso (Admin/Private) sem gambiarra de permissão

Em vez de um único conjunto de rotas com `if (isAdmin)` espalhado pelo código, Admin e Private têm controllers, DTOs e telas próprios. Isso custa alguma duplicação, mas evita acoplamento entre regras de negócio de contextos diferentes — mudar uma regra do Admin não arrisca quebrar o Private.

### Frontend como BFF, não como cliente direto da API

O Next.js nunca expõe a URL real do backend nem o token ao navegador — só fala com suas próprias rotas internas (`app/api/**`), que repassam a chamada. Isso permite, por exemplo, trocar a URL do backend, adicionar cache ou agregar chamadas sem tocar em código de UI.

### Organização por domínio no frontend, não por tipo de arquivo

`domains/{contexto}/{recurso}` (dados) + `features/{contexto}/{recurso}` (UI) significa que tudo relacionado a "usuários" fica junto, em vez de espalhado entre pastas genéricas `hooks/`, `services/`, `types/` misturando recursos diferentes. Escala melhor conforme o número de telas cresce.

### Documentação de API que não desatualiza sozinha

Os atributos OpenAPI vivem nos próprios controllers — quando alguém muda uma rota, a tentação de esquecer de atualizar um YAML separado desaparece, porque a documentação é gerada do mesmo lugar que o código.

### Isolamento entre empresas por construção (multi-tenant)

Quem decide "de quem são os dados" é um único ponto, o `EscopoEntidadeService`, e os repositories de dados com dono **exigem** o escopo como parâmetro: esquecer o filtro de empresa deixa de ser possível. Um teste arquitetural (`RepositoriesEscopoTest`) falha se alguém quebrar a regra, e o erro nunca revela se um dado existe em outra empresa. Ver [`repositories.md`](./repositories.md).

### Acesso de Suporte: impersonação temporária e auditável

Um administrador só entra na empresa de um cliente se o próprio cliente conceder acesso, com duração definida e revogável a qualquer momento. Durante o acesso, o administrador enxerga somente aquela empresa e cada alteração fica na auditoria com o administrador real e o acesso usado. Ver [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md).

### Armazenamento de arquivos atrás de um contrato

Todo upload passa por `FileStorageInterface`; trocar o disco local por S3 é configuração (`FILE_STORAGE_DRIVER`), não refatoração. Anexos de chamado ficam em disco privado e só saem por link assinado e expirável. Ver [`armazenamento-de-arquivos.md`](./armazenamento-de-arquivos.md).

## Segurança

### O JWT fica no servidor (Redis); o navegador só guarda um cookie de sessão opaco

O JWT é guardado no Redis pelas rotas de autenticação do Next.js, associado a um identificador de sessão aleatório (`sid`), e as chamadas seguintes o injetam no servidor (BFF). O navegador só tem o cookie com o `sid` (`HttpOnly`, `SameSite=Lax`, `__Host-` em produção). Isso elimina a classe de ataque mais comum contra tokens em SPA (roubo via XSS lendo `localStorage`/`sessionStorage`) e também o roubo do próprio token por malware que lê os cookies do disco ou por extensão maliciosa: o que se copia é um `sid` sem significado, que o servidor invalida no logout, na expiração ou em um 401. Cada login gera uma sessão independente, então vários usuários (ou a mesma pessoa em vários computadores) usam o sistema ao mesmo tempo sem interferir entre si. Contrapartida: o frontend passa a depender de um Redis (ver [`seguranca.md`](./seguranca.md#camada-bff-nextjs)).

### Revogação de sessão mesmo com JWT ainda válido

JWT por natureza é difícil de revogar antes de expirar. Este starter contorna isso guardando cada sessão em banco (`usuario_sessoes`) e validando-a a cada requisição, além do token — permitindo "encerrar sessão" de fato (ex.: a partir do perfil, ou automaticamente após 30 min de inatividade), algo que um JWT puro não oferece.

### Autorização centralizada, difícil de esquecer a regra — mas não de esquecer o `authorize()`

Como a checagem de permissão passa por um único `Gate::before`, não existe o risco de um novo endpoint aplicar uma regra de autorização diferente por estar em um arquivo de Policy separado — a lógica é uma só, e cada controller só precisa declarar a permissão exigida via `$this->authorize('contexto.recurso.acao')`. Isso não dispensa, porém, o controller de efetivamente chamar `authorize()`: endpoints de catálogo sem uma ação específica (ex.: `GET /permissoes`, `GET /banners/disponiveis`) não chamam. Para esses casos, `AudienciaMiddleware` garante uma segunda camada — isolamento entre as audiências Admin e Private — independente de o controller ter ou não chamado `authorize()`. Ver [`seguranca.md`](./seguranca.md) e [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md#isolamento-por-audiência-admin-vs-private).

### Documentação Swagger da área Admin fail-closed

Sem `SWAGGER_ADMIN_USERNAME`/`SWAGGER_ADMIN_PASSWORD_HASH` configurados, a documentação da área administrativa fica **bloqueada por padrão** — o comportamento seguro é o padrão, não uma configuração extra que alguém precisa lembrar de ativar.

### Autenticação em dois fatores nativa

2FA (TOTP) já está implementado como parte do fluxo de autenticação, não como um módulo à parte a ser integrado depois.

### Cabeçalhos e CSP com nonce em todo o frontend

As páginas saem com uma Content-Security-Policy com **nonce novo a cada requisição** (`script-src 'self' 'nonce-…' 'strict-dynamic'`, sem `eval`). Um `<script>` injetado sem o nonce não executa, e um teste em navegador real (`e2e/csp.e2e.ts`) falha se alguma tela violar a política. `/storage` (arquivos enviados por usuários) tem cabeçalhos próprios e só exibe imagens inline.

### Rate limiting que não pune escritórios

Login, 2FA, "esqueci minha senha" e a API autenticada têm limites distintos; os de login e 2FA contam **falhas** (por usuário e por IP), então um colega que erra a senha não bloqueia os outros atrás do mesmo IP público. Os limites enxergam o IP real do usuário por meio de `TRUSTED_PROXIES` (backend) e `TRUSTED_PROXY_HOPS` (frontend). Ver [`seguranca.md`](./seguranca.md#rate-limiting).

### Proxy do BFF que não deixa o JWT escapar

O proxy do Next restringe destino, métodos e cabeçalhos (contra SSRF e path traversal) e **recusa** `login`, 2FA, `refresh` e `logout`, que têm handlers próprios. Assim nenhuma rota genérica devolve um token ao navegador.

### Tratamento de erro que não vaza detalhes internos em produção

O handler central de exceções (`backend/bootstrap/app.php`) formata todos os erros de API em um formato único e, em produção, evita expor mensagens internas de exceções não tratadas, de bibliotecas ou de erros de banco — reduzindo a superfície de informação disponível para um atacante.

### Trilha de auditoria assíncrona

Alterações em models auditáveis são registradas via job em fila, não de forma síncrona no meio da requisição — isso significa que a auditoria não pode ser burlada por um timeout ou erro que interrompa a resposta antes da gravação, já que o evento já foi despachado.

## Operação e qualidade

### Ambiente local reproduzível

O `docker-compose.yml` do Sail sobe API, PostgreSQL 17 e Redis 7 com um comando, e o `migrate --seed` cria usuários de desenvolvimento. Ver [`instalacao-local.md`](./instalacao-local.md).

### Conferência automática de produção

`php artisan producao:verificar` (backend) e `npm run verificar:producao` (frontend) acusam o que não pode ir para produção: `APP_DEBUG` ligado, segredos ausentes, `TRUSTED_PROXIES` vazio, CORS aberto, Redis sem senha/TLS/`noeviction`, contas de desenvolvimento ainda ativas. O `ProducaoSeeder` cria só catálogos e permissões, sem nenhum usuário, e `admin:criar-inicial` cria o primeiro administrador com a senha que você escolher. Ver [`checklist-producao.md`](./checklist-producao.md).

### CI com testes e auditoria de dependências

A cada push, o GitHub Actions roda Pest (PostgreSQL 17), `tsc`, ESLint, Vitest (com Redis real), build do frontend, `composer audit` e `npm audit`; os audits bloqueiam apenas severidade alta ou crítica. Ver [`testes.md`](./testes.md).

### Monitoramento pronto

`GET /api/health` (frontend) confere o Redis das sessões e responde 200 ou 503, pronto para balanceador e healthcheck; `GET /up` (API) é o healthcheck do Laravel.

## Limitações a ter em mente

Nenhuma arquitetura é isenta de trade-offs — vale registrar honestamente:

- A duplicação Admin/Private (rotas, controllers, telas) tem custo de manutenção: uma correção pode precisar ser replicada nos dois lados.
- A cobertura de testes é maior no backend (Pest com banco real, focado em autenticação, isolamento entre empresas e segurança) do que na interface. O frontend tem testes de schemas, services, BFF e componentes, mais testes de ponta a ponta em navegador real, mas estes usam um **backend simulado**: não existe E2E de pilha completa (Laravel + banco + frontend) nem medição de cobertura. O E2E não roda no CI. Ver [`testes.md`](./testes.md).
- O frontend depende de um **Redis** (sessões do BFF): sem ele ninguém entra. Em produção ele precisa de rede privada, senha, TLS e persistência ([`redis-producao.md`](./redis-producao.md)).
- Os controles de segurança foram avaliados por revisão white-box e testes automáticos; **não houve pentest independente** ([`seguranca.md`](./seguranca.md#avaliação-de-segurança)).
- O `proxy.ts` do frontend só confere se a sessão opaca existe no Redis para decidir redirecionamentos (verificação de UX); a autorização real (assinatura do JWT, sessão e permissão) acontece no backend a cada chamada.
