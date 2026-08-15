# Por que essa arquitetura

Este documento resume as decisões de design do starter e o que elas trazem na prática, para quem está avaliando usá-lo como base de um novo projeto.

## Arquitetura

### Separação clara de responsabilidades no backend

O fluxo `Controller → Request → DTO → Service → Model → Resource` mantém cada camada com uma única responsabilidade:

- **Controller** só orquestra (validação, autorização, chamada ao service, resposta);
- **Request** valida a entrada;
- **DTO** desacopla o Service do formato bruto da requisição HTTP;
- **Service** concentra a regra de negócio — é o único lugar que muda quando a regra muda;
- **Resource** controla exatamente o que é exposto na resposta.

Na prática: regra de negócio nunca fica presa a um controller específico, o que facilita reuso (ex.: o mesmo `Service` pode ser chamado por um job ou um comando artisan) e torna os testes de unidade mais diretos.

### Domínios já modelados como referência

Empresas, usuários, grupos/permissões, mensagens e auditoria já implementam o padrão completo (Controller → ... → Resource, DTOs, Requests, eventos). Um novo domínio pode ser criado copiando essa estrutura, em vez de decidir do zero como organizar cada peça.

### Dois contextos de acesso (Admin/Private) sem gambiarra de permissão

Em vez de um único conjunto de rotas com `if (isAdmin)` espalhado pelo código, Admin e Private têm controllers, DTOs e telas próprios. Isso custa alguma duplicação, mas evita acoplamento entre regras de negócio de contextos diferentes — mudar uma regra do Admin não arrisca quebrar o Private.

### Frontend como BFF, não como cliente direto da API

O Next.js nunca expõe a URL real do backend nem o token ao navegador — só fala com suas próprias rotas internas (`app/api/**`), que repassam a chamada. Isso permite, por exemplo, trocar a URL do backend, adicionar cache ou agregar chamadas sem tocar em código de UI.

### Organização por domínio no frontend, não por tipo de arquivo

`domains/{contexto}/{recurso}` (dados) + `features/{contexto}/{recurso}` (UI) significa que tudo relacionado a "usuários" fica junto, em vez de espalhado entre pastas genéricas `hooks/`, `services/`, `types/` misturando recursos diferentes. Escala melhor conforme o número de telas cresce.

### Documentação de API que não desatualiza sozinha

Os atributos OpenAPI vivem nos próprios controllers — quando alguém muda uma rota, a tentação de esquecer de atualizar um YAML separado desaparece, porque a documentação é gerada do mesmo lugar que o código.

## Segurança

### O token JWT nunca chega ao JavaScript do navegador

O JWT é gravado em cookie `httpOnly` pelas rotas de autenticação do Next.js. Isso elimina a classe de ataque mais comum contra tokens em SPA: roubo via XSS lendo `localStorage`/`sessionStorage`. Um script malicioso injetado na página não consegue ler o cookie.

### Revogação de sessão mesmo com JWT ainda válido

JWT por natureza é difícil de revogar antes de expirar. Este starter contorna isso guardando cada sessão em banco (`usuario_sessoes`) e validando-a a cada requisição, além do token — permitindo "encerrar sessão" de fato (ex.: a partir do perfil, ou automaticamente após 30 min de inatividade), algo que um JWT puro não oferece.

### Autorização centralizada, difícil de esquecer

Como a checagem de permissão passa por um único `Gate::before`, não existe o risco de um novo endpoint "esquecer" de aplicar a regra de autorização por estar em um arquivo de Policy diferente — a lógica é uma só, e cada controller só precisa declarar a permissão exigida.

### Documentação Swagger da área Admin fail-closed

Sem `SWAGGER_ADMIN_USERNAME`/`SWAGGER_ADMIN_PASSWORD_HASH` configurados, a documentação da área administrativa fica **bloqueada por padrão** — o comportamento seguro é o padrão, não uma configuração extra que alguém precisa lembrar de ativar.

### Autenticação em dois fatores nativa

2FA (TOTP) já está implementado como parte do fluxo de autenticação, não como um módulo à parte a ser integrado depois.

### Tratamento de erro que não vaza detalhes internos em produção

O handler central de exceções (`backend/bootstrap/app.php`) formata todos os erros de API em um formato único e, em produção, especificamente evita expor mensagens internas de exceções não tratadas ou de erros de banco — reduzindo a superfície de informação disponível para um atacante.

### Trilha de auditoria assíncrona

Alterações em models auditáveis são registradas via job em fila, não de forma síncrona no meio da requisição — isso significa que a auditoria não pode ser burlada por um timeout ou erro que interrompa a resposta antes da gravação, já que o evento já foi despachado.

## Limitações a ter em mente

Nenhuma arquitetura é isenta de trade-offs — vale registrar honestamente:

- A duplicação Admin/Private (rotas, controllers, telas) tem custo de manutenção: uma correção pode precisar ser replicada nos dois lados.
- Não há testes automatizados cobrindo os domínios de negócio ainda (só os testes de exemplo) — ver [`testes.md`](./testes.md).
- O `middleware.ts` do frontend decodifica o JWT apenas para checar expiração, sem validar assinatura — a validação real de assinatura acontece no backend a cada chamada ao proxy, então isso não é uma falha de segurança, mas vale entender a diferença entre "verificação de UX" (middleware) e "verificação de segurança" (backend).
