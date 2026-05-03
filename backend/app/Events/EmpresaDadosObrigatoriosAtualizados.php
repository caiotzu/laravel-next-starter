<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

use App\Models\Empresa;

class EmpresaDadosObrigatoriosAtualizados
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct( public readonly ?Empresa $empresa)
    {}
}
