import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios from "axios";

import { validarOrigem } from "@/lib/utils";

import { ipsEncaminhados } from "@/lib/client-ip";

export async function POST(req: Request) {
  try {
    const erroOrigem = validarOrigem(req);
    if (erroOrigem) return erroOrigem;

    const body = await req.json();

    // Captura headers originais do navegador
    const userAgent = req.headers.get("user-agent") || "";
    const { forwardedFor, realIp } = ipsEncaminhados(req); // IP validado (lib/client-ip.ts)

    const response = await axios.post(
      `${process.env.BACKEND_URL}/admin/2fa/verificar`,
      body,
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "X-Forwarded-For": forwardedFor,
          "X-Real-IP": realIp,
        },
        timeout: 10000,
        validateStatus: () => true,
      }
    );

    const data = response.data.data;

    // Se for erro (400+), repassa o erro exatamente como veio
    if (response.status >= 400) {
      return NextResponse.json(response.data, {
        status: response.status,
      });
    }

    if (!data?.token) {
      return NextResponse.json(
        {
          errors: {
            business: ["Token não retornado após validação do 2FA."],
          },
        },
        { status: 500 }
      );
    }

    const cookieStore = await cookies();

    cookieStore.set("admin_access_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // cookie lido só pelo próprio BFF (mesmo origin): "none" não é necessário e desliga a proteção SameSite
      path: "/",
      maxAge: 60 * 60, // 1 hora
    });

    return NextResponse.json({
      status: response.status,
      data: data,
    });

  } catch {
    return NextResponse.json(
      {
        errors: {
          business: ["Erro inesperado ao validar 2FA."],
        },
      },
      { status: 500 }
    );
  }
}