<?php

namespace App\Services\External\Email;

use Illuminate\Support\Facades\Http;

use App\Contracts\Email\EmailProviderInterface;
use App\DTO\Email\EmailEnvioDTO;
use App\DTO\Email\EmailResultadoDTO;

class AmazonSesService implements EmailProviderInterface
{
    public function enviar(EmailEnvioDTO $email): EmailResultadoDTO
    {
        $payload = (Object) [
            'to' => implode(';', $email->to),
            'from_name' => $email->from_name,
            'subject' => '=?UTF-8?B?'.base64_encode($email->subject).'?=',
            'body' => base64_encode($email->body),
            'cc' => !empty($email->cc) ? implode(';', $email->cc) : null,
            'bcc' => !empty($email->bcc) ? implode(';', $email->bcc) : null,
            'attachments' => $this->formatAttachments($email),
        ];

        $response = Http::withHeaders([
            'Content-Type' => 'application/x-www-form-urlencoded',
        ])
        ->withoutVerifying()
        ->withBody(json_encode((object) $payload))
        ->post(config('api.email.url'));

        $data = $response->json() ?? null;

        if ((isset($data['error']) && $data['error']) || !$data) {
            return new EmailResultadoDTO(
                provider: 'amazon_ses',
                sucesso: false,
                mensagem_id: null,
                mensagem: 'Erro no envio do e-mail'
            );
        }

        return new EmailResultadoDTO(
            provider: 'amazon_ses',
            sucesso: true,
            mensagem_id: null,
            mensagem: 'E-mail enviado com sucesso'
        );
    }

    private function formatAttachments(EmailEnvioDTO $email): array
    {
        return array_map(
            fn ($attachment) => [
                'filename' => $attachment->filename,
                'file' => $attachment->file,
            ],
            $email->attachments
        );
    }
}
