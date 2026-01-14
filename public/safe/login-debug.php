<?php
/**
 * Login Debug - Hatayı bulmak için
 */

// Hataları göster
error_reporting(E_ALL);
ini_set('display_errors', 1);

// CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json; charset=utf-8');

// OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$debug = [
    'step' => 'başlangıç',
    'errors' => [],
    'info' => []
];

try {
    $debug['step'] = 'require files';

    // 1. Config yükle
    $debug['info'][] = 'Loading config.php...';
    require_once __DIR__ . '/core/config.php';
    $debug['info'][] = 'Config loaded OK';

    // 2. Response yükle
    $debug['info'][] = 'Loading response.php...';
    require_once __DIR__ . '/core/response.php';
    $debug['info'][] = 'Response loaded OK';

    // 3. Functions yükle
    $debug['info'][] = 'Loading functions.php...';
    require_once __DIR__ . '/core/functions.php';
    $debug['info'][] = 'Functions loaded OK';

    // 4. JWT yükle
    $debug['info'][] = 'Loading jwt.php...';
    require_once __DIR__ . '/core/jwt.php';
    $debug['info'][] = 'JWT loaded OK';

    $debug['step'] = 'method check';

    // Method kontrolü
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
            'success' => false,
            'message' => 'Sadece POST metodu kabul edilir',
            'debug' => $debug
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $debug['step'] = 'get input';

    // JSON input al
    $rawInput = file_get_contents('php://input');
    $debug['info'][] = 'Raw input: ' . substr($rawInput, 0, 100);

    $input = json_decode($rawInput, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        $debug['errors'][] = 'JSON parse error: ' . json_last_error_msg();
    }

    $debug['step'] = 'validate input';

    // Validasyon
    if (empty($input['kullaniciadi'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Kullanıcı adı gerekli',
            'debug' => $debug
        ], JSON_PRETTY_PRINT);
        exit;
    }

    if (empty($input['sifre'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Şifre gerekli',
            'debug' => $debug
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $kullaniciadi = trim($input['kullaniciadi']);
    $sifre = trim($input['sifre']);

    $debug['info'][] = 'Kullanıcı adı: ' . $kullaniciadi;
    $debug['step'] = 'database query';

    // Veritabanından kullanıcıyı bul
    $debug['info'][] = 'Calling dbSelectOne...';
    $kullanici = dbSelectOne('kullanici', [
        'kullaniciadi' => $kullaniciadi,
        'aktif' => 1
    ]);

    $debug['info'][] = 'Query completed';
    $debug['info'][] = 'User found: ' . ($kullanici ? 'YES' : 'NO');

    $debug['step'] = 'user check';

    // Kullanıcı bulunamadı
    if (!$kullanici) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Kullanıcı adı veya şifre hatalı',
            'debug' => $debug
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $debug['step'] = 'user type check';
    $debug['info'][] = 'Kullanıcı tipi: ' . $kullanici['kullanicitipi'];

    // Kullanıcı tipi kontrolü
    if ((int)$kullanici['kullanicitipi'] !== 100) {
        http_response_code(403);
        echo json_encode([
            'success' => false,
            'message' => 'Bu kullanıcı türü giriş yapamaz. Sadece admin kullanıcıları giriş yapabilir.',
            'debug' => $debug
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $debug['step'] = 'password check';

    // Şifre kontrolü
    $passwordValid = false;

    if (strpos($kullanici['kullanicisifre'], '$2y$') === 0) {
        $debug['info'][] = 'Password type: HASHED (bcrypt)';
        $passwordValid = password_verify($sifre, $kullanici['kullanicisifre']);
    } else {
        $debug['info'][] = 'Password type: PLAIN TEXT';
        $passwordValid = ($kullanici['kullanicisifre'] === $sifre);
    }

    $debug['info'][] = 'Password valid: ' . ($passwordValid ? 'YES' : 'NO');

    if (!$passwordValid) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Kullanıcı adı veya şifre hatalı',
            'debug' => $debug
        ], JSON_PRETTY_PRINT);
        exit;
    }

    $debug['step'] = 'create jwt';
    $debug['info'][] = 'Creating JWT token...';

    // JWT Token oluştur
    $jwtPayload = [
        'kullaniciadi' => $kullanici['kullaniciadi'],
        'firmaid' => (int)$kullanici['firmaid'],
        'subeid' => (int)$kullanici['subeid'],
        'kullaniciid' => (int)$kullanici['id'],
        'kullanicitipi' => (int)$kullanici['kullanicitipi']
    ];

    $jwtToken = createJWT($jwtPayload, 24);
    $debug['info'][] = 'JWT created: ' . substr($jwtToken, 0, 20) . '...';

    $debug['step'] = 'generate secure token';

    // Güvenli token
    $secureToken = generateSecureToken(32);
    $debug['info'][] = 'Secure token generated';

    $debug['step'] = 'update database';
    $debug['info'][] = 'Updating user record...';

    // Token'ı veritabanına kaydet
    dbUpdate('kullanici', [
        'token' => $secureToken,
        'songiris' => date('Y-m-d H:i:s'),
        'kayitipadresi' => $_SERVER['REMOTE_ADDR'] ?? ''
    ], [
        'id' => $kullanici['id']
    ]);

    $debug['info'][] = 'Database updated';
    $debug['step'] = 'success';

    // Başarılı response
    http_response_code(200);
    echo json_encode([
        'success' => true,
        'data' => [
            'token' => $jwtToken
        ],
        'debug' => $debug
    ], JSON_PRETTY_PRINT);

} catch (Exception $e) {
    $debug['step'] = 'EXCEPTION';
    $debug['errors'][] = 'Exception: ' . $e->getMessage();
    $debug['errors'][] = 'File: ' . $e->getFile();
    $debug['errors'][] = 'Line: ' . $e->getLine();
    $debug['errors'][] = 'Trace: ' . $e->getTraceAsString();

    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Bir hata oluştu: ' . $e->getMessage(),
        'debug' => $debug
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
}
