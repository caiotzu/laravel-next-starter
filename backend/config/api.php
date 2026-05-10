<?php

return [
    'pagination' => [
        'default' => 10,
        'max' => 100,
        'min' => 1,
    ],
    'email' => [
        'provider' => env('EMAIL_PROVIDER', 'amazon_ses'),
        'url' => env('EMAIL_URL', '')
    ]
];
