<?php
/**
 * Ortak Response Fonksiyonu
 * Tüm API yanıtları bu fonksiyon üzerinden döndürülür
 */

/**
 * API Response döndürür
 *
 * @param bool $success İşlem başarılı mı?
 * @param mixed $data Döndürülecek veri (success: true için)
 * @param string $message Hata mesajı (success: false için)
 * @param int $statusCode HTTP durum kodu
 */
function apiResponse($success, $data = null, $message = '', $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    $response = ['success' => $success];

    if ($success) {
        // Başarılı response
        if ($data !== null) {
            $response['data'] = $data;
        }
    } else {
        // Hata response
        $response['message'] = $message;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Başarılı response döndürür (kısa kullanım için)
 *
 * @param mixed $data Döndürülecek veri
 * @param int $statusCode HTTP durum kodu (varsayılan: 200)
 */
function success($data = null, $statusCode = 200) {
    apiResponse(true, $data, '', $statusCode);
}

/**
 * Hata response döndürür (kısa kullanım için)
 *
 * @param string $message Hata mesajı
 * @param int $statusCode HTTP durum kodu (varsayılan: 400)
 */
function error($message, $statusCode = 400) {
    apiResponse(false, null, $message, $statusCode);
}
