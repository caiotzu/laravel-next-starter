<?php

namespace App\Http\Resources\Admin\Auditoria;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditoriaEntidadeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource['id'],
            'label' => $this->resource['label'],
        ];
    }
}
