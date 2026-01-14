<?php
/**
 * Binance Testnet Bakiye Endpoint
 * GET /safe/testnet/balance.php
 */

require_once __DIR__ . '/../public/api/core/bootstrap.php';
require_once __DIR__ . '/helper.php';

requireAuth();

try {
    $accountData = getTestnetBalance();

    $balances = [];
    if (isset($accountData['balances']) && is_array($accountData['balances'])) {
        foreach ($accountData['balances'] as $balance) {
            $free = floatval($balance['free'] ?? 0);
            $locked = floatval($balance['locked'] ?? 0);
            $total = $free + $locked;

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
