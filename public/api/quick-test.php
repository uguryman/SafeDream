<?php
/**
 * Hızlı Test - Hangi adımda hata veriyor?
 */
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$steps = [];

// 1. PHP çalışıyor mu?
$steps[] = "✅ PHP çalışıyor";

// 2. vendor/autoload.php var mı?
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    $steps[] = "✅ vendor/autoload.php mevcut";
    require_once __DIR__ . '/vendor/autoload.php';
} else {
    $steps[] = "❌ vendor/autoload.php YOK - composer install çalıştırın!";
    echo json_encode(['success' => false, 'steps' => $steps, 'error' => 'composer install gerekli']);
    exit;
}

// 3. .env dosyası var mı?
if (file_exists(__DIR__ . '/.env')) {
    $steps[] = "✅ .env dosyası mevcut";
} else {
    $steps[] = "❌ .env dosyası YOK";
    echo json_encode(['success' => false, 'steps' => $steps, 'error' => '.env dosyası bulunamadı']);
    exit;
}

// 4. Config yüklenebiliyor mu?
try {
    require_once __DIR__ . '/core/config.php';
    $steps[] = "✅ Config yüklendi";
} catch (Exception $e) {
    $steps[] = "❌ Config hatası: " . $e->getMessage();
    echo json_encode(['success' => false, 'steps' => $steps, 'error' => $e->getMessage()]);
    exit;
}

// 5. Veritabanı bağlantısı var mı?
try {
    $pdo = getDbConnection();
    $steps[] = "✅ Veritabanı bağlantısı başarılı";
} catch (Exception $e) {
    $steps[] = "❌ Veritabanı hatası: " . $e->getMessage();
    echo json_encode(['success' => false, 'steps' => $steps, 'error' => $e->getMessage()]);
    exit;
}

// 6. JWT kütüphanesi yüklü mü?
try {
    require_once __DIR__ . '/core/jwt.php';
    $steps[] = "✅ JWT kütüphanesi yüklü";

    // Test token oluştur
    $testToken = createAccessToken(['test' => 'data']);
    $steps[] = "✅ JWT token oluşturuldu";
} catch (Exception $e) {
    $steps[] = "❌ JWT hatası: " . $e->getMessage();
    echo json_encode(['success' => false, 'steps' => $steps, 'error' => $e->getMessage()]);
    exit;
}

// 7. Functions yüklü mü?
try {
    require_once __DIR__ . '/core/functions.php';
    $steps[] = "✅ Functions yüklü";
} catch (Exception $e) {
    $steps[] = "❌ Functions hatası: " . $e->getMessage();
    echo json_encode(['success' => false, 'steps' => $steps, 'error' => $e->getMessage()]);
    exit;
}

// 8. Kullanıcı tablosu okunabiliyor mu?
try {
    $users = dbSelect('kullanici', ['aktif' => 1], 'id, kullaniciadi', '', 1);
    $steps[] = "✅ Kullanıcı tablosu okunabilir (Toplam: " . count($users) . ")";
} catch (Exception $e) {
    $steps[] = "❌ Kullanıcı tablosu hatası: " . $e->getMessage();
    echo json_encode(['success' => false, 'steps' => $steps, 'error' => $e->getMessage()]);
    exit;
}

// Tüm testler başarılı!
echo json_encode([
    'success' => true,
    'message' => 'Tüm testler başarılı! Login endpoint çalışmalı.',
    'steps' => $steps
], JSON_PRETTY_PRINT);
