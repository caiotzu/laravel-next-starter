import { z } from "zod";

/**
 * Mesma regra já aplicada pelo backend em CadastrarRequest/AtualizarRequest
 * (`links.*.nome` e `links.*.url`, ambos `required`) — replicada aqui só
 * para dar feedback imediato no formulário. O backend continua sendo a
 * fonte de verdade: esta validação nunca substitui a dele, apenas evita
 * uma viagem ao servidor para um erro que já pode ser detectado no
 * cliente (ver item 2 do pedido).
 */
export const bannerLinkSchema = z.object({
  nome: z.string().trim().min(1, "O nome do botão é obrigatório"),
  url: z
    .string()
    .trim()
    .min(1, "O link do botão é obrigatório")
    .refine(
      (valor) => {
        try {
          const url = new URL(valor);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message: "Informe uma URL válida (ex: https://exemplo.com)" }
    ),
});

export type BannerLinkErrors = Record<number, { nome?: string; url?: string }>;

/**
 * Valida a lista de botões de um banner e retorna os erros indexados pela
 * posição do botão na lista — mesmo formato já aceito pelo prop `errors`
 * de BannerLinksField. Retorna um objeto vazio quando todos os botões
 * estão completos (nenhum índice presente = nenhum erro).
 */
export function validarBannerLinks(
  links: { nome: string; url: string }[]
): BannerLinkErrors {
  const erros: BannerLinkErrors = {};

  links.forEach((link, index) => {
    const resultado = bannerLinkSchema.safeParse(link);

    if (resultado.success) return;

    const errosDoBotao: { nome?: string; url?: string } = {};

    resultado.error.issues.forEach((issue) => {
      const campo = issue.path[0];

      // Quando um campo falha em mais de uma regra (ex: URL vazia falha
      // no "obrigatório" e também no formato), mantém só a primeira
      // mensagem — a mais específica (obrigatoriedade antes de formato).
      if ((campo === "nome" || campo === "url") && !errosDoBotao[campo]) {
        errosDoBotao[campo] = issue.message;
      }
    });

    erros[index] = errosDoBotao;
  });

  return erros;
}
