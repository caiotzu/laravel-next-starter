<?php

namespace App\Contracts\Email;

use App\DTO\Email\EmailEnvioDTO;
use App\DTO\Email\EmailResultadoDTO;

interface EmailProviderInterface
{
    public function enviar(EmailEnvioDTO $dto): EmailResultadoDTO;
}
