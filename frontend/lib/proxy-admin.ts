import axios, { AxiosError, Method } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import {
  obterAcessoSuporteAtivo,
  limparAcessoSuporteAtivo,
} from "@/lib/acesso-suporte/acesso-suporte-storage";

interface ProxyPayload {
  url: string;
  method?: Method;
  data?: unknown;
  headers?: Record<string, string>;
}

interface ProxyResponse<T> {
  status: number;
  data: T;
}

/**
 * Único ponto por onde toda chamada do Admin ao backend passa — por isso é
 * também o único ponto que precisa saber sobre Acesso de Suporte:
 *
 *  - Se houver um acesso ativo (sessionStorage, ver acesso-suporte-storage),
 *    o header X-Acesso-Suporte-Id é adicionado automaticamente. Sem acesso
 *    ativo, o header nunca é enviado.
 *  - Se uma resposta 403 chegar enquanto o header estava sendo enviado, o
 *    acesso é considerado inválido (expirado/revogado/encerrado) e o modo
 *    de suporte é encerrado no frontend imediatamente — sem esperar o
 *    Admin perceber sozinho.
 *
 * Nenhum outro arquivo do app precisa (nem deve) adicionar esse header
 * manualmente.
 */
export async function proxyAdminRequest<T>({
  url,
  method = "GET",
  data,
  headers,
}: ProxyPayload): Promise<ProxyResponse<T>> {
  const acessoSuporte = obterAcessoSuporteAtivo();

  try {
    const response = await axios.post<ProxyResponse<T>>(
      "/api/proxy/admin",
      {
        url,
        method,
        data,
        headers: {
          ...(acessoSuporte ? { "X-Acesso-Suporte-Id": acessoSuporte.id } : {}),
          ...(headers || {}),
        },
      }
    );

    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorResponse>;

    if (error.response?.status === 401) {
      window.location.href = "/admin";
      return Promise.reject(error);
    }

    if (error.response?.status === 403 && acessoSuporte) {
      limparAcessoSuporteAtivo();
    }

    throw error;
  }
}
