@extends('emails.layouts.main')

@section('content')
    <h2 style="
        margin:0 0 12px 0;
        color:#111827;
        font-size:22px;
        font-weight:600;"
    >
        Redefinição de senha
    </h2>

    <p style="
        color:#6B7280;
        font-size:15px;
        line-height:1.6;
        margin:0 0 24px 0;"
    >
        Olá, <strong>{{ $nome }}</strong>.<br>
        Recebemos uma solicitação para redefinir a senha da sua conta.
    </p>

    <x-emails.card>

        <p style="margin:0 0 16px 0;font-weight:600;color:#111827;">
            Dados da solicitação
        </p>

        <p style="margin:0;color:#6B7280;">Usuário</p>
        <p style="margin:4px 0 16px 0;font-weight:600;">
            {{ $email }}
        </p>

    </x-emails.card>

    <p style="
        color:#6B7280;
        font-size:14px;
        margin-top:24px;
        line-height:1.6;"
    >
        Se você reconhece esta solicitação, use o link abaixo para definir uma nova senha.
        O link é de uso único e possui prazo de expiração.
    </p>

    <x-emails.button :url="$url">
        Redefinir senha →
    </x-emails.button>
@endsection
