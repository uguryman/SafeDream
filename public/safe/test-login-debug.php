<?php
/**
 * Login Debug Test
 * Login endpoint'indeki hatayı bulmak için debug scripti
 */

// Hataları göster
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "=== LOGIN DEBUG TEST ===\n\n";

// 1. .env dosyası kontrolü
echo "1. .env dosyası kontrolü:\n";
$envPath = __DIR__ . '/.env';
if (file_exists($envPath)) {
    echo "✅ .env dosyası mevcut: $envPath\n";
} else {
    echo "❌ .env dosyası bulunamadı: $envPath\n";
}
echo "\n";

// 2. Config dosyası yükleme
echo "2. Config dosyası yükleniyor:\n";
try {
    require_once __DIR__ . '/core/config.php';
    echo "✅ Config dosyası yüklendi\n";
    echo "   DB_HOST: " . (defined('DB_HOST') ? DB_HOST : 'TANIMLI DEĞİL') . "\n";
    echo "   DB_NAME: " . (defined('DB_NAME') ? DB_NAME : 'TANIMLI DEĞİL') . "\n";
    echo "   DB_USER: " . (defined('DB_USER') ? DB_USER : 'TANIMLI DEĞİL') . "\n";
} catch (Exception $e) {
    echo "❌ Config dosyası hatası: " . $e->getMessage() . "\n";
    exit;
}
echo "\n";

// 3. Veritabanı bağlantısı
echo "3. Veritabanı bağlantısı test ediliyor:\n";
try {
    $pdo = getDbConnection();
    echo "✅ Veritabanı bağlantısı başarılı\n";
} catch (Exception $e) {
    echo "❌ Veritabanı bağlantı hatası: " . $e->getMessage() . "\n";
    exit;
}
echo "\n";

// 4. Functions dosyası
echo "4. Functions dosyası yükleniyor:\n";
try {
    require_once __DIR__ . '/core/functions.php';
    echo "✅ Functions dosyası yüklendi\n";
} catch (Exception $e) {
    echo "❌ Functions dosyası hatası: " . $e->getMessage() . "\n";
    exit;
}
echo "\n";

// 5. JWT dosyası
echo "5. JWT dosyası yükleniyor:\n";
try {
    require_once __DIR__ . '/core/jwt.php';
    echo "✅ JWT dosyası yüklendi\n";
    echo "   JWT_SECRET: " . (isset($_ENV['JWT_SECRET']) ? 'MEVCUT' : 'YOK') . "\n";
} catch (Exception $e) {
    echo "❌ JWT dosyası hatası: " . $e->getMessage() . "\n";
    exit;
}
echo "\n";

// 6. Response dosyası
echo "6. Response dosyası yükleniyor:\n";
try {
    require_once __DIR__ . '/core/response.php';
    echo "✅ Response dosyası yüklendi\n";
} catch (Exception $e) {
    echo "❌ Response dosyası hatası: " . $e->getMessage() . "\n";
    exit;
}
echo "\n";

// 7. Kullanıcı tablosu kontrolü
echo "7. Kullanıcı tablosu kontrolü:\n";
try {
    $users = dbSelect('kullanici', ['aktif' => 1], 'id, kullaniciadi, kullanicitipi', '', 5);
    echo "✅ Kullanıcı tablosu okunabilir\n";
    echo "   Toplam aktif kullanıcı sayısı: " . count($users) . "\n";
    if (count($users) > 0) {
        echo "   İlk kullanıcı: " . $users[0]['kullaniciadi'] . " (tip: " . $users[0]['kullanicitipi'] . ")\n";
    }
} catch (Exception $e) {
    echo "❌ Kullanıcı tablosu hatası: " . $e->getMessage() . "\n";
}
echo "\n";

// 8. Test login denemesi
echo "8. Test login verisi parse etme:\n";
$testData = json_encode(['kullaniciadi' => 'test@test.com', 'sifre' => '123456']);
echo "   Test JSON: $testData\n";
$parsed = json_decode($testData, true);
if ($parsed) {
    echo "✅ JSON parse edilebilir\n";
    echo "   kullaniciadi: " . $parsed['kullaniciadi'] . "\n";
    echo "   sifre: " . $parsed['sifre'] . "\n";
} else {
    echo "❌ JSON parse edilemedi\n";
}
echo "\n";

echo "=== TÜM TESTLER TAMAMLANDI ===\n";
echo "\nŞimdi gerçek login.php endpoint'ini test edebilirsiniz.\n";
