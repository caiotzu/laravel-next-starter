# API

## Documentação Swagger

A API expõe **duas** especificações OpenAPI independentes (`backend/config/l5-swagger.php`), geradas a partir dos atributos `#[OA\...]` nos controllers:

| Documentação | Controllers incluídos | UI | Proteção |
|---|---|---|---|
| `default` | `Global`, `Private`, `Lookup` | `/api/documentation` | Pública (endpoints continuam exigindo Bearer JWT) |
| `admin` | `Admin` | `/api/documentation/admin` | HTTP Basic Auth (`swagger.admin.auth`), via `SWAGGER_ADMIN_USERNAME`/`SWAGGER_ADMIN_PASSWORD_HASH` |

Sem essas duas variáveis configuradas, a documentação Admin fica bloqueada por padrão (*fail-closed*).

```bash
# 1. Gerar credenciais da documentação Admin
./vendor/bin/sail artisan swagger:admin-hash "sua-senha-forte-aqui"
# copie as duas linhas impressas para o .env

# 2. Gerar as specs
./vendor/bin/sail artisan l5-swagger:generate
```

Gera `storage/api-docs/api-docs.json` (default) e `storage/api-docs-admin/api-docs-admin.json` (admin). Com `L5_SWAGGER_GENERATE_ALWAYS=true`, as specs são regeneradas a cada acesso — recomendado só em desenvolvimento.

## Referência de rotas por recurso

Organização por prefixo/contexto (`backend/routes/api.php`):

| Contexto | Prefixo | Descrição |
|---|---|---|
| Admin | `/admin/*` | Gestão de empresas, usuários, grupos, permissões, auditoria, mensagens, banners |
| Private | sem prefixo (ex.: `/empresas`, `/usuarios`, `/grupos`, `/banners/disponiveis`) | Mesmas funcionalidades, escopadas ao usuário/empresa autenticado |
| Global | `/mensagens/*` (contador, marcar como lida) | Compartilhado entre Admin e Private |
| Lookup | `/lookup/*` | Consultas auxiliares (CEP, municípios, tipos) |

Todas as rotas autenticadas exigem o middleware `jwt`. Exceções: login, primeiro acesso e recuperação de senha (não autenticadas por natureza), `GET /version` e o download de anexos de chamado (`GET /chamados/anexos/{anexo}`), que troca `jwt` por um link assinado (`signed:relative`) — ver [`seguranca.md`](./seguranca.md#upload-e-download-de-arquivos). O grupo Admin ainda passa por `audiencia:admin` e o grupo Private por `audiencia:private`; ambos passam por `suporte.contexto` (Acesso de Suporte) — ver [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md).

- **Usuários:** `GET|POST /usuarios`, `GET|PUT /usuarios/{id}`, `DELETE /usuarios/{id}`, `PATCH /usuarios/{id}/ativar` (e equivalentes em `/admin/usuarios`);
- **Grupos:** `GET|POST /grupos`, `GET|PUT /grupos/{id}`, `DELETE /grupos/{id}`, `PATCH /grupos/{id}/ativar`, `PATCH /grupos/{id}/permissoes` (sincroniza permissões) — e equivalentes em `/admin/grupos`;
- **Permissões:** `GET /permissoes` (e `/admin/permissoes`) — catálogo de chaves de permissão disponíveis;
- **Empresas:** `GET /empresas`, `GET|PUT /empresas/{id}` (Private e Admin); `POST /empresas`, `DELETE /empresas/{id}` e `PATCH /empresas/{id}/ativar` só em `/admin/empresas`. Ambos os contextos têm `/{empresaId}/contatos` e `/{empresaId}/enderecos` com CRUD completo;
- **Grupos-empresas** *(somente Admin)*: `/admin/grupos-empresas`, incluindo `PATCH /{grupoId}/usuarios/{usuarioId}/status` e `/redefinir-senha`;
- **Mensagens:** `GET /mensagens`, `GET /mensagens/{id}` (leitura, para Admin e Private); `POST /admin/mensagens` cria (somente Admin); contador em `/mensagens/nao-lidas/contador`, marcação de lida individual (`PATCH /mensagens/{id}/marcar-lida`) e em massa (`PATCH /mensagens/marcar-todas-lidas`); `GET /admin/mensagens/usuarios` busca destinatários ao compor uma mensagem (somente Admin), além de `GET /admin/mensagens` e `GET /admin/mensagens/{id}`;
- **Banners:** `GET|POST /admin/banners`, `GET|PUT /admin/banners/{id}`, `DELETE /admin/banners/{id}`, `PATCH /admin/banners/{id}/ativar`, `/desativar` e `/restaurar` (gestão, somente Admin); `GET /banners/disponiveis` (Admin e Private) retorna somente os banners ativos, dentro do período e elegíveis para o direcionamento do usuário autenticado;
- **Auditoria** *(somente Admin)*: `GET /admin/auditorias`, `/admin/auditorias/entidades`, `/admin/auditorias/entidades/{entidade}`, `/admin/auditorias/usuarios`;
- **Dashboard** *(somente Admin)*: `GET /admin/dashboard` — KPIs calculados a partir de chamados e empresas;
- **Releases (novidades da plataforma):** `GET /releases`, `GET /releases/{id}` (Private lista somente publicadas); `POST /admin/releases`, `GET|PUT /admin/releases/{id}`, `GET /admin/releases`, `PATCH /admin/releases/{id}/publicar` (gestão, somente Admin);
- **Chamados (suporte):** `GET /chamados`, `GET /chamados/{id}` e `POST /chamados/{id}/mensagens` (responder) em ambos os contextos; `POST /chamados` (abrir) é exclusivo do Private; `PATCH /admin/chamados/{id}/status`, `/prioridade` e `/responsavel` são exclusivos do Admin. Download de anexo por link assinado em `GET /chamados/anexos/{anexo}` (fora do grupo `jwt`, ver acima);
- **Acesso de Suporte:** `POST /acessos-suporte` (Private concede acesso temporário a um Admin), `GET /acessos-suporte` em ambos os contextos, `DELETE /acessos-suporte/{id}` (revogar, Private) e `DELETE /admin/acessos-suporte/{id}` (encerrar, Admin). Detalhes do fluxo em [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md#acesso-de-suporte-impersonação-temporária-e-auditável).

Rotas completas e atualizadas: `backend/routes/api.php`. Para parâmetros e schemas de request/response, use o Swagger. Para rate limiting e cabeçalhos de segurança aplicados a estas rotas, ver [`seguranca.md`](./seguranca.md).

## Formato de erro

Erros seguem o formato:

```json
{ "errors": { "business": ["Mensagem de erro"] } }
```

ou, em validação de formulário:

```json
{ "errors": { "campo": ["Mensagem de validação"] } }
```

Centralizado em `backend/bootstrap/app.php` (`withExceptions`), que trata `ValidationException`, `AccessDeniedHttpException`, `ModelNotFoundException`, `BusinessException` e exceções genéricas de forma consistente — em produção, erros inesperados nunca vazam a mensagem original.

## Frontend

Não há um client HTTP único: chamadas autenticadas usam `axios.post('/api/proxy/{admin|private}', { url, method, data })`, delegando ao *route handler* de proxy a comunicação com o backend. `frontend/lib/proxy-admin.ts` e `proxy-private.ts` concentram esses helpers por contexto.
