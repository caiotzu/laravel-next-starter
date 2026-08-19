import axios, { AxiosError, Method } from "axios";

import { ApiErrorResponse } from "@/types/errors";

import {
  limparAcessoSuporteAtivo,
  obterAcessoSuporteAtivo,
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
 * Causa raiz do loop na tela de login: antes, todo 401/403 disparava um
 * `window.location.href` incondicional — inclusive para a própria página
 * em que já estávamos, e uma vez por cada requisição em paralelo que
 * falhasse. Isso recarrega a página inteira, remonta a árvore de
 * providers, a mesma chamada não autenticada dispara de novo, cai em 401
 * de novo, recarrega de novo — loop infinito. Some com sessão de suporte
 * "presa" (expiraEm nunca setado corretamente) só piorava, já que toda
 * requisição Private seguia mandando um X-Acesso-Suporte-Id inválido.
 *
 * A flag abaixo garante um único redirect por navegação, e nunca navega
 * para a rota em que o usuário já está.
 */
let redirecionandoAposFalhaAuth = false;

function redirecionarUmaVez(destino: string): void {
  if (redirecionandoAposFalhaAuth) {
    return;
  }

  if (window.location.pathname === destino) {
    return;
  }

  redirecionandoAposFalhaAuth = true;
  window.location.href = destino;
}

export async function proxyPrivateRequest<T>({
  url,
  method = "GET",
  data,
  headers,
}: ProxyPayload): Promise<ProxyResponse<T>> {
  const acessoSuporte = obterAcessoSuporteAtivo();

  try {
    const response = await axios.post<ProxyResponse<T>>(
      "/api/proxy/private",
      {
        url,
        method,
        data,
        headers: {
          ...(acessoSuporte
            ? { "X-Acesso-Suporte-Id": acessoSuporte.id }
            : {}),
          ...(headers || {}),
        },
      }
    );

    return response.data;
  } catch (err) {
    const error = err as AxiosError<ApiErrorResponse>;

    if (error.response?.status === 401) {
      redirecionarUmaVez(acessoSuporte ? "/admin/acessos-suporte" : "/");
      return Promise.reject(error);
    }

    if (error.response?.status === 403 && acessoSuporte) {
      limparAcessoSuporteAtivo();

      // O acesso de suporte não é mais válido (expirado/revogado/
      // encerrado) — independentemente da entidade em que o Admin estava,
      // o retorno é sempre para o Dashboard do Admin (rota oficial, ver
      // middleware.ts: redirectPath para admin_access_token).
      redirecionarUmaVez("/admin/dashboard");
      return Promise.reject(error);
    }

    throw error;
  }
}
