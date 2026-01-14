<?php
/**
 * Basit Test - Bootstrap olmadan
 */
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'Test dosyası çalışıyor',
    'file' => __FILE__,
    'dir' => __DIR__,
    'time' => date('Y-m-d H:i:s')
], JSON_PRETTY_PRINT);
