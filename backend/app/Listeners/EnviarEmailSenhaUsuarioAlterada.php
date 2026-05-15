<?php

namespace App\Listeners;

use App\Events\SenhaUsuarioAlterada;

use App\Services\EmailService;

use App\DTO\Email\EmailEnvioDTO;

use App\Models\Usuario;

use App\Enums\EntidadeTipo;
use App\Enums\EmailTemplate;

class EnviarEmailSenhaUsuarioAlterada
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(SenhaUsuarioAlterada $event): void
    {
        $usuario = $event->usuario;
        $url = $this->resolverUrl($usuario);

        $html = view(EmailTemplate::SENHA_ALTERADA->value, [
            'nome' => $usuario->nome,
            'email' => $usuario->email,
            'url' => $url
        ])->render();

        $resultado = $this->emailService->enviar(new EmailEnvioDTO(
            to: [$usuario->email],
            from_name: config('app.name'),
            subject: 'Sua senha foi alterada',
            body: $html,
            cc: [],
            bcc: [],
            attachments: [],
        ));

        if (!$resultado->sucesso) {
            logger()->error('Falha ao enviar e-mail', [
                'provider' => $resultado->provider,
                'mensagem' => $resultado->mensagem,
                'usuario_id' => $usuario->id,
            ]);
        }
    }

    private function resolverUrl(Usuario $usuario): string
    {
        return match ($usuario->grupo->entidadeTipo->chave->value) {
            EntidadeTipo::ADMIN->value => config('app.url_frontend').'/admin/redefinir-senha',
            EntidadeTipo::PRIVATE->value => config('app.url_frontend').'/redefinir-senha',
            default => config('app.url_frontend').'/redefinir-senha',
        };
    }
}
