<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'storage/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['*'], // Permite todos los orígenes en desarrollo
    'allowed_origins_patterns' => [
        '/^http:\/\/localhost:\d+$/',
        '/^http:\/\/127\.0\.0\.1:\d+$/', 
        '/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/', // IPs locales dinámicas
        '/^http:\/\/10\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+$/', // Redes privadas
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
