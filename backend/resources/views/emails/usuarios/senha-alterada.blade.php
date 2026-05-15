@extends('emails.layouts.main')

@section('content')
    <h2 style="
        margin:0 0 12px 0;
        color:#111827;
        font-size:22px;
        font-weight:600;"
    >
        Sua senha foi alterada 🔐
    </h2>

    <p style="
        color:#6B7280;
        font-size:15px;
        line-height:1.6;
        margin:0 0 24px 0;"
    >
        Olá, <strong>{{ $nome }}</strong>.<br>
        Informamos que a senha da sua conta foi alterada com sucesso.
    </p>

    <x-emails.card>

        <p style="margin:0 0 16px 0;font-weight:600;color:#111827;">
            Detalhes da alteração
        </p>

        <p style="margin:0;color:#6B7280;">Usuário</p>
        <p style="margin:4px 0 16px 0;font-weight:600;">
            {{ $email }}
        </p>

        <p style="margin:0;color:#6B7280;">Data da alteração</p>
        <p style="margin:4px 0 0 0;font-weight:600;">
            {{ now()->format('d/m/Y H:i') }}
        </p>

    </x-emails.card>

    <p style="
        color:#6B7280;
        font-size:14px;
        margin-top:24px;
        line-height:1.6;"
    >
        Caso você não tenha realizado esta alteração, recomendamos redefinir
        sua senha imediatamente ou entrar em contato com o suporte.
    </p>

    <x-emails.button :url="$url">
        Redefinir senha →
    </x-emails.button>
@endsection
