<?php

namespace App\Listeners;

use App\Events\UsuarioCriado;

use App\Services\EmailService;

use App\DTO\Email\EmailEnvioDTO;

use App\Models\Usuario;

use App\Enums\EntidadeTipo;
use App\Enums\EmailTemplate;

class EnviarEmailUsuarioCriado
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(UsuarioCriado $event): void
    {
        $usuario = $event->usuario;
        $url = $this->resolverUrl($usuario);

        $html = view(EmailTemplate::USUARIO_CRIADO->value, [
            'nome' => $usuario->nome,
            'email' => $usuario->email,
            'senha' => $event->senha,
            'url' => $url
        ])->render();

        $this->emailService->enviar(new EmailEnvioDTO(
            to: [$usuario->email],
            from_name: config('app.name'),
            subject: 'Bem-vindo ao '.config('app.name'),
            body: $html,
            cc: [],
            bcc: [],
            attachments: [],
        ));
    }

    private function resolverUrl(Usuario $usuario): string
    {
        return match ($usuario->grupo->entidadeTipo->chave->value) {
            EntidadeTipo::ADMIN->value => config('app.url_frontend').'/admin',
            EntidadeTipo::PRIVATE->value => config('app.url_frontend'),
            default => config('app.url_frontend'),
        };
    }
}
