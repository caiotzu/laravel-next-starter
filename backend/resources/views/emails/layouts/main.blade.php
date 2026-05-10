<!DOCTYPE html>
<html lang="pt-BR">

    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width">

        <title>{{ $subject ?? config('app.name') }}</title>
    </head>

    <body style="margin:0;padding:0;background:#F3F4F6;">

        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#F3F4F6">
            <tr>
                <td align="center" style="padding:40px 15px;">

                    <table width="600"
                        style="
                        max-width:600px;
                        background:#FFFFFF;
                        border:1px solid #E5E7EB;
                        border-radius:10px;
                        overflow:hidden;
                        font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;"
                    >
                        <tr>
                            <td align="center" style="padding:36px 32px;border-bottom:1px solid #E5E7EB;">
                                @if (config('api.email.logo'))
                                    <img
                                        src="{{ config('api.email.logo') }}"
                                        alt="{{ config('app.name') }}"
                                        width="130"
                                        style="display:block;border:0;outline:none;text-decoration:none;margin:0 auto 14px auto;height:auto;"
                                    >
                                @endif

                                <div
                                    style="
                                    display:inline-block;
                                    padding:6px 12px;
                                    background:#F3F4F6;
                                    border-radius:999px;
                                    font-size:12px;
                                    color:#6B7280;
                                    margin-bottom:14px;"
                                >
                                    Notificação do Sistema
                                </div>

                                <h1 style="
                                    margin:0;
                                    font-size:22px;
                                    color:#111827;
                                    font-weight:600;
                                    "
                                >
                                    {{ config('app.name') }}
                                </h1>

                            </td>
                        </tr>

                        <tr>
                            <td style="padding:44px 36px;">
                                @yield('content')
                            </td>
                        </tr>

                        <tr>
                            <td align="center"
                                style="
                                padding:26px;
                                background:#F9FAFB;
                                border-top:1px solid #E5E7EB;
                                font-size:12px;
                                color:#9CA3AF;
                                line-height:1.6;"
                            >

                                Este é um e-mail automático enviado por
                                <strong>{{ config('app.name') }}</strong>.<br>
                                Por favor, não responda esta mensagem.

                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>

</html>
