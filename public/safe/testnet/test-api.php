<?php
/**
 * Binance Demo Trading API Test
 * Bu dosya API anahtarlarının çalışıp çalışmadığını test eder
 */

require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/helper.php';

header('Content-Type: application/json; charset=utf-8');

try {
    echo "🔍 Binance Demo Trading API Test\n\n";

    echo "1️⃣ API Anahtarları kontrol ediliyor...\n";
    $apiKey = $_ENV['BINANCE_TEST_API_KEY'] ?? '';
    $secretKey = $_ENV['BINANCE_TEST_SECRET_KEY'] ?? '';

    if (empty($apiKey) || empty($secretKey)) {
        throw new Exception('❌ API anahtarları .env dosyasında bulunamadı!');
    }

    echo "   ✅ API Key: " . substr($apiKey, 0, 10) . "...\n";
    echo "   ✅ Secret Key: " . substr($secretKey, 0, 10) . "...\n\n";

    echo "2️⃣ Binance API bağlantısı test ediliyor...\n";
    echo "   Base URL: https://testnet.binance.vision\n\n";

    echo "3️⃣ Hesap bakiyesi çekiliyor...\n";
    $balance = getTestnetBalance();

    echo "   ✅ Başarılı! Hesap bilgileri alındı.\n";
    echo "   📊 Can Trade: " . ($balance['canTrade'] ? 'Yes' : 'No') . "\n";
    echo "   📊 Can Withdraw: " . ($balance['canWithdraw'] ? 'Yes' : 'No') . "\n";
    echo "   📊 Can Deposit: " . ($balance['canDeposit'] ? 'Yes' : 'No') . "\n";
    echo "   📊 Toplam Varlık Sayısı: " . count($balance['balances']) . "\n\n";

    echo "4️⃣ Bakiyesi olan coin'ler:\n";
    foreach ($balance['balances'] as $item) {
        $total = floatval($item['free']) + floatval($item['locked']);
        if ($total > 0) {
            echo "   💰 {$item['asset']}: {$total} (Free: {$item['free']}, Locked: {$item['locked']})\n";
        }
    }

    echo "\n✅ TÜM TESTLER BAŞARILI!\n";
    echo "🎉 API anahtarları doğru çalışıyor.\n";

} catch (Exception $e) {
    echo "\n❌ HATA: " . $e->getMessage() . "\n";
    echo "📝 Detay: " . $e->getTraceAsString() . "\n";
}
