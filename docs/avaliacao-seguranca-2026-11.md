# Reavaliação de segurança — 2026-11-02 (SEC-008)

Resumo público da reavaliação **white-box** (revisão do código atual, sem atacar um ambiente implantado). Substitui, como referência de situação, o relatório de 2026-09-29, removido do repositório por estar desatualizado (texto original: `git show 8180a63:docs/pentest-avaliacao-seguranca.md`). Não contém detalhes exploráveis.

**Isto não é um pentest independente.** Comunique a segurança como "controles implementados, testados automaticamente e avaliados por revisão white-box", nunca como "aprovado em pentest".

## Método e limites

- Revisão estática do código PHP (rotas, controllers, requests, resources, repositórios, tratamento de exceções, limitadores de taxa) e do frontend (BFF, proxy, sessões, cabeçalhos, sanitização).
- Verificação **dinâmica** do que o ambiente permitiu: Vitest com Redis 7 real, E2E em Chromium real contra o build de produção (`next start`), `npm audit` e execução de PHP real para a lógica pura (máscara de e-mail, escape de curingas, teto de base64).
- **Limite importante:** o ambiente da revisão **não tinha PHP com dependências instaladas, PostgreSQL nem Packagist**. As correções do backend passaram por `php -l` e por testes da lógica pura, e os testes Pest novos (`backend/tests/Feature/AvaliacaoSeguranca2026Test.php`) **foram escritos, mas não executados**. Rode `composer test` antes de publicar.

## Situação dos 16 achados da avaliação de 2026-09-29

| Id | Gravidade | Achado | Situação em 2026-11-02 |
|---|---|---|---|
| F-01 | crítica | Next.js com vulnerabilidades críticas | corrigido (e **novamente** em 2026-11-02: novas CVEs críticas no 16.3.8, atualizado para 16.4.4) |
| F-02 | alta | axios com avisos | corrigido |
| F-03 | média | dependências PHP com avisos | corrigido (verificado a cada push por `composer audit` no CI) |
| F-04 | média | outras dependências do frontend | corrigido; ver "Dependências" abaixo |
| F-05 | baixa | `/lookup/administradores` expunha nome e e-mail de administradores a qualquer usuário autenticado | **corrigido**: exige permissão para quem não é Admin (403 sem ela), e-mail mascarado e curingas tratados como texto; a lista aparece sem digitar nada (o cliente não sabe quem são os administradores), limitada a 20 por nome |
| F-06 | baixa | `middleware.ts` não verificava a assinatura do JWT | **resolvido pela SEC-009**: o `proxy.ts` não lê mais JWT; confere uma sessão opaca no Redis |
| F-07 | baixa | JWT devolvido também no corpo de login/2FA | corrigido (SEC-007) e o JWT nem existe mais no navegador (SEC-009) |
| F-08 | baixa | exceções devolviam a mensagem original em produção | **corrigido**: em produção `RuntimeException`/`InvalidArgumentException` devolvem mensagem genérica |
| F-09 | baixa | CSP parcial (sem `script-src`) | **corrigido**: CSP com nonce por requisição, imposta e testada em navegador real |
| F-10 | info | DOMPurify com configuração padrão | **corrigido**: allowlist fechada, a mesma do backend |
| F-11 | info | `.env.example` com padrões de desenvolvimento | **mitigado por documentação**: [`checklist-producao.md`](./checklist-producao.md) e aviso no `.env.example` |
| F-12 | info | tamanho de upload conferido só depois de decodificar o base64 | **corrigido**: teto do texto base64 nas regras do campo; limite do servidor web no checklist |
| F-13 | info | (a) `..;` aceito no proxy; (b) `TRUSTED_PROXY_HOPS` | **(a) corrigido** (`;` recusado); **(b) documentado** no checklist e no README |
| F-14 | info | ausência de CI/CD e de verificação de segurança | corrigido (CI com testes, `composer audit` e `npm audit`) |
| F-15 | info | build de produção não funcionava | corrigido |
| F-16 | — | falha de anti-enumeração no login | corrigido e coberto por teste |

## Achados novos desta reavaliação

| Id | Gravidade | Achado | Situação |
|---|---|---|---|
| N-01 | média | O proxy genérico (`/api/proxy/*`) repassava `POST /refresh` do Laravel e devolvia **um JWT novo no corpo** ao navegador, contornando a SEC-009 | corrigido (2026-10-28): `login`, `2fa/verificar`, `refresh` e `logout` não passam pelo proxy |
| N-02 | média | `/storage/*` (arquivos enviados por usuários) saía **sem nenhum cabeçalho de segurança**: o `headers()` do Next não vale para rewrites para outro servidor | corrigido: Route Handler próprio (`app/storage/[...caminho]/route.ts`) com `nosniff`, CSP `sandbox`, `X-Frame-Options`, `CORP`; só imagens são exibidas inline (o resto vira download) |
| N-03 | baixa | Uma correção intermediária (rewrite no `proxy.ts`) vazaria o endereço interno do backend no cabeçalho `x-middleware-rewrite` | evitado: descartada em favor do Route Handler; E2E confere que nenhum cabeçalho traz o endereço do backend |
| N-04 | alta | **Dependências de produção com CVEs novas** (publicadas depois de 2026-10-17): Next.js 16.3.8 (RCE no otimizador de imagens e em `use cache`, DoS em Server Actions), DOMPurify, zod, follow-redirects, qs, fast-uri | corrigido em 2026-11-02: Next.js 16.4.4 e `npm audit fix`; `npm audit --omit=dev`: 0 críticas, 0 altas |
| N-05 | baixa | Limite de 2FA por IP prejudicava escritórios (NAT): as falhas de um colega bloqueavam os outros e o sucesso de um zerava o contador de todos | **corrigido** (SEC-012): limite por usuário (9 falhas) + teto generoso por IP (60), sem zerar por sucesso alheio |
| N-07 | **média** | Login e 2FA dividiam o limitador `api-publica` (**10 req/min por IP**): num escritório, onde todos saem pelo mesmo IP público, a 6ª pessoa a entrar com 2FA no mesmo minuto levava 429 (detectado ao rodar os testes do SEC-012 no ambiente do dono) | **corrigido** (2026-11-04): limitador próprio `autenticacao` (120/min, só inundação), contador de falhas de login por IP (60 em 5 min) para manter a proteção contra *password spraying*, limite por e-mail no `esqueceu-senha`, `api-publica` 30/min, e 429 em português com `Retry-After` |
| N-06 | info | O zod gerava uma violação de CSP a cada página (sondagem `new Function`) | corrigido: `z.config({ jitless: true })` em `lib/zod.ts`, com regra de lint para todo import passar por ali |

## Riscos residuais conhecidos

- `style-src` da CSP mantém `'unsafe-inline'` (React, Radix, Recharts, Sonner e Tiptap usam estilos inline). Risco bem menor que o de scripts; remover exige nonce em estilos (SEC-014).
- 2 avisos **moderados** no `npm audit` (`postcss-selector-parser`, via `@tailwindcss/typography`): afetam o processamento de CSS **no build**, não o servidor em execução; a correção publicada é um downgrade de versão major.
- Os **testes Pest novos do backend não foram executados** nesta revisão (ver "Método e limites").
- O Redis de produção (senha, TLS, rede privada, persistência) é decisão de infraestrutura pendente (SEC-010).
- Nada disto substitui um pentest independente em homologação.

## Como reverificar

```bash
# frontend (precisa de Redis: REDIS_URL, ou redis-server local)
cd frontend && npm run lint && npx tsc --noEmit && npm test && npm audit --omit=dev --audit-level=high
npm run build && npm run e2e          # 63 testes, inclui e2e/csp.e2e.ts

# backend
cd backend && composer test && composer audit
```
