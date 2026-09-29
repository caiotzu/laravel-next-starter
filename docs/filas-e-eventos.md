# Filas, jobs e eventos

## Jobs

Ambos os jobs implementam `ShouldQueue` com `tries = 3` (até 3 tentativas). O listener `ValidarAtivacaoAutomaticaEmpresa` também é enfileirado (`ShouldQueue`).

- `GravarAuditoriaJob` — grava registros de auditoria de forma assíncrona (o payload já vem resolvido no momento do evento, pois o job pode rodar em um worker sem contexto de request/autenticação);
- `PopularDestinatariosMensagemJob` — popula os destinatários de uma mensagem em segundo plano.

Em produção, `QUEUE_CONNECTION=database`. Para processar a fila:

```bash
./vendor/bin/sail artisan queue:work
```

Em desenvolvimento local, o script `composer dev` já sobe `queue:listen` junto com o servidor, logs (`pail`) e o watcher do Vite do backend (ver `backend/composer.json`).

## Comandos agendados

Definidos em `backend/routes/console.php` e executados por `php artisan schedule:work` (ou pelo cron `schedule:run`):

| Comando | Frequência | O que faz |
|---|---|---|
| `usuario-sessao:limpar-expiradas` | a cada 10 minutos | Encerra sessões inativas há mais de 30 minutos |
| `acesso-suporte:expirar-vencidos` | a cada minuto | Marca como expirados os Acessos de Suporte vencidos e gera auditoria da mudança de status (duração mínima de um acesso é 5 minutos) |

## Events / Listeners

Eventos de domínio disparam efeitos colaterais sem acoplar os services diretamente a eles:

| Evento | Listener(s) |
|---|---|
| `UsuarioCriado` | `EnviarEmailUsuarioCriado` |
| `UsuarioEsqueceuSenha` | `EnviarEmailUsuarioEsqueceuSenha` |
| `SenhaUsuarioAlterada` | `EnviarEmailSenhaUsuarioAlterada` |
| `UsuarioStatusAlterado` | `InvalidarSessoesDoUsuario` |
| `UsuarioExcluido` | `InvalidarSessoesDoUsuario` (o mesmo listener atende `UsuarioStatusAlterado` e `UsuarioExcluido`) |
| `GrupoExcluido` | `InvalidarSessoesDosUsuariosDoGrupo` |
| `GrupoEmpresaExcluido` | `InvalidarSessoesDosUsuariosDoGrupoEmpresa` |
| `EmpresaDadosObrigatoriosAtualizados` | `ValidarAtivacaoAutomaticaEmpresa` |

## Comandos Artisan customizados

| Comando | Descrição |
|---|---|
| `usuario-sessao:limpar-expiradas` | Encerra sessões inativas (agendado, a cada 10 min) |
| `acesso-suporte:expirar-vencidos` | Expira Acessos de Suporte vencidos (agendado, a cada minuto) |
| `chamados:mover-anexos-privados [--dry-run]` | Migração única e idempotente dos anexos de chamado do disco público para o privado (copia, confere o tamanho e só então apaga o original) |
| `swagger:admin-hash {senha?}` | Gera `SWAGGER_ADMIN_USERNAME`/`SWAGGER_ADMIN_PASSWORD_HASH` |
