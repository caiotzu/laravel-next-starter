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
    ]
];
