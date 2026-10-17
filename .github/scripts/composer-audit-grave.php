<?php

/**
 * Lê a saída de `composer audit --format=json` e falha SÓ se houver advisory ALTO ou CRÍTICO
 * (ou de severidade desconhecida, que não dá para julgar — o caminho seguro é avisar).
 * Baixa/média e pacotes abandonados apenas são reportados.
 *
 * Existe porque a opção `composer audit --ignore-severity` só existe em versões recentes do
 * Composer; ler o JSON funciona em qualquer versão.
 *
 * Uso: php composer-audit-grave.php composer-audit.json
 * Saída: 0 = ok · 1 = há advisory grave · 2 = não foi possível ler o resultado
 */

$arquivo = $argv[1] ?? 'composer-audit.json';
$conteudo = is_file($arquivo) ? file_get_contents($arquivo) : false;
$dados = $conteudo === false ? null : json_decode($conteudo, true);

if (! is_array($dados)) {
    fwrite(STDERR, "Não foi possível ler o resultado do composer audit ({$arquivo}).\n");
    exit(2);
}

$graves = [];
$demais = 0;

// Sem advisories o Composer devolve "advisories": [] (lista vazia); com advisories, um mapa pacote => lista.
foreach (($dados['advisories'] ?? []) as $pacote => $lista) {
    foreach ($lista as $advisory) {
        $severidade = strtolower((string) ($advisory['severity'] ?? ''));
        $titulo = $advisory['title'] ?? $advisory['advisoryId'] ?? 'sem título';
        $link = $advisory['link'] ?? '';

        if (in_array($severidade, ['high', 'critical', ''], true)) {
            $graves[] = sprintf('%s [%s] %s %s', $pacote, $severidade !== '' ? $severidade : 'severidade desconhecida', $titulo, $link);
        } else {
            $demais++;
        }
    }
}

if ($demais > 0) {
    echo "{$demais} advisory(ies) de severidade baixa/média: apenas reportado(s), não bloqueia.\n";
}

if ($graves !== []) {
    fwrite(STDERR, "Advisories GRAVES encontrados:\n - " . implode("\n - ", $graves) . "\n");
    exit(1);
}

echo "Nenhum advisory alto/crítico.\n";
