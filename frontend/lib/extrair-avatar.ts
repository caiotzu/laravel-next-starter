/**
 * Extrai a URL do avatar da resposta de "atualizar avatar".
 *
 * O backend devolve o usuário via `UsuarioResource`, que embrulha o objeto em `data`
 * (`{ data: { avatar } }`) — e o proxy do BFF repassa assim. Aceita também o formato plano
 * (`{ avatar }`). Qualquer outra coisa vira `null`, para o chamador decidir o que fazer
 * (ex.: buscar o usuário de novo) em vez de falhar em silêncio.
 */
export function extrairAvatar(resposta: unknown): string | null {
  if (resposta === null || typeof resposta !== "object") return null;

  const bruto = resposta as { avatar?: unknown; data?: unknown };

  const candidato =
    bruto.data !== null && typeof bruto.data === "object"
      ? (bruto.data as { avatar?: unknown }).avatar
      : bruto.avatar;

  return typeof candidato === "string" && candidato !== "" ? candidato : null;
}
