<?php

namespace App\Http\Controllers\Global;

use Symfony\Component\HttpFoundation\Response;

use App\Contracts\Storage\FileStorageInterface;
use App\Enums\ArquivoVisibilidade;
use App\Http\Controllers\Controller;

use App\Models\ChamadoAnexo;

class ChamadoAnexoController extends Controller
{
    public function __construct(private FileStorageInterface $arquivos) {}

    /**
     * Entrega o arquivo de um anexo de chamado. Rota protegida por URL assinada e temporária
     * (middleware signed:relative) — ver ChamadoAnexo::caminho. Sem assinatura válida ou
     * expirada, o Laravel responde 403 antes de chegar aqui.
     */
    public function baixar(string $anexo): Response
    {
        $registro = ChamadoAnexo::findOrFail($anexo);

        $caminho = $registro->caminhoArmazenado();

        // Anexos novos ficam no armazenamento privado. Os antigos (anteriores à correção)
        // podem ainda estar no público até rodar `php artisan chamados:mover-anexos-privados`.
        $visibilidade = collect([ArquivoVisibilidade::PRIVADO, ArquivoVisibilidade::PUBLICO])
            ->first(fn (ArquivoVisibilidade $v) => $caminho && $this->arquivos->exists($v, $caminho));

        abort_unless($visibilidade, 404);

        // Somente imagens são exibidas no navegador; PDF sempre baixa (evita renderizar
        // conteúdo ativo no origin da API).
        $inline = in_array($registro->mime_type, ['image/png', 'image/jpeg'], true);

        return $this->arquivos->response(
            $visibilidade,
            $caminho,
            $registro->nome_original,
            [
                'Content-Type' => $registro->mime_type,
                'X-Content-Type-Options' => 'nosniff',
                'Content-Security-Policy' => "default-src 'none'; sandbox",
                'Cache-Control' => 'private, max-age=300',
            ],
            $inline ? 'inline' : 'attachment'
        );
    }
}
