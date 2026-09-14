import { UseFormSetError } from "react-hook-form";

import { BannerFormData } from "../schemas/banner.schema";

/**
 * O backend valida `direcionamento.tipo`/`direcionamento.entidade_tipo`
 * (ver CadastrarRequest/AtualizarRequest), mas o formulário usa os campos
 * "planos" `direcionamento_tipo`/`entidade_tipo` (ver banner.schema.ts) —
 * este mapa liga um nome ao outro.
 */
const MAPA_CAMPOS_ANINHADOS: Record<string, keyof BannerFormData> = {
  "direcionamento.tipo": "direcionamento_tipo",
  "direcionamento.entidade_tipo": "entidade_tipo",
};

const CAMPOS_DO_FORMULARIO: (keyof BannerFormData)[] = [
  "titulo",
  "conteudo",
  "inicio_em",
  "fim_em",
  "direcionamento_tipo",
  "entidade_tipo",
];

/**
 * Traduz os erros de validação retornados pela API (chaves como "titulo",
 * "direcionamento.tipo" ou "links.0.url" — ver Admin\Banner\CadastrarRequest
 * / AtualizarRequest no backend) para o formulário de banner do Admin.
 *
 * - Chaves que correspondem a um campo do react-hook-form (direto ou via
 *   MAPA_CAMPOS_ANINHADOS) são aplicadas com `setError`, exibindo a
 *   mensagem embaixo do campo certo.
 * - Chaves sem um <input> individual registrado no formulário — como
 *   "links.0.url" ou "imagens.0.conteudo", que pertencem a itens de uma
 *   lista (botões/imagens) e não a um campo fixo — NÃO são descartadas:
 *   são devolvidas para quem chamou exibir em um alerta genérico. Antes,
 *   `setError` era chamado com esses nomes mesmo sem nenhum componente
 *   escutando esse `errors["links.0.url"]`, então o erro existia mas
 *   nunca aparecia em lugar nenhum (ver item 2 do pedido — nenhum erro
 *   retornado pela API pode ser escondido/engolido).
 */
export function mapBannerApiErrors(
  apiErrors: Record<string, string[] | undefined>,
  setError: UseFormSetError<BannerFormData>
): string[] {
  const mensagensNaoMapeadas: string[] = [];

  Object.entries(apiErrors).forEach(([campo, mensagens]) => {
    if (!Array.isArray(mensagens) || mensagens.length === 0) return;

    const campoDoFormulario =
      MAPA_CAMPOS_ANINHADOS[campo] ??
      (CAMPOS_DO_FORMULARIO.includes(campo as keyof BannerFormData)
        ? (campo as keyof BannerFormData)
        : undefined);

    if (campoDoFormulario) {
      setError(campoDoFormulario, { type: "server", message: mensagens[0] });
      return;
    }

    mensagensNaoMapeadas.push(mensagens[0]);
  });

  return mensagensNaoMapeadas;
}
