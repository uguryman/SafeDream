<?php
/**
 * Login Endpoint
 * Kullanıcı girişi yapar ve JWT token döndürür
 *
 * Method: POST
 * Body: {
 *   "kullaniciadi": "email@example.com",
 *   "sifre": "password123"
 * }
 */

// CORS ayarları - Frontend localhost'ta, backend appmobile.golaks.com'da
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

header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// OPTIONS request için
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/core/functions.php';
require_once __DIR__ . '/core/jwt.php';
require_once __DIR__ . '/core/response.php';

// Sadece POST metodunu kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    error('Sadece POST metodu kabul edilir', 405);
}

try {
    // JSON input al
    $input = json_decode(file_get_contents('php://input'), true);

    // Validasyon
    if (empty($input['kullaniciadi'])) {
        error('Kullanıcı adı gerekli', 400);
    }

    if (empty($input['sifre'])) {
        error('Şifre gerekli', 400);
    }

    $kullaniciadi = trim($input['kullaniciadi']);
    $sifre = trim($input['sifre']);

    // Kullanıcıyı veritabanından bul
    $kullanici = dbSelectOne('kullanici', [
        'kullaniciadi' => $kullaniciadi,
        'aktif' => 1
    ]);

    // Kullanıcı bulunamadı
    if (!$kullanici) {
        error('Kullanıcı adı veya şifre hatalı', 401);
    }

    // Kullanıcı tipi kontrolü (100 = ADMIN)
    if ((int)$kullanici['kullanicitipi'] !== 100) {
        error('Bu kullanıcı türü giriş yapamaz. Sadece admin kullanıcıları giriş yapabilir.', 403);
    }

    // Şifre kontrolü
    // Önce hash'lenmiş şifre kontrolü yap, yoksa düz metin karşılaştır
    $passwordValid = false;

    if (strpos($kullanici['kullanicisifre'], '$2y$') === 0) {
        // Şifre hash'lenmiş (bcrypt ile başlıyor)
        $passwordValid = password_verify($sifre, $kullanici['kullanicisifre']);
    } else {
        // Şifre düz metin (eski sistem)
        $passwordValid = ($kullanici['kullanicisifre'] === $sifre);
    }

    if (!$passwordValid) {
        error('Kullanıcı adı veya şifre hatalı', 401);
    }

    // Access Token oluştur (15 dakika)
    $accessTokenPayload = [
        'kullaniciadi' => $kullanici['kullaniciadi'],
        'firmaid' => (int)$kullanici['firmaid'],
        'subeid' => (int)$kullanici['subeid'],
        'kullaniciid' => (int)$kullanici['id'],
        'kullanicitipi' => (int)$kullanici['kullanicitipi']
    ];

    $accessToken = createAccessToken($accessTokenPayload);

    // Refresh Token oluştur (30 gün)
    $refreshToken = createRefreshToken((int)$kullanici['id']);

    // Refresh token'ı veritabanına kaydet
    dbUpdate('kullanici', [
        'token' => $refreshToken, // Refresh token veritabanında
        'songiris' => date('Y-m-d H:i:s'),
        'kayitipadresi' => $_SERVER['REMOTE_ADDR'] ?? ''
    ], [
        'id' => $kullanici['id']
    ]);

    // Refresh token'ı HTTP-Only cookie olarak ayarla
    setRefreshTokenCookie($refreshToken, 30);

    // Başarılı response - Sadece access token döndür
    // Refresh token cookie'de, frontend görmez (güvenlik)
    success([
        'accessToken' => $accessToken
    ], 200);

} catch (Exception $e) {
    error('Bir hata oluştu: ' . $e->getMessage(), 500);
}
