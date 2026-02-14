import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios from "axios";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Pega o user-agent original do navegador
    const userAgent = req.headers.get("user-agent") || "";
    const forwardedFor = req.headers.get("x-forwarded-for") || "";
    const realIp = req.headers.get("x-real-ip") || "";

    const response = await axios.post(
      `${process.env.BACKEND_URL}/admin/login`,
      body,
      {
        headers: { 
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "X-Forwarded-For": forwardedFor,
          "X-Real-IP": realIp,
        },
        timeout: 10000,
        validateStatus: () => true, // nunca lança erro por status
      }
    );

    const data = response.data;

    // Se for erro (400+), repassa o erro exatamente como veio
    if (response.status >= 400) {
      return NextResponse.json(
        data,
        { status: response.status }
      );
    }

    const cookieStore = await cookies();

    cookieStore.set("admin_access_token", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 60 * 60,
    });

    return NextResponse.json({
      status: response.status,
      data: data,
    });

  } catch (error: unknown) {
    return NextResponse.json(
      {
        errors: {
          business: ["Erro inesperado ao realizar login."],
        },
      },
      { status: 500 }
    );
  }
}
