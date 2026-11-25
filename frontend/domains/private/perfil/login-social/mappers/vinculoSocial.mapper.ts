import { VinculoSocial } from "../types/loginSocial.model";
import { VinculoSocialDataResponse } from "../types/loginSocial.response";

export function toVinculoSocial(data: VinculoSocialDataResponse): VinculoSocial {
  return {
    chave: data.chave,
    nome: data.nome,
    disponivel: data.disponivel,
    vinculado: data.vinculado,
    email: data.email,
    vinculadoEm: data.vinculado_em,
    ultimoLoginEm: data.ultimo_login_em,
  };
}
