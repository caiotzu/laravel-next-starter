<?php

namespace Tests\Support;

use Symfony\Component\HttpFoundation\Response;

use App\Contracts\Storage\FileStorageInterface;
use App\Enums\ArquivoVisibilidade;

/**
 * Provider de teste: guarda tudo em memória, sem tocar em disco nem em Flysystem.
 *
 * Existe para provar que as regras de negócio (Perfil, Banner, Chamado, comando de migração)
 * dependem apenas de FileStorageInterface — trocar o provider não exige mudar nenhuma delas.
 */
class ArquivosEmMemoria implements FileStorageInterface
{
    /** @var array<string, array<string, string>> */
    public array $arquivos = [];

    public bool $falharNaGravacao = false;

    public function __construct(array $discos = [])
    {
    }

    public function put(ArquivoVisibilidade $visibilidade, string $caminho, string $conteudo): bool
    {
        if ($this->falharNaGravacao) {
            return false;
        }

        $this->arquivos[$visibilidade->value][$caminho] = $conteudo;

        return true;
    }

    public function delete(ArquivoVisibilidade $visibilidade, string $caminho): bool
    {
        unset($this->arquivos[$visibilidade->value][$caminho]);

        return true;
    }

    public function exists(ArquivoVisibilidade $visibilidade, string $caminho): bool
    {
        return isset($this->arquivos[$visibilidade->value][$caminho]);
    }

    public function size(ArquivoVisibilidade $visibilidade, string $caminho): ?int
    {
        return $this->exists($visibilidade, $caminho) ? strlen($this->arquivos[$visibilidade->value][$caminho]) : null;
    }

    public function url(string $caminho): string
    {
        return 'https://arquivos.exemplo.com/' . $caminho;
    }

    public function response(
        ArquivoVisibilidade $visibilidade,
        string $caminho,
        string $nomeDownload,
        array $cabecalhos = [],
        string $disposicao = 'inline'
    ): Response {
        return response(
            $this->arquivos[$visibilidade->value][$caminho],
            200,
            $cabecalhos + ['Content-Disposition' => "{$disposicao}; filename=\"{$nomeDownload}\""]
        );
    }

    public function move(ArquivoVisibilidade $de, ArquivoVisibilidade $para, string $caminho): bool
    {
        if (! $this->exists($de, $caminho)) {
            return false;
        }

        $this->arquivos[$para->value][$caminho] = $this->arquivos[$de->value][$caminho];
        unset($this->arquivos[$de->value][$caminho]);

        return true;
    }

    /** @return string[] */
    public function caminhos(ArquivoVisibilidade $visibilidade): array
    {
        return array_keys($this->arquivos[$visibilidade->value] ?? []);
    }
}
