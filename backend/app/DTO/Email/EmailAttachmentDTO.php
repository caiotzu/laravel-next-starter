<?php

namespace App\DTO\Email;

final class EmailAttachmentDTO
{
    public function __construct(
        public readonly string $filename,
        public readonly string $file // base64
    ) {}
}
