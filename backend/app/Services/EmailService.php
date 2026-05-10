<?php

namespace App\Services;

use App\Contracts\Email\EmailProviderInterface;

use App\DTO\Email\EmailEnvioDTO;
use App\DTO\Email\EmailResultadoDTO;

class EmailService {
    public function __construct(
        private EmailProviderInterface $provider
    ) {}

    public function enviar(EmailEnvioDTO $dto): EmailResultadoDTO
    {
        return $this->provider->enviar($dto);
    }
}
