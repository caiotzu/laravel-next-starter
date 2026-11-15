<?php

namespace App\Support;

/**
 * Escolha da interface da documentação da API (Swagger UI ou Scalar).
 *
 * Qualquer valor desconhecido cai em Swagger UI (o comportamento original),
 * para que um erro de digitação no .env nunca deixe a documentação sem tela.
 */
final class ApiDocsUi
{
    public const SWAGGER = 'swagger';

    public const SCALAR = 'scalar';

    public const OPCOES = [self::SWAGGER, self::SCALAR];

    private const TEMAS_SCALAR = [
        'default', 'alternate', 'moon', 'purple', 'solarized', 'bluePlanet',
        'deepSpace', 'saturn', 'kepler', 'mars', 'laserwave', 'none',
    ];

    private const LAYOUTS_SCALAR = ['modern', 'classic'];

    public static function normalizar(mixed $valor): string
    {
        $valor = is_string($valor) ? strtolower(trim($valor)) : '';

        return in_array($valor, self::OPCOES, true) ? $valor : self::SWAGGER;
    }

    public static function ativa(): string
    {
        return self::normalizar(config('api_docs.ui'));
    }

    /**
     * Configuração enviada ao Scalar. Tudo que chamaria um serviço externo fica
     * desligado (telemetria, fontes do Google, agente de IA e MCP): a CSP da
     * documentação só aceita a própria origem e a documentação é interna.
     *
     * @return array<string, mixed>
     */
    public static function configuracaoScalar(string $urlDocumento, string $titulo): array
    {
        $tema = config('api_docs.scalar.theme');
        $layout = config('api_docs.scalar.layout');

        return [
            'url' => $urlDocumento,
            'theme' => in_array($tema, self::TEMAS_SCALAR, true) ? $tema : 'default',
            'layout' => in_array($layout, self::LAYOUTS_SCALAR, true) ? $layout : 'modern',
            'withDefaultFonts' => false,
            'telemetry' => false,
            'persistAuth' => true,
            'agent' => ['disabled' => true],
            'mcp' => ['disabled' => true],
            'metaData' => ['title' => $titulo],
            'authentication' => ['preferredSecurityScheme' => 'bearerAuth'],
        ];
    }

    /**
     * Devolve o conteúdo de um .env com API_DOCS_UI definido: troca a linha existente
     * ou acrescenta ao final, sem mexer no restante do arquivo.
     */
    public static function atualizarEnv(string $conteudo, string $ui): string
    {
        $linha = 'API_DOCS_UI='.self::normalizar($ui);

        if (preg_match('/^API_DOCS_UI=[^\r\n]*/m', $conteudo) === 1) {
            return (string) preg_replace('/^API_DOCS_UI=[^\r\n]*/m', $linha, $conteudo, 1);
        }

        return $conteudo === '' ? $linha."\n" : rtrim($conteudo, "\r\n")."\n".$linha."\n";
    }
}
