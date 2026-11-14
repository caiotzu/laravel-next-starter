# Backend (Laravel)

Como a API funciona e como evoluí-la. Para rodar: [`instalacao-local.md`](./instalacao-local.md). Para segurança: [`seguranca.md`](./seguranca.md).

**Stack:** PHP 8.5 · Laravel 13 · PostgreSQL 17 · JWT (`tymon/jwt-auth`) · 2FA (`google2fa`) · Swagger (`l5-swagger`) · Pest 5.

---

## 1. Como uma requisição é processada

```text
Route → Controller → Form Request → DTO → Service → (Repository) → Model → Resource
```

| Camada | Faz | Não faz |
|---|---|---|
| **Controller** | `authorize('chave')`, chama o Service, devolve o Resource, atributos OpenAPI | regra de negócio |
| **Form Request** | valida a entrada | autoriza (isso é do Controller) |
| **DTO** | normaliza os dados validados (um por caso de uso) | lógica |
| **Service** | regra de negócio, transação, eventos, `BusinessException` | montar consulta de Usuario/Grupo; ler `Auth::user()` para decidir empresa |
| **Repository** | consulta de **uma** entidade com dono | regra de negócio, transação, evento |
| **Model** | relacionamentos, casts, scopes | regra de negócio |
| **Resource** | formata o JSON de resposta | — |

💡 **Regra de ouro:** a mesma regra de negócio vive em **um** lugar (o Service).

### Pastas principais (`backend/app`)

| Pasta | Conteúdo |
|---|---|
| `Http/Controllers/{Admin,Private,Global,Lookup}` | controllers por contexto |
| `Http/Requests`, `Http/Resources` | validação e respostas |
| `Http/Middleware` | `jwt`, `audiencia`, `suporte.contexto`, `security.headers`, `swagger.admin.auth` |
| `DTO/{Recurso}` | um DTO por caso de uso |
| `Services` (+ `External`, `Storage`) | regras de negócio e integrações |
| `Repositories` | `Grupo` e `Usuario` (dados com dono) |
| `Contracts` | interfaces de integrações (CEP, e-mail, arquivos) |
| `Jobs`, `Events`, `Listeners` | fila e eventos |
| `Console/Commands` | comandos artisan próprios |

---

## 2. Autenticação

- **Login** por e-mail e senha, nos dois contextos (`/admin/login` e `/login`).
- **JWT** (HS256) com validade `JWT_TTL` (padrão **60 min**).
- **Sessão em banco** (`usuario_sessoes`): permite revogar uma sessão mesmo com o JWT ainda válido.
- **Inatividade:** sessões paradas há mais de **30 min** são encerradas (comando agendado a cada 10 min).
- **2FA (TOTP):** habilitar, confirmar com o 1º código e desabilitar no perfil; cada código só vale uma vez.
- **Primeiro acesso e recuperação de senha:** por token enviado por e-mail, com expiração e uso único.
- **Refresh:** a rota existe no backend, mas o frontend **não a usa**; ao expirar, o usuário entra de novo.

Toda rota autenticada passa pelo middleware `jwt`: valida o token e confirma que a sessão ainda está ativa.

---

## 3. Permissões e audiências

- Um único `Gate::before` (`AuthServiceProvider`) resolve todas as permissões.
- Permissões ficam no banco, ligadas a **grupos**; o resultado é cacheado por grupo/versão.
- Cada ação do Controller chama `$this->authorize('contexto.recurso.acao')`, por exemplo `admin.grupo_empresa.cadastrar`.
- ⚠️ Use sempre a chave **do próprio recurso e da ação**. Copiar de um controller vizinho e esquecer de trocar já causou bug.
- **`AudienciaMiddleware`** impede que um JWT de **Admin** alcance rotas **Private** (e vice-versa), mesmo em endpoints sem `authorize()`.
- Permissão nova: acrescente no `AdminPermissaoSeeder` ou no `PrivatePermissaoSeeder`.

---

## 4. Multi-empresa (tenant) e Repositories

Todo usuário e grupo pertence a um **tipo de entidade** (`admin` ou `private`) e a uma **entidade** (a empresa, no Private).

| Situação | O que o usuário enxerga |
|---|---|
| Admin normal | tudo |
| Admin em Acesso de Suporte | só a empresa do cliente que concedeu |
| Private | só a própria empresa |

**Como o isolamento é garantido**

- `EscopoEntidadeService::atual()` é a **única** fonte de "de quem são os dados".
- Os Repositories (`GrupoRepository`, `UsuarioRepository`) exigem um `EscopoEntidade` no 1º parâmetro de toda leitura: é impossível "esquecer" o filtro.
- O filtro existe em **um** método privado por classe (`noEscopo()`).
- Teste arquitetural (`RepositoriesEscopoTest`) falha se alguém quebrar a regra. Métodos sem escopo por natureza (ex.: login) ficam numa lista revisada, `METODOS_SEM_ESCOPO`.
- Resposta de erro **nunca** revela se um dado existe em outra empresa.

**Identidade × contexto**

| Preciso de… | Uso |
|---|---|
| quem é o usuário (perfil, 2FA, auditoria) | `Auth::user()` |
| de quem são os dados | `EscopoEntidadeService::atual()` |

**Repositories: padrão oficial**

- Classes concretas, **sem interface** e **sem `BaseRepository`**.
- Só para dados **com dono** ou consulta realmente complexa.
- Os demais módulos (Empresa, Chamado, Banner…) usam Eloquent no Service; no caso de Empresa, com `EscopoEntidadeService::aplicar()` em **todo** método que busca por id.
- **Criar um novo Repository só se** a consulta já existe num Service, é acesso a dados, tem dono ou complexidade real **e** o Service fica mais legível.
- Form Request que consulta dado com dono deve chamar `EscopoEntidadeService::empresaVisivel()` antes, para a validação não virar um "oráculo" sobre outra empresa.

---

## 5. Acesso de Suporte

Permite que um Admin atue **temporariamente** na empresa de um cliente, **só com a autorização dele**.

1. O cliente **concede** o acesso, com duração definida (`POST /acessos-suporte`).
2. O Admin envia o header `X-Acesso-Suporte-Id` nas requisições.
3. O middleware `suporte.contexto` valida dono, status e validade, e ativa o contexto da requisição.
4. O Admin passa a enxergar **só** aquela empresa; `Auth::user()` continua sendo o Admin real.
5. O acesso pode ser **revogado** a qualquer momento (pelo cliente ou pela gestão) e **expira sozinho** (comando agendado a cada minuto).
6. Toda ação feita durante o acesso é auditada com o `acesso_suporte_id`.

Só administrador **ativo** pode receber a concessão.

---

## 6. Banco de dados

- **PostgreSQL 17.** Chaves primárias **UUID**; *soft delete* em `Usuario` e `Banner`.
- **Migrations:** `database/migrations`. **Seeders:** `database/seeders`, separados em `Admin*` e `Private*`.
- `migrate --seed` cria os usuários de desenvolvimento. Em produção use só `ProducaoSeeder` (catálogos e permissões, sem usuários).

| Modelo | Para quê |
|---|---|
| `Usuario`, `Grupo`, `Permissao` | acesso e permissões (`Grupo.versao` invalida o cache) |
| `GrupoEmpresa`, `Empresa` (+ endereços e contatos) | clientes |
| `Mensagem` (+ destinatários e direcionamentos) | comunicados internos |
| `Banner` (+ imagens e links) | campanhas exibidas no sistema |
| `Chamado` (+ mensagens e anexos) | suporte |
| `Release` | novidades da plataforma |
| `AcessoSuporte` | concessões temporárias |
| `Auditoria` | trilha de alterações |
| `UsuarioSessao`, `TokenResetSenha` | sessões e tokens |
| `Municipio` | base para consulta de municípios |

A trait `Auditavel` registra as alterações dos models automaticamente.

---

## 7. Filas, eventos e agendador

| Item | O que faz |
|---|---|
| `GravarAuditoriaJob` | grava a auditoria em segundo plano |
| `PopularDestinatariosMensagemJob` | gera os destinatários de uma mensagem |
| Listeners de e-mail | usuário criado, esqueceu a senha, senha alterada |
| Listeners de sessão | invalidam sessões ao desativar/excluir usuário, grupo ou grupo de empresas |

**Comandos agendados** (`routes/console.php`):

| Comando | Frequência |
|---|---|
| `usuario-sessao:limpar-expiradas` | a cada 10 min |
| `acesso-suporte:expirar-vencidos` | a cada minuto |

**Outros comandos:** `swagger:admin-hash` · `chamados:mover-anexos-privados [--dry-run]` · `producao:verificar` · `admin:criar-inicial`.

Em produção, `QUEUE_CONNECTION=database` exige um worker (`queue:work`). Em desenvolvimento use `sync` ou rode o worker.

---

## 8. API e Swagger

| Documentação | URL | Proteção |
|---|---|---|
| Pública (Global, Private, Lookup) | `/api/documentation` | aberta (endpoints exigem JWT) |
| Admin | `/api/documentation/admin` | HTTP Basic; **fechada** se as credenciais não existirem |

- **Rotas:** `routes/api.php`. Admin em `/admin/*`; Private na raiz; `/mensagens/*` é compartilhada; `/lookup/*` traz consultas auxiliares (CEP, municípios).
- **Paginação:** `por_pagina` (padrão 10, máximo 100).
- **Health check:** `GET /up`.
- Mudou um endpoint? Atualize os atributos OpenAPI do controller.

| Código | Quando |
|---|---|
| `400` | regra de negócio (`BusinessException`) |
| `401` | token ausente/inválido, sessão encerrada, credenciais erradas |
| `403` | sem permissão ou audiência errada |
| `404` | registro não encontrado |
| `422` | validação de formulário |
| `429` | limite de requisições |
| `500` | erro inesperado (mensagem genérica em produção) |

Formato de erro: `{ "errors": { "campo": ["mensagem"] } }` (regra de negócio em `errors.business`).

---

## 9. Integrações externas

Ficam atrás de interfaces em `app/Contracts`, escolhidas por configuração.

| Integração | Implementações |
|---|---|
| CEP | ViaCEP, com *fallback* para BrasilAPI (3 s de timeout cada) |
| E-mail (`EMAIL_PROVIDER`) | Amazon SES ou Mailtrap |
| Arquivos (`FILE_STORAGE_DRIVER`) | disco local ou S3: [`armazenamento-de-arquivos.md`](./armazenamento-de-arquivos.md) |

---

## 10. Convenções de nome

| Elemento | Padrão | Exemplo |
|---|---|---|
| Domínio | português | `GrupoEmpresa`, `AcessoSuporte` |
| Controller | `Http/Controllers/{Contexto}/{Recurso}Controller` | `Admin/GrupoEmpresaController` |
| Form Request | `{Contexto}/{Recurso}/{Verbo}Request` | `Admin/GrupoEmpresa/CadastrarRequest` |
| DTO | `DTO/{Recurso}/{Recurso}{CasoDeUso}DTO` | `GrupoEmpresaCadastroDTO` |
| Service / Repository | `{Recurso}Service` / `{Recurso}Repository` | `GrupoService` |
| Método de Repository | `{verbo}{Qualificador}NoEscopo` | `buscarComPermissoesNoEscopo` |
| Permissão | `{admin\|private}.{recurso}.{acao}` | `admin.grupo_empresa.cadastrar` |

---

## 11. Como criar uma funcionalidade

1. Use o módulo **irmão mais parecido** como molde.
2. **Migration** (+ factory e seeder se for model novo) → **Model**.
3. **Form Requests** por verbo → **DTO** → **Service** (transação, evento, `BusinessException`).
4. **Repository** só se atender aos critérios da seção 4; senão, Eloquent no Service.
5. **Resource**, **Controller** com `authorize('chave-do-recurso')` e atributos OpenAPI; rotas em `routes/api.php`.
6. **Permissão** nova no seeder do contexto.
7. **Testes** (Pest): rota → banco, com caso **cross-tenant** quando houver dono. Veja [`testes.md`](./testes.md).

Estilo: use `Pint` **só em arquivos novos** (`pint caminho/novo.php`); em arquivo existente siga o estilo local.
