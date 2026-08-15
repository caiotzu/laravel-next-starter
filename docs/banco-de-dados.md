# Banco de dados

- **SGBD:** PostgreSQL 17, provisionado pelo `docker-compose.yml` do Sail (serviço `pgsql`).
- **Migrations:** `backend/database/migrations`, cobrindo autenticação/sessões, grupos e permissões, empresas (com endereços e contatos), municípios, mensagens (com destinatários e direcionamentos) e auditoria.
- **Seeders:** `backend/database/seeders`, organizados por contexto `Admin*` e `Private*`, populando tipos de entidade, permissões, grupos e dados de exemplo.

```bash
./vendor/bin/sail artisan migrate --seed
```

> O `AdminUsuarioSeeder` cria um usuário administrador de desenvolvimento (`admin@admin.com.br`, senha definida no próprio seeder). Use apenas em ambiente local — nunca rode esse seeder em produção sem revisar as credenciais.

## Modelos principais

| Model | Descrição |
|---|---|
| `Usuario` | Autenticável (JWT), com grupo, status, 2FA e soft delete |
| `Grupo` | Agrupamento de permissões; versão incrementada invalida cache de permissões |
| `Permissao` | Permissão individual (chave usada em `$this->authorize()`) |
| `Empresa`, `EmpresaEndereco`, `EmpresaContato` | Dados da empresa e seus relacionamentos |
| `GrupoEmpresa` | Vínculo entre grupo e empresa (contexto Private) |
| `Mensagem`, `MensagemDestinatario`, `MensagemDirecionamento` | Sistema de mensagens internas |
| `Auditoria` | Trilha de alterações (gravada de forma assíncrona) |
| `UsuarioSessao` | Sessões ativas, usadas pelo `JwtMiddleware` para revogação |
| `TokenResetSenha` | Tokens de redefinição de senha / primeiro acesso |
| `Municipio` | Base de municípios para lookup |

Todos usam UUID como chave primária (`HasUuids`).

## Auditoria

O trait `Auditavel` (`app/Auditoria/Auditavel.php`), aplicado a models como `Usuario`, registra alterações automaticamente, gravadas de forma assíncrona via `GravarAuditoriaJob` — veja [`filas-e-eventos.md`](./filas-e-eventos.md).
