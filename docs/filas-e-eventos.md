# Filas, jobs e eventos

## Jobs

- `GravarAuditoriaJob` — grava registros de auditoria de forma assíncrona (o payload já vem resolvido no momento do evento, pois o job pode rodar em um worker sem contexto de request/autenticação);
- `PopularDestinatariosMensagemJob` — popula os destinatários de uma mensagem em segundo plano.

Em produção, `QUEUE_CONNECTION=database`. Para processar a fila:

```bash
./vendor/bin/sail artisan queue:work
```

Em desenvolvimento local, o script `composer dev` já sobe `queue:listen` junto com o servidor, logs (`pail`) e o watcher do Vite do backend (ver `backend/composer.json`).

## Comando agendado

`usuario-sessao:limpar-expiradas` — encerra sessões inativas há mais de 30 minutos, agendado a cada 10 minutos (`backend/routes/console.php`).

## Events / Listeners

Eventos de domínio disparam efeitos colaterais sem acoplar os services diretamente a eles:

| Evento | Listener(s) |
|---|---|
| `UsuarioCriado` | `EnviarEmailUsuarioCriado` |
| `UsuarioEsqueceuSenha` | `EnviarEmailUsuarioEsqueceuSenha` |
| `SenhaUsuarioAlterada` | `EnviarEmailSenhaUsuarioAlterada` |
| `UsuarioStatusAlterado` | `InvalidarSessoesDoUsuario` |
| `GrupoExcluido` | `InvalidarSessoesDosUsuariosDoGrupo` |
| `GrupoEmpresaExcluido` | `InvalidarSessoesDosUsuariosDoGrupoEmpresa` |
| `EmpresaDadosObrigatoriosAtualizados` | `ValidarAtivacaoAutomaticaEmpresa` |

## Comandos Artisan customizados

| Comando | Descrição |
|---|---|
| `usuario-sessao:limpar-expiradas` | Encerra sessões inativas (agendado) |
| `swagger:admin-hash {senha?}` | Gera `SWAGGER_ADMIN_USERNAME`/`SWAGGER_ADMIN_PASSWORD_HASH` |
