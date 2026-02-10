import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import axios from "axios";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("private_access_token")?.value;

    const response = await axios.post(
      `${process.env.BACKEND_URL}/logout`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        timeout: 10000,
        validateStatus: () => true, // nunca lança erro por status
      }
    );

    const data = response.data;

    if (response.status >= 400) {
      return NextResponse.json(data, {
        status: response.status,
      });
    }

    // Sucesso → apaga cookie
    cookieStore.set("private_access_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
      maxAge: 0,
    });


    return NextResponse.json({
      status: response.status,
      data: data
    });
  } catch (error: unknown) {
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

