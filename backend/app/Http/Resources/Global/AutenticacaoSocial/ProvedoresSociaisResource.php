<?php

namespace App\Http\Resources\Global\AutenticacaoSocial;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProvedoresSociaisResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'provedores' => collect($this->resource)
                ->map(fn ($p) => ['chave' => $p['chave'], 'nome' => $p['nome']])
                ->values()
                ->all(),
        ];
    }
}
