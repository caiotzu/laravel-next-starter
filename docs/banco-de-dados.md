# Banco de dados

- **SGBD:** PostgreSQL 17, provisionado pelo `docker-compose.yml` do Sail (serviço `pgsql`).
- **Migrations:** `backend/database/migrations`, cobrindo autenticação/sessões, grupos e permissões, empresas (com endereços e contatos), municípios, mensagens (com destinatários e direcionamentos), banners (com imagens e links), chamados de suporte (com mensagens e anexos), releases (novidades da plataforma), Acesso de Suporte e auditoria.
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
| `Banner`, `BannerImagem`, `BannerLink` | Campanhas de banner exibidas no Admin e no Private, com período, direcionamento (todos/entidade), múltiplas imagens e links |
| `Chamado`, `ChamadoMensagem`, `ChamadoAnexo` | Chamados de suporte (status, tipo, prioridade), conversa e anexos; `Chamado` não usa a trait `Auditavel` — o histórico já é mantido pela conversa em `ChamadoMensagem` |
| `Release` | Novidades da plataforma, publicadas pelo Admin e lidas pelo Private |
| `AcessoSuporte` | Concessão temporária, revogável e auditável de um Admin atuando no escopo de uma entidade concedente — ver [`autenticacao-e-autorizacao.md`](./autenticacao-e-autorizacao.md#acesso-de-suporte-impersonação-temporária-e-auditável) |
| `Auditoria` | Trilha de alterações (gravada de forma assíncrona); registros feitos em Acesso de Suporte carregam o `acesso_suporte_id` |
| `UsuarioSessao` | Sessões ativas, usadas pelo `JwtMiddleware` para revogação |
| `TokenResetSenha` | Tokens de redefinição de senha / primeiro acesso |
| `Municipio` | Base de municípios para lookup |

Todos usam UUID como chave primária (`HasUuids`).

## Auditoria

O trait `Auditavel` (`app/Auditoria/Auditavel.php`), aplicado a models como `Usuario`, registra alterações automaticamente, gravadas de forma assíncrona via `GravarAuditoriaJob` — veja [`filas-e-eventos.md`](./filas-e-eventos.md).
