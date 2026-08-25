<?php

namespace App\Http\Requests\Private\Chamado;

class ResponderRequest extends \App\Http\Requests\Private\Chamado\AbrirRequest
{
    public function rules(): array
    {
        $rules = parent::rules();

        // Assunto/tipo não fazem parte da resposta — só da abertura.
        unset($rules['tipo'], $rules['assunto']);

        return $rules;
    }
}
