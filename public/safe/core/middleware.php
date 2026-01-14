<?php
/**
 * API Middleware Fonksiyonları
 * Token doğrulama ve yetki kontrolleri
 */

require_once __DIR__ . '/jwt.php';
require_once __DIR__ . '/functions.php';
require_once __DIR__ . '/response.php';

/**
 * Token doğrulama middleware
 * Her korumalı endpoint'in başında çağrılmalı
 *
 * Kullanım:
 * require_once 'middleware.php';
 * $user = authenticate();
 *
 * @return object Kullanıcı bilgileri (JWT payload)
 */
function authenticate() {
    return requireAuth();
}

/**
 * Kullanıcı tipi kontrolü yapar
 *
 * @param object $user JWT payload
 * @param array $allowedTypes İzin verilen kullanıcı tipleri [100, 90, 80]
 * @return bool
 */
function checkUserType($user, $allowedTypes = [100]) {
    if (!isset($user->kullanicitipi)) {
        error('Kullanıcı tipi bulunamadı', 403);
    }

    if (!in_array($user->kullanicitipi, $allowedTypes)) {
        error('Bu işlem için yetkiniz yok', 403);
    }

    return true;
}

/**
 * Kullanıcının admin olup olmadığını kontrol eder
 *
 * @param object $user JWT payload
 * @return bool
 */
function requireAdmin($user) {
    return checkUserType($user, [100]);
}

/**
 * Kullanıcının admin veya yönetici olup olmadığını kontrol eder
 *
 * @param object $user JWT payload
 * @return bool
 */
function requireManager($user) {
    return checkUserType($user, [100, 90]);
}

/**
 * CORS header'larını ayarlar (Production için güvenli)
 */
function setCorsHeaders() {
    // Frontend localhost'ta, backend appmobile.golaks.com'da
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

    // OPTIONS request için
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Rate limiting kontrolü (basit implementasyon)
 * Gelişmiş kullanım için Redis veya Memcached önerilir
 *
 * @param string $identifier IP adresi veya user ID
 * @param int $maxRequests Maksimum istek sayısı
 * @param int $timeWindow Zaman penceresi (saniye)
 * @return bool
 */
function checkRateLimit($identifier, $maxRequests = 100, $timeWindow = 60) {
    $cacheFile = sys_get_temp_dir() . '/rate_limit_' . md5($identifier) . '.txt';

    $requests = [];
    if (file_exists($cacheFile)) {
        $requests = json_decode(file_get_contents($cacheFile), true) ?? [];
    }

    $now = time();
    $requests = array_filter($requests, function($timestamp) use ($now, $timeWindow) {
        return ($now - $timestamp) < $timeWindow;
    });

    if (count($requests) >= $maxRequests) {
        error('Çok fazla istek gönderdiniz. Lütfen bekleyin.', 429);
    }

    $requests[] = $now;
    file_put_contents($cacheFile, json_encode($requests));

    return true;
}

/**
 * JSON input'u parse eder ve döndürür
 *
 * @return array
 */
function getJsonInput() {
    $input = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        error('Geçersiz JSON formatı', 400);
    }

    return $input ?? [];
}

/**
 * Request method kontrolü
 *
 * @param string|array $allowedMethods İzin verilen metodlar
 */
function checkMethod($allowedMethods) {
    $method = $_SERVER['REQUEST_METHOD'];
    $allowed = is_array($allowedMethods) ? $allowedMethods : [$allowedMethods];

    if (!in_array($method, $allowed)) {
        error('Bu metod desteklenmiyor', 405);
    }
}

/**
 * Input validasyonu yapar
 *
 * @param array $input Input verisi
 * @param array $required Gerekli alanlar ['field1', 'field2']
 * @return bool
 */
function validateRequired($input, $required) {
    $missing = [];

    foreach ($required as $field) {
        if (!isset($input[$field]) || trim($input[$field]) === '') {
            $missing[] = $field;
        }
    }

    if (!empty($missing)) {
        error('Eksik alanlar: ' . implode(', ', $missing), 400);
    }

    return true;
}
