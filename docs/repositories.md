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
| `App\Repositories\UsuarioRepository` | `UsuarioService`, `GrupoEmpresaService` | consultas com dono + 3 lookups de autenticação parecidos |

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

### Consultas de Usuario fora do repository (pendência REPO-003)

Ainda existem, de propósito ou por avaliar: `MensagemService::buscarUsuarios` (busca global por design, para
direcionar mensagem a qualquer usuário), a busca do admin em `AcessoSuporteService::conceder` e em
`Private\AcessoSuporte\ConcederRequest`, os listeners `InvalidarSessoesDosUsuariosDoGrupo[Empresa]` e o
`PopularDestinatariosMensagemJob`. Estado e decisão: `IMPLEMENTATION_PLAN.md` (F-4, REPO-002/003).

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
