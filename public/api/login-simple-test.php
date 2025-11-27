<?php
/**
 * Basit Login Test - Hatayı bulmak için
 */

// Hata gösterimi
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/login_error.log');

// CORS Header
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS için hızlı dönüş
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Dosyaları yükle
    require_once __DIR__ . '/core/functions.php';
    require_once __DIR__ . '/core/jwt.php';
    require_once __DIR__ . '/core/response.php';

    // Input al
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        throw new Exception('JSON parse hatası: ' . json_last_error_msg());
    }

    // Validasyon
    if (empty($input['kullaniciadi'])) {
        throw new Exception('Kullanıcı adı gerekli');
    }

    if (empty($input['sifre'])) {
        throw new Exception('Şifre gerekli');
    }

    $kullaniciadi = trim($input['kullaniciadi']);
    $sifre = trim($input['sifre']);

    // Kullanıcıyı bul
    $kullanici = dbSelectOne('kullanici', [
        'kullaniciadi' => $kullaniciadi,
        'aktif' => 1
    ]);

    if (!$kullanici) {
        throw new Exception('Kullanıcı bulunamadı');
    }

    // Kullanıcı tipi kontrolü
    if ((int)$kullanici['kullanicitipi'] !== 100) {
        throw new Exception('Sadece admin kullanıcıları giriş yapabilir');
    }

    // Şifre kontrolü
    $passwordValid = false;

    if (strpos($kullanici['kullanicisifre'], '$2y$') === 0) {
        $passwordValid = password_verify($sifre, $kullanici['kullanicisifre']);
    } else {
        $passwordValid = ($kullanici['kullanicisifre'] === $sifre);
    }

    if (!$passwordValid) {
        throw new Exception('Şifre hatalı');
    }

    // Token oluştur
    $accessTokenPayload = [
        'kullaniciadi' => $kullanici['kullaniciadi'],
        'firmaid' => (int)$kullanici['firmaid'],
        'subeid' => (int)$kullanici['subeid'],
        'kullaniciid' => (int)$kullanici['id'],
        'kullanicitipi' => (int)$kullanici['kullanicitipi']
    ];

    $accessToken = createAccessToken($accessTokenPayload);
    $refreshToken = createRefreshToken((int)$kullanici['id']);

    // DB'ye kaydet
    dbUpdate('kullanici', [
        'token' => $refreshToken,
        'songiris' => date('Y-m-d H:i:s'),
        'kayitipadresi' => $_SERVER['REMOTE_ADDR'] ?? ''
    ], [
        'id' => $kullanici['id']
    ]);

    // Cookie ayarla
    setRefreshTokenCookie($refreshToken, 30);

    // Response
    echo json_encode([
        'success' => true,
        'data' => [
            'accessToken' => $accessToken
        ]
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
