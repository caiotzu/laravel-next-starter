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
| Admin | `/admin/*` | Gestão de empresas, usuários, grupos, permissões, auditoria, mensagens |
| Private | sem prefixo (ex.: `/empresas`, `/usuarios`, `/grupos`) | Mesmas funcionalidades, escopadas ao usuário/empresa autenticado |
| Global | `/mensagens/*` (contador, marcar como lida) | Compartilhado entre Admin e Private |
| Lookup | `/lookup/*` | Consultas auxiliares (CEP, municípios, tipos) |

Todas exigem o middleware `jwt`, exceto login, primeiro acesso e recuperação de senha.

- **Usuários:** `GET|POST /usuarios`, `GET|PUT /usuarios/{id}`, `DELETE /usuarios/{id}`, `PATCH /usuarios/{id}/ativar` (e equivalentes em `/admin/usuarios`);
- **Grupos:** `GET|POST /grupos`, `GET|PUT /grupos/{id}`, `PATCH /grupos/{id}/permissoes` (sincroniza permissões);
- **Empresas:** `GET /empresas`, `GET|PUT /empresas/{id}` (Private e Admin); `POST /empresas`, `DELETE /empresas/{id}` e `PATCH /empresas/{id}/ativar` só em `/admin/empresas`. Ambos os contextos têm `/{empresaId}/contatos` e `/{empresaId}/enderecos` com CRUD completo;
- **Grupos-empresas** *(somente Admin)*: `/admin/grupos-empresas`, incluindo `PATCH /{grupoId}/usuarios/{usuarioId}/status` e `/redefinir-senha`;
- **Mensagens:** `GET|POST /mensagens`, `GET /mensagens/{id}`; contador e marcação de lida em `/mensagens/nao-lidas/contador` e `/mensagens/{id}/marcar-lida`;
- **Auditoria** *(somente Admin)*: `GET /admin/auditorias`, `/admin/auditorias/entidades`, `/admin/auditorias/entidades/{entidade}`.

Rotas completas e atualizadas: `backend/routes/api.php`. Para parâmetros e schemas de request/response, use o Swagger.

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
