# Testes

## Backend (Pest)

O backend usa [Pest](https://pestphp.com/) 4 (`pestphp/pest` + `pestphp/pest-plugin-laravel`), configurado em `backend/phpunit.xml` com as suites `Unit` e `Feature` (`backend/tests/Unit`, `backend/tests/Feature`). Em ambiente de teste, o `phpunit.xml` força `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`, `MAIL_MAILER=array`, `BCRYPT_ROUNDS=4` e `DB_DATABASE=testing` (o banco `testing` é criado pelo script de inicialização do PostgreSQL no `docker-compose.yml` do Sail).

```bash
./vendor/bin/sail artisan test
# ou
composer test
```

### O que está coberto

Os testes de *feature* exercitam a API de ponta a ponta (rota → middleware → controller → service → banco), com foco nos pontos de maior risco: autenticação, isolamento entre contextos e regras de segurança.

| Arquivo | Casos declarados | Foco |
|---|---:|---|
| `AuthFluxoTest.php` | 18 (× 2 audiências = 36 execuções) | Login com/sem 2FA, primeiro acesso, esqueceu/redefinir senha, refresh, logout, `/me` — rodado para **Admin** e **Private** |
| `SegurancaTest.php` | 12 | Isolamento Admin × Private sem `authorize()`, resposta idêntica para e-mail inexistente, expiração do `temp_token` do 2FA, anti-replay de TOTP, troca de e-mail exige senha, encerramento de sessões ao trocar senha, sanitização de conteúdo de release, anexo por link assinado fora do disco público |
| `EscopoEntidadeTest.php` | 17 | Isolamento multi-tenant: Private A não lê/altera dados de B; Admin irrestrito × Admin em modo de suporte |
| `AcessoSuporteTest.php` | 16 | Concessão, expiração, revogação, encerramento, uso por outro admin, auditoria com `acesso_suporte_id`, comando agendado de expiração |
| `UsuarioTest.php` | 12 | Regras de cadastro/atualização/status de usuários |
| `ChamadoTest.php` | 16 | Abertura, resposta, anexos, status/prioridade/responsável |
| `BannerTest.php` | 29 | CRUD, período, direcionamento, imagens e links, restauração |
| `ReleaseTest.php` | 8 | Rascunho/publicação e visibilidade por contexto |
| `DashboardTest.php` | 5 | KPIs do dashboard Admin |
| `ExampleTest.php` (Feature e Unit) | 1 + 1 | Testes de exemplo do skeleton Laravel |

**Total (contagem estática dos arquivos):** 133 casos declarados nos domínios do sistema, que resultam em 151 execuções (o fluxo de autenticação roda uma vez por audiência), mais 2 exemplos do skeleton. São ~3.900 linhas de teste.

> **Nota de transparência:** os números acima vêm da leitura dos arquivos em `backend/tests`. A análise que gerou esta documentação não executou a suíte (o ambiente de análise não tinha PHP/Docker), portanto **o resultado de aprovação da suíte não foi verificado aqui**. Rode `composer test` para confirmar.

## Frontend

Não foi identificado no projeto nenhum framework ou script de testes automatizados no frontend (`frontend/package.json` só define `dev`, `build`, `start` e `lint`). A qualidade do frontend é verificada por TypeScript e ESLint.

## CI/CD e verificação de dependências

Não foi identificado pipeline de CI/CD (não existe `.github/workflows` nem equivalente) nem passo automatizado de `composer audit` / `npm audit`. A execução dos testes e a auditoria de dependências dependem, hoje, de execução manual.
