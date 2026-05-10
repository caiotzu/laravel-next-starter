<?php

namespace App\DTO\Email;

use InvalidArgumentException;

final class EmailEnvioDTO
{
    /**
     * @param string[] $to
     * @param string[] $cc
     * @param string[] $bcc
     * @param EmailAttachmentDTO[] $attachments
     */
    public function __construct(
        public readonly array $to,
        public readonly string $from_name,
        public readonly string $subject,
        public readonly string $body,
        public readonly ?array $cc = [],
        public readonly ?array $bcc = [],
        public readonly ?array $attachments = [],
    ) {
        $this->validateEmails($this->to, 'to');
        $this->validateEmails($this->cc, 'cc');
        $this->validateEmails($this->bcc, 'bcc');
        $this->validateAttachments($this->attachments);
    }

    private function validateEmails(array $emails, string $field): void
    {
        foreach ($emails as $email) {
            if (!is_string($email)) {
                throw new InvalidArgumentException(
                    "Todos os itens de {$field} devem ser string."
                );
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new InvalidArgumentException(
                    "Email inválido em {$field}: {$email}"
                );
            }
        }
    }

    private function validateAttachments(array $attachments): void
    {
        foreach ($attachments as $attachment) {
            if (!$attachment instanceof EmailAttachmentDTO) {
                throw new InvalidArgumentException(
                    'Attachments devem ser EmailAttachmentDTO.'
                );
            }
        }
    }
}
