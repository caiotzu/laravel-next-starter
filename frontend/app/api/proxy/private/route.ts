import { NextResponse } from "next/server";

import axios, { Method } from "axios";

import { ipsEncaminhados } from "@/lib/client-ip";
import {
  filtrarHeadersCliente,
  metodoPermitido,
  resolverUrlBackend,
} from "@/lib/proxy-guard";
import {
  SessaoIndisponivelError,
  encerrarSessao,
  obterTokenDaSessao,
  respostaSessaoExpirada,
  respostaSessaoIndisponivel,
} from "@/lib/session/sessao";
import { validarOrigem } from "@/lib/utils";

interface ProxyRequestBody<T = unknown> {
  url: string;
  method?: Method;
  data?: T;
  headers?: Record<string, string>;
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const erroOrigem = validarOrigem(req);
    if (erroOrigem) return erroOrigem;
    
    const body: ProxyRequestBody = await req.json();

    if (!body.url) {
      return NextResponse.json(
        {
          errors: {
            business: ["URL é obrigatória."],
          },
        },
        { status: 400 }
      );
    }

    const {
      url,
      method: metodoInformado = "GET",
      data,
    } = body;

    // O destino, o método e os headers vêm do navegador: nada disso é confiável.
    const urlBackend = resolverUrlBackend(url);

    if (!urlBackend) {
      return NextResponse.json(
        { errors: { business: ["URL inválida."] } },
        { status: 400 }
      );
    }

    const method = metodoPermitido(metodoInformado);

    if (!method) {
      return NextResponse.json(
        { errors: { business: ["Método não permitido."] } },
        { status: 405 }
      );
    }

    // Só headers da allowlist (hoje apenas X-Acesso-Suporte-Id, com formato validado).
    const clientHeaders = filtrarHeadersCliente(body.headers);

    // Com X-Acesso-Suporte-Id o Admin atua no escopo de uma entidade Private usando a PRÓPRIA
    // sessão Admin; sem o header vale a sessão Private. O JWT mora no servidor (Redis) e, sem
    // sessão válida, a requisição é recusada AQUI, sem chamar o backend.
    const acessoSuporteId =
      clientHeaders?.["X-Acesso-Suporte-Id"];

    const contextoDaSessao = acessoSuporteId ? "admin" : "private";
    const token = await obterTokenDaSessao(contextoDaSessao);

    if (!token) return respostaSessaoExpirada();

    // Headers originais do cliente
    const userAgent =
      req.headers.get("user-agent") || "";

    // IP do usuário final, validado (ver lib/client-ip.ts). Nunca repassa a cadeia do cliente.
    const { forwardedFor, realIp } = ipsEncaminhados(req);

    const backendResponse = await axios.request({
      url: urlBackend,
      method,

      headers: {
        // Headers permitidos do cliente entram PRIMEIRO: os fixos abaixo (Authorization, IP,
        // User-Agent) sempre prevalecem e o cliente nunca consegue sobrescrevê-los.
        ...clientHeaders,

        "Content-Type": "application/json",

        "User-Agent": userAgent,
        "X-Forwarded-For": forwardedFor,
        "X-Real-IP": realIp,

        Authorization: `Bearer ${token}`,
      },

      data: ["GET", "HEAD"].includes(
        method.toUpperCase()
      )
        ? undefined
        : data,

      validateStatus: () => true,
    });

    // Token expirado ou revogado no backend: a sessão não serve mais
    if (backendResponse.status === 401) {
      await encerrarSessao(contextoDaSessao);

      return NextResponse.json(
        {
          ...backendResponse.data,
          tokenExpired: true,
        },
        { status: 401 }
      );
    }

    // Repassa erros exatamente como vieram
    if (backendResponse.status >= 400) {
      return NextResponse.json(
        backendResponse.data,
        {
          status: backendResponse.status,
        }
      );
    }

    // Repassa resposta original do backend
    return NextResponse.json({
      status: backendResponse.status,
      data: backendResponse.data,
    });

  } catch (erro) {
    if (erro instanceof SessaoIndisponivelError) return respostaSessaoIndisponivel();

    return NextResponse.json(
      {
        errors: {
          business: [
            "Ocorreu um erro inesperado.",
          ],
        },
      },
      { status: 500 }
    );
  }
}