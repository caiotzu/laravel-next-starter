<?php

namespace App\Services\External\Email;

use Illuminate\Support\Facades\Mail;

use App\Contracts\Email\EmailProviderInterface;
use App\DTO\Email\EmailEnvioDTO;
use App\DTO\Email\EmailResultadoDTO;

class MailtrapService implements EmailProviderInterface
{
    public function enviar(EmailEnvioDTO $email): EmailResultadoDTO
    {
        try {

            Mail::send([], [], function ($message) use ($email) {

                $message->to($email->to)
                    ->from(
                        config('mail.from.address'),
                        $email->from_name
                    )
                    ->subject($email->subject)
                    ->html($email->body);

                if (!empty($email->cc)) {
                    $message->cc($email->cc);
                }

                if (!empty($email->bcc)) {
                    $message->bcc($email->bcc);
                }

                foreach ($email->attachments as $attachment) {
                    $message->attachData(
                        $attachment->file,
                        $attachment->filename
                    );
                }
            });

            return new EmailResultadoDTO(
                provider: 'mailtrap',
                sucesso: true,
                mensagem_id: null,
                mensagem: 'E-mail enviado com sucesso'
            );

        } catch (\Throwable $e) {

            return new EmailResultadoDTO(
                provider: 'mailtrap',
                sucesso: false,
                mensagem_id: null,
                mensagem: $e->getMessage()
            );
        }
    }
}
