<?php
/**
 * Profile Endpoint (Örnek Korumalı Endpoint)
 * Kullanıcı profilini döndürür - Token gerektirir
 *
 * Method: GET
 * Headers: Authorization: Bearer {token}
 */

require_once __DIR__ . '/core/middleware.php';
require_once __DIR__ . '/core/response.php';

setCorsHeaders();
checkMethod('GET');

try {
    // Token doğrulama
    $user = authenticate();

    // Kullanıcı bilgilerini veritabanından çek
    $kullanici = dbSelectOne('kullanici', [
        'id' => $user->kullaniciid,
        'aktif' => 1
    ]);

    if (!$kullanici) {
        error('Kullanıcı bulunamadı', 404);
    }

    // Hassas bilgileri çıkar
    unset($kullanici['kullanicisifre']);
    unset($kullanici['token']);

    // Başarılı response
    success([
        'kullanici' => $kullanici,
        'jwt_data' => [
            'kullaniciadi' => $user->kullaniciadi,
            'firmaid' => $user->firmaid,
            'subeid' => $user->subeid,
            'kullanicitipi' => $user->kullanicitipi
        ]
    ], 200);

} catch (Exception $e) {
    error('Bir hata oluştu: ' . $e->getMessage(), 500);
}
