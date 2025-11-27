<?php
/**
 * JWT Helper Fonksiyonları
 */

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/response.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Access Token oluşturur (Kısa ömürlü: 15 dakika)
 *
 * @param array $payload Token içine konulacak veriler
 * @return string JWT Access Token
 */
function createAccessToken($payload) {
    $secretKey = $_ENV['JWT_SECRET'];
    $issuedAt = time();
    $expire = $issuedAt + (15 * 60); // 15 dakika

    $tokenPayload = array_merge($payload, [
        'iat' => $issuedAt,
        'exp' => $expire,
        'iss' => $_ENV['JWT_ISSUER'] ?? 'livecarwash',
        'type' => 'access' // Token tipi
    ]);

    return JWT::encode($tokenPayload, $secretKey, 'HS256');
}

/**
 * Refresh Token oluşturur (Uzun ömürlü: 30 gün)
 *
 * @param int $kullaniciid Kullanıcı ID
 * @return string JWT Refresh Token
 */
function createRefreshToken($kullaniciid) {
    $secretKey = $_ENV['JWT_SECRET'];
    $issuedAt = time();
    $expire = $issuedAt + (30 * 24 * 3600); // 30 gün

    $tokenPayload = [
        'kullaniciid' => $kullaniciid,
        'iat' => $issuedAt,
        'exp' => $expire,
        'iss' => $_ENV['JWT_ISSUER'] ?? 'livecarwash',
        'type' => 'refresh' // Token tipi
    ];

    return JWT::encode($tokenPayload, $secretKey, 'HS256');
}

/**
 * JWT Token oluşturur (Eski fonksiyon - geriye dönük uyumluluk)
 *
 * @param array $payload Token içine konulacak veriler
 * @param int $expirationHours Token geçerlilik süresi (saat cinsinden, varsayılan: 24)
 * @return string JWT Token
 */
function createJWT($payload, $expirationHours = 24) {
    $secretKey = $_ENV['JWT_SECRET'];
    $issuedAt = time();
    $expire = $issuedAt + ($expirationHours * 3600);

    $tokenPayload = array_merge($payload, [
        'iat' => $issuedAt,     // Token oluşturulma zamanı
        'exp' => $expire,        // Token geçerlilik süresi
        'iss' => $_ENV['JWT_ISSUER'] ?? 'livecarwash', // Token yayınlayıcı
    ]);

    return JWT::encode($tokenPayload, $secretKey, 'HS256');
}

/**
 * JWT Token doğrular ve içeriğini döndürür
 *
 * @param string $token JWT Token
 * @return object|null Token geçerliyse payload, değilse null
 */
function verifyJWT($token) {
    try {
        $secretKey = $_ENV['JWT_SECRET'];
        $decoded = JWT::decode($token, new Key($secretKey, 'HS256'));
        return $decoded;
    } catch (Exception $e) {
        return null;
    }
}

/**
 * Bearer token'ı Authorization header'dan alır
 *
 * @return string|null Token varsa string, yoksa null
 */
function getBearerToken() {
    $headers = getAuthorizationHeader();

    if (!empty($headers)) {
        if (preg_match('/Bearer\s+(.*)$/i', $headers, $matches)) {
            return $matches[1];
        }
    }

    return null;
}

/**
 * Authorization header'ı alır
 *
 * @return string|null
 */
function getAuthorizationHeader() {
    $headers = null;

    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER['Authorization']);
    } elseif (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(
            array_map('ucwords', array_keys($requestHeaders)),
            array_values($requestHeaders)
        );

        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }

    return $headers;
}

/**
 * Token'ı doğrular ve kullanıcı bilgilerini döndürür
 * Başarısız olursa otomatik olarak hata response döndürür
 *
 * @return object Token payload
 */
function requireAuth() {
    $token = getBearerToken();

    if (!$token) {
        error('Token bulunamadı. Authorization header gerekli.', 401);
    }

    $decoded = verifyJWT($token);

    if (!$decoded) {
        error('Geçersiz veya süresi dolmuş token.', 401);
    }

    return $decoded;
}

/**
 * Güvenli rastgele token oluşturur
 *
 * @param int $length Token uzunluğu
 * @return string
 */
function generateSecureToken($length = 32) {
    return bin2hex(random_bytes($length));
}

/**
 * HTTP-Only Secure Cookie ile refresh token ayarlar
 *
 * @param string $refreshToken Refresh token
 * @param int $expirationDays Geçerlilik süresi (gün)
 */
function setRefreshTokenCookie($refreshToken, $expirationDays = 30) {
    $expire = time() + ($expirationDays * 24 * 3600);

    // Production'da HTTPS zorunlu olacak
    $secure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';

    setcookie(
        'refresh_token',           // Cookie adı
        $refreshToken,             // Değer
        [
            'expires' => $expire,
            'path' => '/',         // Tüm site genelinde erişilebilir
            'domain' => '',        // Mevcut domain
            'secure' => $secure,   // HTTPS'de true
            'httponly' => true,    // JavaScript erişemez (XSS koruması)
            'samesite' => 'Lax'    // CSRF koruması ama cross-domain GET izin ver
        ]
    );
}

/**
 * Cookie'den refresh token alır
 *
 * @return string|null
 */
function getRefreshTokenFromCookie() {
    return $_COOKIE['refresh_token'] ?? null;
}

/**
 * Refresh token cookie'sini siler
 */
function clearRefreshTokenCookie() {
    setcookie(
        'refresh_token',
        '',
        [
            'expires' => time() - 3600, // Geçmişe tarih
            'path' => '/',
            'httponly' => true,
            'samesite' => 'Lax'
        ]
    );
}
