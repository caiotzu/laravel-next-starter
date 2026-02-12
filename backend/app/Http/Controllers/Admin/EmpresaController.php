<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;

use Illuminate\Http\JsonResponse;

use App\Services\GrupoEmpresaService;

use App\Http\Requests\Admin\GrupoEmpresa\ListarRequest;
use App\Http\Requests\Admin\GrupoEmpresa\CadastrarRequest;
use App\Http\Requests\Admin\GrupoEmpresa\AtualizarRequest;

use App\DTO\GrupoEmpresa\GrupoEmpresaFiltroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaCadastroDTO;
use App\DTO\GrupoEmpresa\GrupoEmpresaAtualizacaoDTO;

class EmpresaController extends Controller
{
    /**
     * Ainda precisa começar a parte de empresa
     */
    public function __construct(
        protected GrupoEmpresaService $grupoEmpresaService,
    ) {}

}
