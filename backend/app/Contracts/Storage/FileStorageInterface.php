<?php

namespace App\Contracts\Storage;

use App\Enums\ArquivoVisibilidade;
use Symfony\Component\HttpFoundation\Response;

/**
 * Armazenamento de arquivos da aplicação. As regras de negócio dependem apenas deste
 * contrato — nunca de `Storage::disk(...)` nem de um provider específico (local, S3, ...).
 *
 * Os caminhos são SEMPRE relativos e gerados pela aplicação (ex.: "banners/{id}/{uuid}.png");
 * é esse valor que fica no banco. Como ele não inclui disco nem host, trocar o provider não
 * exige alterar registros — apenas copiar os arquivos (ver docs/armazenamento-de-arquivos.md).
 *
 * Implementações NÃO lançam exceção em falha de I/O (mesmo comportamento dos discos com
 * 'throw' => false): retornam false/null e quem chama decide o que fazer. Caminhos
 * inválidos (path traversal, absolutos, vazios...) lançam \InvalidArgumentException nas
 * operações de escrita/remoção/entrega, e são tratados como "inexistentes" em exists()/size().
 */
interface FileStorageInterface
{
    /**
     * Grava o conteúdo. Retorna false se não foi possível gravar.
     */
    public function put(ArquivoVisibilidade $visibilidade, string $caminho, string $conteudo): bool;

    /**
     * Remove o arquivo. Um arquivo inexistente não é erro (retorna true), como no Laravel.
     */
    public function delete(ArquivoVisibilidade $visibilidade, string $caminho): bool;

    public function exists(ArquivoVisibilidade $visibilidade, string $caminho): bool;

    /**
     * Tamanho em bytes, ou null se o arquivo não existir.
     */
    public function size(ArquivoVisibilidade $visibilidade, string $caminho): ?int;

    /**
     * URL pública de um arquivo PUBLICO. Arquivos privados não têm URL direta por
     * design — use response() atrás de uma rota autorizada (ex.: link assinado).
     */
    public function url(string $caminho): string;

    /**
     * Resposta HTTP em streaming (sem carregar o arquivo inteiro em memória).
     *
     * @param array<string, string> $cabecalhos
     * @param 'inline'|'attachment' $disposicao
     */
    public function response(
        ArquivoVisibilidade $visibilidade,
        string $caminho,
        string $nomeDownload,
        array $cabecalhos = [],
        string $disposicao = 'inline'
    ): Response;

    /**
     * Move um arquivo entre visibilidades usando streams (sem carregar o arquivo em
     * memória), conferindo o tamanho antes de apagar o original. Se o original não
     * existir ou a cópia falhar, retorna false e o original é mantido.
     */
    public function move(ArquivoVisibilidade $de, ArquivoVisibilidade $para, string $caminho): bool;
}
