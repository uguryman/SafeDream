<?php
/**
 * Basit test - sadece JSON döndür
 */
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'Test başarılı',
    'path' => __DIR__,
    'file' => __FILE__
]);
