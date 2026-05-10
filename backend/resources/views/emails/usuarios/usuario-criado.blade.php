@extends('emails.layouts.main')

@section('content')
    <h2 style="
        margin:0 0 12px 0;
        color:#111827;
        font-size:22px;
        font-weight:600;"
    >
        Sua conta foi criada com sucesso 🚀
    </h2>

    <p style="
        color:#6B7280;
        font-size:15px;
        line-height:1.6;
        margin:0 0 24px 0;"
    >
        Olá, <strong>{{ $nome }}</strong>.<br>
        Seu acesso ao sistema já está disponível.
        Utilize os dados abaixo para realizar o primeiro login.
    </p>

    <x-emails.card>

        <p style="margin:0 0 16px 0;font-weight:600;color:#111827;">
            Dados de acesso
        </p>

        <p style="margin:0;color:#6B7280;">Usuário</p>
        <p style="margin:4px 0 16px 0;font-weight:600;">
            {{ $email }}
        </p>

        <p style="margin:0;color:#6B7280;">Senha temporária</p>
        <p style="margin:4px 0 0 0;font-weight:600;letter-spacing:1px;">
            {{ $senha }}
        </p>

    </x-emails.card>

    <p style="
        color:#6B7280;
        font-size:14px;
        margin-top:24px;
        line-height:1.6;"
    >
        Por segurança, recomendamos alterar sua senha após o primeiro acesso.
    </p>

    <x-emails.button :url="$url">
        Acessar Sistema →
    </x-emails.button>
@endsection
