import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import axios, { AxiosError } from 'axios';

type ApiErrorResponse = {
  error: boolean
  messages: string[]
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("private_access_token")?.value;

    await axios.post(`${process.env.BACKEND_URL}/logout`,
      {},
      {
        headers: { 
            'Content-Type': 'application/json' ,
            'Authorization': `Bearer ${token}`
        },
        timeout: 10000,
      }
    );

    cookieStore.set('private_access_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 0 // força o navegador a apagar imediatamente
    });

    return NextResponse.json({ 
      error: false,
      messages: ['Sessão encerrada com sucesso']
    });
  } catch (err: unknown) { 
    const error = err as AxiosError<ApiErrorResponse>

    return NextResponse.json(
      { 
        error: true,
        messages: error.response?.data?.messages || ['Não foi possível encerrar a sessão do usuário']
      }, 
      { 
        status: error.response?.status || 500 
      }
    );
  }
}
