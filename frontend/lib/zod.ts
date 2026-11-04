import { z } from "zod";

/**
 * Único ponto de importação do zod (SEC-008 / F-09).
 *
 * `jitless` desliga a otimização do zod que gera código com `new Function`. Sob uma CSP estrita
 * (sem 'unsafe-eval') essa sondagem é BLOQUEADA e o navegador reporta uma violação de CSP a cada
 * carga de página, mesmo com o erro tratado pelo zod. A diferença de desempenho na validação de
 * formulários é irrelevante, e a CSP pode continuar sem 'unsafe-eval' em produção.
 *
 * A configuração precisa valer ANTES de qualquer schema ser criado, por isso todos os módulos
 * importam o `z` daqui e não direto de "zod" (regra do ESLint em eslint.config.mjs).
 */
z.config({ jitless: true });

export { z };
