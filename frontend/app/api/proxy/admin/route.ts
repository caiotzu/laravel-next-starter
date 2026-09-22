import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios, { Method } from "axios";


import { ipsEncaminhados } from "@/lib/client-ip";
import {
  filtrarHeadersCliente,
  metodoPermitido,
  resolverUrlBackend,
} from "@/lib/proxy-guard";
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

    const cookieStore = await cookies();

    const token =
      cookieStore.get("admin_access_token")?.value;

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

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),
      },

      data: ["GET", "HEAD"].includes(
        method.toUpperCase()
      )
        ? undefined
        : data,

      validateStatus: () => true,
    });

    // Token expirado
    if (backendResponse.status === 401) {
      cookieStore.set(
        "admin_access_token",
        "",
        {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
        //   sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          sameSite: "lax", // Só utilizar none em produção se front e back estiverem em domínios diferentes
          path: "/",
          maxAge: 0,
        }
      );

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

  } catch {
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