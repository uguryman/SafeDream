<?php
/**
 * Binance Testnet Bakiye Endpoint
 * GET /api/testnet-balance.php
 *
 * Testnet hesap bakiyesini getirir
 */

require_once __DIR__ . '/../core/bootstrap.php';
require_once __DIR__ . '/helper.php';

// JWT token kontrolü
requireAuth();

try {
    // Testnet bakiyesini getir
    $accountData = getTestnetBalance();

    // Bakiye verilerini düzenle
    $balances = [];
    if (isset($accountData['balances']) && is_array($accountData['balances'])) {
        foreach ($accountData['balances'] as $balance) {
            $free = floatval($balance['free'] ?? 0);
            $locked = floatval($balance['locked'] ?? 0);
            $total = $free + $locked;

            // Sadece bakiyesi olan coinleri döndür
            if ($total > 0) {
                $balances[] = [
                    'asset' => $balance['asset'],
                    'free' => $free,
                    'locked' => $locked,
                    'total' => $total
                ];
            }
        }
    }

    success([
        'balances' => $balances,
        'totalAssets' => count($balances),
        'canTrade' => $accountData['canTrade'] ?? false,
        'canWithdraw' => $accountData['canWithdraw'] ?? false,
        'canDeposit' => $accountData['canDeposit'] ?? false,
        'updateTime' => $accountData['updateTime'] ?? null,
    ]);

} catch (Exception $e) {
    error($e->getMessage(), 500);
}
