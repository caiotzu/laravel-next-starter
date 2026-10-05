<?php

namespace App\Services\Storage;

use InvalidArgumentException;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

use App\Contracts\Storage\FileStorageInterface;
use App\Enums\ArquivoVisibilidade;

/**
 * Implementação de FileStorageInterface sobre o filesystem do Laravel (Flysystem).
 *
 * Atende qualquer disco do Laravel — local, S3, SFTP, ou um driver registrado com
 * Storage::extend() (ex.: GridFS) — porque só conversa com a interface do Filesystem. O que
 * muda entre os providers é apenas o mapa visibilidade => disco, definido em
 * config('api.storage.drivers.*.discos') e escolhido por FILE_STORAGE_DRIVER.
 *
 * Os discos são resolvidos a cada chamada (e não guardados), de modo que Storage::fake()
 * nos testes continue funcionando.
 */
class LaravelFileStorage implements FileStorageInterface
{
    /**
     * @param array{publico: string, privado: string} $discos nome do disco por visibilidade
     */
    public function __construct(private array $discos)
    {
        foreach (ArquivoVisibilidade::cases() as $visibilidade) {
            if (empty($this->discos[$visibilidade->value])) {
                throw new InvalidArgumentException(
                    "Storage de arquivos sem disco configurado para a visibilidade '{$visibilidade->value}'."
                );
            }
        }
    }

    public function put(ArquivoVisibilidade $visibilidade, string $caminho, string $conteudo): bool
    {
        return (bool) $this->disco($visibilidade)->put($this->caminhoSeguro($caminho), $conteudo);
    }

    public function delete(ArquivoVisibilidade $visibilidade, string $caminho): bool
    {
        return (bool) $this->disco($visibilidade)->delete($this->caminhoSeguro($caminho));
    }

    public function exists(ArquivoVisibilidade $visibilidade, string $caminho): bool
    {
        // Leitura: um caminho inválido simplesmente "não existe" (o download vira 404).
        if (! $this->caminhoValido($caminho)) {
            return false;
        }

        return $this->disco($visibilidade)->exists($caminho);
    }

    public function size(ArquivoVisibilidade $visibilidade, string $caminho): ?int
    {
        if (! $this->caminhoValido($caminho)) {
            return null;
        }

        $disco = $this->disco($visibilidade);

        return $disco->exists($caminho) ? $disco->size($caminho) : null;
    }

    public function url(string $caminho): string
    {
        return $this->disco(ArquivoVisibilidade::PUBLICO)->url($this->caminhoSeguro($caminho));
    }

    public function response(
        ArquivoVisibilidade $visibilidade,
        string $caminho,
        string $nomeDownload,
        array $cabecalhos = [],
        string $disposicao = 'inline'
    ): Response {
        return $this->disco($visibilidade)->response(
            $this->caminhoSeguro($caminho),
            $nomeDownload,
            $cabecalhos,
            $disposicao
        );
    }

    public function move(ArquivoVisibilidade $de, ArquivoVisibilidade $para, string $caminho): bool
    {
        $caminho = $this->caminhoSeguro($caminho);
        $origem = $this->disco($de);
        $destino = $this->disco($para);

        if (! $origem->exists($caminho)) {
            return false;
        }

        $stream = $origem->readStream($caminho);

        if (! is_resource($stream)) {
            return false;
        }

        try {
            $gravado = $destino->writeStream($caminho, $stream);
        } finally {
            fclose($stream);
        }

        if (! $gravado || ! $destino->exists($caminho) || $destino->size($caminho) !== $origem->size($caminho)) {
            return false;
        }

        // Mesmo disco (ex.: visibilidades apontando para o mesmo lugar): nada a apagar.
        if ($this->discos[$de->value] !== $this->discos[$para->value]) {
            $origem->delete($caminho);
        }

        return true;
    }

    private function disco(ArquivoVisibilidade $visibilidade): FilesystemAdapter
    {
        return Storage::disk($this->discos[$visibilidade->value]);
    }

    /**
     * Defesa em profundidade contra path traversal. Os caminhos são gerados pelo sistema
     * (uuid + extensão de uma lista fixa) e o Flysystem também recusa "..", mas como o valor
     * vem do banco em alguns fluxos, é validado aqui antes de tocar no disco.
     */
    private function caminhoSeguro(string $caminho): string
    {
        if (! $this->caminhoValido($caminho)) {
            throw new InvalidArgumentException('Caminho de arquivo inválido.');
        }

        return $caminho;
    }

    private function caminhoValido(string $caminho): bool
    {
        return $caminho !== ''
            && ! str_contains($caminho, "\0")
            && ! str_contains($caminho, '\\')
            && ! str_starts_with($caminho, '/')
            && preg_match('#(^|/)\.\.?(/|$)#', $caminho) !== 1;
    }
}
