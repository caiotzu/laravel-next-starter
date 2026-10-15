# Repositories e escopo de entidade

Os Repositories existem para **um problema real**: o isolamento de dados entre empresas. Eles NÃO são
uma camada genérica; só existem onde há consultas com dono e/ou complexidade que justifique.

```text
Controller → Form Request → DTO → Service → Repository → Model (Eloquent)
```

| Camada | Faz | Não faz |
|---|---|---|
| **Service** | regra de negócio, transação, eventos, `BusinessException`, auditoria manual, orquestração | montar consulta de Usuario/Grupo, ler `Auth::user()` para decidir tenant |
| **Repository** | `where`/`with`/paginação/`exists`/`find`/`create` de uma entidade | regra de negócio, transação, evento, `Auth::user()` |

Repositories **sem interface** e **sem `BaseRepository`**: são classes concretas, injetadas pelo container.
O Eloquent não vai ser trocado, e os testes usam o banco real, então uma interface só adicionaria indireção.

## Hoje

| Repository | Usado por | Por quê |
|---|---|---|
| `App\Repositories\GrupoRepository` | `GrupoService`, `UsuarioService`, `GrupoEmpresaService` | consultas com dono (escopo), duplicadas em 12 pontos |
| `App\Repositories\UsuarioRepository` | `UsuarioService`, `GrupoEmpresaService`, `AcessoSuporteService` (+ `ConcederRequest`), `MensagemService` | consultas com dono + lookups de autenticação + lookups de administrador + busca global de destinatários |

Não têm Repository (de propósito): Empresa (já usa `EscopoEntidadeService::aplicar`), Chamado, Banner, Release,
Mensagem, AcessoSuporte, Dashboard (somente agregações de leitura) e as tabelas simples.

### Onboarding de empresa (`GrupoEmpresaService::cadastrar`)

Um Admin cria a empresa, o grupo "Administrador" e o usuário convidado. O grupo nasce no escopo da **nova**
empresa (não no do admin autenticado), então o `EscopoEntidade` é montado explicitamente — é o caso previsto no
docblock da classe ("em jobs/testes, construindo de forma explícita"):

```php
$grupo = $this->grupos->criarNoEscopo(new EscopoEntidade($entidadeTipo->id, $grupoEmpresa->id), 'Administrador');
$usuario = $this->usuarios->criarNoGrupo($grupo, [/* nome, email, senha => null, status */]);
```

Coberto por `tests/Feature/GrupoEmpresaOnboardingTest.php`; `GrupoEmpresaService` também entra na guarda
estrutural (não pode voltar a usar `Usuario::create`/`Grupo::create`).

## Escopo de entidade (a regra de ouro)

Todo usuário/grupo pertence a um **tipo de entidade** (`admin`, `private`) e a uma **entidade** (`null` no
admin; o `grupo_empresa` no private). Para uma requisição, "de quem são os dados" é o **escopo efetivo**,
que considera o modo de suporte (um admin impersonando enxerga o escopo do cliente).

```php
// Service
$escopo = $this->escopoEntidade->atual();                       // única fonte da verdade
$grupo  = $this->grupos->buscarNoEscopo($escopo, $id);          // o Repository aplica o filtro

// Repository — o filtro existe em UM método privado por classe
private function noEscopo(EscopoEntidade $escopo): Builder
{
    return Grupo::query()
        ->where('entidade_tipo_id', $escopo->entidadeTipoId)
        ->where('entidade_id', $escopo->entidadeId);
}
```

Por que isso evita vazamento:

1. **Impossível esquecer o escopo.** Todo método público de leitura recebe `EscopoEntidade` como 1º parâmetro.
   Não há `find($id)` solto para usar por engano.
2. **Um filtro, um lugar.** Mudar a regra de isolamento é mexer em `noEscopo()`.
3. **Uma fonte.** Só `EscopoEntidadeService::atual()` lê o contexto (`AcessoSuporteContexto`).
4. **Falha fechada.** Sem usuário autenticado, `atual()` lança `LogicException` em vez de listar tudo.
5. **Travado por testes** (`tests/Unit/RepositoriesEscopoTest.php`):
   - método público sem `EscopoEntidade` só passa se estiver numa lista de exceções revisada;
   - nenhum arquivo, fora do `EscopoEntidadeService`, lê `->entidadeTipoId(...)`/`->entidadeId(...)` do contexto;
   - `UsuarioService`/`GrupoService` não podem voltar a montar consultas de Usuario/Grupo nem usar `Auth::user()`.

### Métodos sem escopo (por natureza)

| Método | Motivo |
|---|---|
| `buscarAtivoPorEmail`, `buscarAtivoPorId`, `buscarAtivoOuConvidadoPorEmail` | login / refresh / "esqueci a senha": ainda não há usuário autenticado; o tipo vem da audiência da rota |
| `buscarClienteDoGrupo` | ação de Admin sobre usuários de clientes (restrita ao tipo `private`, autorizada por permissão na rota) |
| `listarAdministradoresComPermissao` | lookup exclusivo de administradores |
| `criarNoGrupo(Grupo $grupo, ...)` | recebe um `Grupo` que o Service já validou no escopo |

### Auditoria dos demais módulos (REPO-002, 2026-10-15)

Quem é o "dono" de cada dado e o que garante o isolamento hoje. **Conclusão: nenhum precisa de Repository** — o
isolamento já existe e um Repository só moveria código. Critério para reavaliar: aparecer a 3ª consulta
duplicada com dono, ou um bug de escopo que o mecanismo atual não consiga evitar.

| Módulo | Dono | Garantia atual | Decisão |
|---|---|---|---|
| Empresa | `grupo_empresa_id` | `EscopoEntidadeService::aplicar()` em todos os métodos (inclui `excluir`/`ativar`, corrigido em SEC-003) | manter |
| EmpresaContato / EmpresaEndereco | via `empresa_id` | `validarAcessoEmpresa()` em 100% dos métodos do Service (verificado por script) + guarda `empresaVisivel()` nos Form Requests Private (SEC-002) | manter |
| Chamado | `usuario_id` (quem abriu) | controller Private passa `Auth::id()`; `visualizarPrivate` filtra por dono; `responder` é precedido dele (fragilidade: SEC-004) | manter |
| Mensagem (destinatário) | `usuario_id` | `MensagemDestinatarioService` recebe o usuário e filtra por ele | manter |
| Banner / Release | não é dado de empresa: **audiência** (`entidade_tipo_id`) | filtro por contexto (`disponiveisPara`, `listarPublicadas`) | manter |
| AcessoSuporte | ator (concedente / admin) | todo método filtra por `usuario_concedente_id` ou `usuario_admin_id` | manter |
| Dashboard | agregados globais, só Admin | não há rota Private | manter |

Regra para **Form Requests** que consultam dados com dono: chamar `EscopoEntidadeService::empresaVisivel($empresaId)`
antes e retornar sem validar se a empresa não for visível — assim o Service responde o 400 padrão e a mensagem
de validação não vira um oráculo sobre dados de outra organização.

### Lookups de Usuario sem escopo (REPO-003, 2026-10-15)

Cinco pontos consultavam `Usuario` fora do repository. Decisão por ponto, pelo critério "qual problema concreto
a abstração resolve":

| Ponto | Decisão | Motivo |
|---|---|---|
| `AcessoSuporteService::conceder` + `ConcederRequest` | **migrado** → `UsuarioRepository::buscarAdministradorPorId` | a regra "é administrador" estava **duplicada** (Request e Service, com comparações ligeiramente diferentes); agora vive na consulta (`whereHas` no tipo Admin) e o chamador só testa `null` |
| `MensagemService::buscarUsuarios` | **migrado** → `UsuarioRepository::pesquisarEmTodasAsEntidades` | é a leitura mais sensível (nome e e-mail de usuários de **todas** as empresas); em um Service ela era invisível à guarda. Agora está em `METODOS_SEM_ESCOPO` e `MensagemService` não pode mais montar consulta de Usuario |
| Listeners `InvalidarSessoesDosUsuariosDoGrupo[Empresa]` | **mantido** | ação de sistema disparada por evento (sem usuário autenticado), um `pluck('id')` de uma linha, um único chamador cada |
| `PopularDestinatariosMensagemJob` (4 consultas) | **mantido** | job em fila, em lotes (`chunkById`); o fan-out entre empresas é a **função** do job (mensagem geral/por entidade/por permissão, criada só pelo Admin). Mover exigiria um método por modo, sem ganho |

`buscarAdministradorPorId` **não filtra por status** (preserva o comportamento anterior: o Request e o Service
nunca checaram se o admin está ativo). Se isso deve mudar, é decisão de regra de negócio separada.

## Identidade × contexto

`Auth::user()` continua sendo a **identidade** real. O **contexto** (escopo) pode diferir dela em modo de suporte.

| Precisa de… | Use | Exemplos |
|---|---|---|
| quem é o usuário (perfil, 2FA, remetente, auditoria, sessão) | `Auth::user()` / `Auth::id()` | `PerfilController`, `MensagemService`, `AuditoriaContexto` |
| de quem são os dados (tenant) | `EscopoEntidadeService::atual()` | `GrupoService`, `UsuarioService`, requests de Empresa |
| organização que **concede** acesso de suporte | `Auth::user()->grupo` (identidade, de propósito) | `ConcederRequest`, `Private\AcessoSuporteController::conceder` |

O último caso NÃO deve usar o contexto: em modo de suporte ele devolveria a entidade impersonada e permitiria
a um admin conceder acesso em nome do cliente.

## Quando criar um novo Repository

Só se **todas** forem verdade: a consulta existe hoje no Service; é acesso a dados; tem dono (tenant) ou
complexidade real (filtros, eager loading, locks); e o Service fica mais legível. Se for tabela de dono
(`entidade_tipo_id`/`entidade_id`), todo método de leitura **deve** receber `EscopoEntidade`.
