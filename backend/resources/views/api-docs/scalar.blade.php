{{--
    Documentação da API com Scalar. É incluída por resources/views/vendor/l5-swagger/index.blade.php
    quando API_DOCS_UI=scalar, então usa as mesmas rotas, os mesmos middlewares (limite de
    requisições, HTTP Basic do Admin, cabeçalhos de segurança) e o mesmo nonce de CSP do Swagger UI.
--}}
@php
    $urlDocumento = $urlsToDocs[$documentationTitle] ?? (array_values($urlsToDocs)[0] ?? '');
    $configuracaoScalar = \App\Support\ApiDocsUi::configuracaoScalar($urlDocumento, $documentationTitle);
@endphp
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $documentationTitle }}</title>
    <style>
        html, body { margin: 0; min-height: 100%; }
    </style>
</head>
<body>
<div id="app"></div>

<script src="{{ request()->getBasePath() }}/{{ ltrim(config('api_docs.scalar.script'), '/') }}"></script>
<script nonce="{{ request()->attributes->get('csp_nonce') }}">
    Scalar.createApiReference('#app', {!! json_encode($configuracaoScalar, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR) !!});
</script>
</body>
</html>
