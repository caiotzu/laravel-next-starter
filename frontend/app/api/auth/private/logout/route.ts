import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios from "axios";

import { ipsEncaminhados } from "@/lib/client-ip";
import { validarOrigem } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const erroOrigem = validarOrigem(req);
    if (erroOrigem) return erroOrigem;

    const cookieStore = await cookies();
    const token = cookieStore.get("private_access_token")?.value;

    // Pega o user-agent original do navegador
    const userAgent = req.headers.get("user-agent") || "";
    const { forwardedFor, realIp } = ipsEncaminhados(req); // IP validado (lib/client-ip.ts)

    const response = await axios.post(
      `${process.env.BACKEND_URL}/logout`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "X-Forwarded-For": forwardedFor,
          "X-Real-IP": realIp,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 10000,
        validateStatus: () => true, // nunca lança erro por status
      }
    );

    const data = response.data.data;

    if (response.status >= 400) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    // Sucesso → apaga cookie
    cookieStore.set("private_access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // cookie lido só pelo próprio BFF (mesmo origin): "none" não é necessário e desliga a proteção SameSite
      path: "/",
      maxAge: 0,
    });

    return NextResponse.json({
      status: response.status,
      data: data,
    });

  } catch {
    return NextResponse.json(
      {
        errors: {
          business: ["Erro inesperado ao encerrar a sessão."],
        },
      },
      { status: 500 }
    );
  }
}
