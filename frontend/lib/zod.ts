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
 *
 * FRONT-005: mensagens em português para TODO o frontend. Sem isso, um campo ausente (ou com
 * valor de tipo errado) mostrava ao usuário textos como "Invalid input: expected string,
 * received undefined". A mensagem escrita no próprio schema (`.min(3, "…")`) continua tendo
 * prioridade; esta configuração só vale quando o schema não define a sua.
 */
type Problema = z.core.$ZodRawIssue;

/** Mensagem amigável para os casos comuns; `undefined` deixa o zod usar a tradução padrão. */
export function mensagemPadrao(problema: Problema): string | undefined {
  const p = problema as Problema & {
    origin?: string;
    input?: unknown;
    minimum?: number | bigint;
    maximum?: number | bigint;
    inclusive?: boolean;
    format?: string;
  };

  switch (p.code) {
    case "invalid_type":
      // Campo que nem chegou (`undefined`) ou veio nulo: é "obrigatório", não "tipo inválido".
      return p.input === undefined || p.input === null ? "Campo obrigatório." : "Valor inválido.";

    case "invalid_value":
      return "Selecione uma opção válida.";

    case "invalid_format":
      return p.format === "email" ? "Informe um e-mail válido." : "Formato inválido.";

    case "too_small":
      if (p.inclusive === false) return undefined;

      if (p.origin === "string") {
        return Number(p.minimum) <= 1
          ? "Campo obrigatório."
          : `Informe no mínimo ${p.minimum} caracteres.`;
      }

      if (p.origin === "array" || p.origin === "set") {
        return Number(p.minimum) <= 1
          ? "Selecione ao menos uma opção."
          : `Selecione ao menos ${p.minimum} opções.`;
      }

      if (p.origin === "number" || p.origin === "int") return `O valor mínimo é ${p.minimum}.`;

      return undefined;

    case "too_big":
      if (p.inclusive === false) return undefined;

      if (p.origin === "string") return `Informe no máximo ${p.maximum} caracteres.`;

      if (p.origin === "array" || p.origin === "set") {
        return `Selecione no máximo ${p.maximum} opções.`;
      }

      if (p.origin === "number" || p.origin === "int") return `O valor máximo é ${p.maximum}.`;

      return undefined;

    default:
      return undefined;
  }
}

z.config({
  jitless: true,
  // Tradução oficial do zod para o que `mensagemPadrao` não cobre.
  localeError: z.locales.ptBR().localeError,
  customError: mensagemPadrao,
});

export { z };
