import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import axios, { AxiosError } from 'axios';

type ApiErrorResponse = {
  error: boolean
  messages: string[]
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const res = await axios.post(
      `${process.env.BACKEND_URL}/login`,
      body,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    const data = res.data;
    const cookieStore = await cookies();
    cookieStore.set('private_access_token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 60 * 60
    });

    return NextResponse.json({ 
      error: false,
      messages: ['Usuário autenticado com sucesso']
    });
  } catch (err: unknown) { 
    const error = err as AxiosError<ApiErrorResponse>

    return NextResponse.json(
      { 
        error: true,
        messages: error.response?.data?.messages || ['Credenciais informadas são inválidas']
      }, 
      { 
        status: error.response?.status || 500 
      }
    );
  }
}
