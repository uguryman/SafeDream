<?php
/**
 * Bootstrap Dosyası
 * Tüm API endpoint'lerinin kullanacağı ortak dosyaları yükler
 *
 * Kullanım:
 * require_once __DIR__ . '/../core/bootstrap.php';
 */

// Hata raporlamayı aç (development)
error_reporting(E_ALL);
ini_set('display_errors', '1');

// CORS Header'larını ayarla
$allowedOrigins = [
    'http://localhost:5173', // Vite dev server (local frontend)
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Default olarak localhost'a izin ver (development için)
    header('Access-Control-Allow-Origin: http://localhost:5173');
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// OPTIONS request için (sadece HTTP request varsa)
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Ortak dosyaları yükle
require_once __DIR__ . '/config.php';      // .env yükleme ve DB bağlantısı
require_once __DIR__ . '/response.php';    // success(), error() fonksiyonları
require_once __DIR__ . '/functions.php';   // dbSelect, dbInsert, dbUpdate, dbDelete
require_once __DIR__ . '/jwt.php';         // JWT fonksiyonları ve requireAuth()
require_once __DIR__ . '/middleware.php';  // Middleware fonksiyonları
