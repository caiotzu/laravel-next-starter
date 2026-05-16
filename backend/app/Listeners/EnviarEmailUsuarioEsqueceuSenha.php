<?php

namespace App\Listeners;

use App\Events\UsuarioEsqueceuSenha;

use App\Services\EmailService;

use App\DTO\Email\EmailEnvioDTO;

use App\Models\Usuario;

use App\Enums\EntidadeTipo;
use App\Enums\EmailTemplate;

class EnviarEmailUsuarioEsqueceuSenha
{
    public function __construct(
        private EmailService $emailService
    ) {}

    public function handle(UsuarioEsqueceuSenha $event): void
    {
        $usuario = $event->usuario;

        $html = view(EmailTemplate::SENHA_REDEFINICAO->value, [
            'nome' => $usuario->nome,
            'email' => $usuario->email,
            'url' => $this->resolverUrl($usuario, $event->token),
        ])->render();

        $resultado = $this->emailService->enviar(new EmailEnvioDTO(
            to: [$usuario->email],
            from_name: config('app.name'),
            subject: 'Redefinição de senha',
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

    private function resolverUrl(Usuario $usuario, string $token): string
    {
        return match ($usuario->grupo->entidadeTipo->chave->value) {
            EntidadeTipo::ADMIN->value => config('app.url_frontend').'/admin/redefinir-senha?token=' . $token,
            EntidadeTipo::PRIVATE->value => config('app.url_frontend').'/redefinir-senha?token=' . $token,
            default => config('app.url_frontend').'/redefinir-senha?token=' . $token
        };
    }
}
