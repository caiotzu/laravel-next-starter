<?php

return [
    'pagination' => [
        'default' => 10,
        'max' => 100,
        'min' => 1,
    ],
    'email' => [
        'logo' => env('EMAIL_LOGO', ''),
        'url' => env('EMAIL_URL', ''),
        'provider' => env('EMAIL_PROVIDER', 'amazon_ses'),
    ],
    'chamados' => [
        // Em KB. Validado no backend (fonte da verdade) e refletido no
        // frontend só para feedback imediato ao usuário.
        'anexo_tamanho_maximo_kb' => env('CHAMADO_ANEXO_TAMANHO_MAXIMO_KB', 10240), // 10MB
        'anexo_mimes' => ['pdf', 'jpg', 'jpeg', 'png'],
        'anexos_maximo_por_mensagem' => env('CHAMADO_ANEXOS_MAXIMO_POR_MENSAGEM', 5),
    ],
];
