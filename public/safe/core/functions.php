<?php
/**
 * Dinamik veritabanı fonksiyonları
 */

require_once __DIR__ . '/config.php';

/**
 * Dinamik INSERT işlemi yapar
 *
 * @param string $table Tablo adı
 * @param array $data Kolon adı => değer çiftleri ['name' => 'John', 'email' => 'john@example.com']
 * @return int Son eklenen kaydın ID'si
 * @throws Exception Hata durumunda
 */
function dbInsert($table, $data) {
    if (empty($data)) {
        throw new Exception("Eklenecek veri boş olamaz");
    }

    $pdo = getDbConnection();

    // Kolon adlarını ve placeholder'ları oluştur
    $columns = array_keys($data);
    $columnList = implode(', ', $columns);
    $placeholders = ':' . implode(', :', $columns);

    $sql = "INSERT INTO {$table} ({$columnList}) VALUES ({$placeholders})";

    try {
        $stmt = $pdo->prepare($sql);

        // Parametreleri bind et
        foreach ($data as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }

        $stmt->execute();
        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        throw new Exception("INSERT hatası: " . $e->getMessage());
    }
}

/**
 * Dinamik UPDATE işlemi yapar
 *
 * @param string $table Tablo adı
 * @param array $data Güncellenecek kolon adı => değer çiftleri
 * @param array $where WHERE koşulu ['id' => 1] veya ['email' => 'test@test.com']
 * @return int Etkilenen satır sayısı
 * @throws Exception Hata durumunda
 */
function dbUpdate($table, $data, $where) {
    if (empty($data)) {
        throw new Exception("Güncellenecek veri boş olamaz");
    }

    if (empty($where)) {
        throw new Exception("WHERE koşulu boş olamaz (güvenlik için)");
    }

    $pdo = getDbConnection();

    // SET kısmını oluştur
    $setParts = [];
    foreach ($data as $key => $value) {
        $setParts[] = "{$key} = :set_{$key}";
    }
    $setClause = implode(', ', $setParts);

    // WHERE kısmını oluştur
    $whereParts = [];
    foreach ($where as $key => $value) {
        $whereParts[] = "{$key} = :where_{$key}";
    }
    $whereClause = implode(' AND ', $whereParts);

    $sql = "UPDATE {$table} SET {$setClause} WHERE {$whereClause}";

    try {
        $stmt = $pdo->prepare($sql);

        // SET parametrelerini bind et
        foreach ($data as $key => $value) {
            $stmt->bindValue(':set_' . $key, $value);
        }

        // WHERE parametrelerini bind et
        foreach ($where as $key => $value) {
            $stmt->bindValue(':where_' . $key, $value);
        }

        $stmt->execute();
        return $stmt->rowCount();
    } catch (PDOException $e) {
        throw new Exception("UPDATE hatası: " . $e->getMessage());
    }
}

/**
 * Dinamik SELECT işlemi yapar
 *
 * @param string $table Tablo adı
 * @param array $where WHERE koşulu (opsiyonel) ['id' => 1]
 * @param string $columns Seçilecek kolonlar (varsayılan: *)
 * @param string $orderBy Sıralama (opsiyonel) örn: "id DESC"
 * @param int $limit Limit (opsiyonel)
 * @return array Sonuç dizisi
 * @throws Exception Hata durumunda
 */
function dbSelect($table, $where = [], $columns = '*', $orderBy = '', $limit = null) {
    $pdo = getDbConnection();

    $sql = "SELECT {$columns} FROM {$table}";

    // WHERE kısmı varsa ekle
    if (!empty($where)) {
        $whereParts = [];
        foreach ($where as $key => $value) {
            $whereParts[] = "{$key} = :{$key}";
        }
        $sql .= " WHERE " . implode(' AND ', $whereParts);
    }

    // ORDER BY ekle
    if (!empty($orderBy)) {
        $sql .= " ORDER BY {$orderBy}";
    }

    // LIMIT ekle
    if ($limit !== null) {
        $sql .= " LIMIT {$limit}";
    }

    try {
        $stmt = $pdo->prepare($sql);

        // WHERE parametrelerini bind et
        foreach ($where as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }

        $stmt->execute();
        return $stmt->fetchAll();
    } catch (PDOException $e) {
        throw new Exception("SELECT hatası: " . $e->getMessage());
    }
}

/**
 * Dinamik DELETE işlemi yapar
 *
 * @param string $table Tablo adı
 * @param array $where WHERE koşulu ['id' => 1]
 * @return int Etkilenen satır sayısı
 * @throws Exception Hata durumunda
 */
function dbDelete($table, $where) {
    if (empty($where)) {
        throw new Exception("WHERE koşulu boş olamaz (güvenlik için)");
    }

    $pdo = getDbConnection();

    // WHERE kısmını oluştur
    $whereParts = [];
    foreach ($where as $key => $value) {
        $whereParts[] = "{$key} = :{$key}";
    }
    $whereClause = implode(' AND ', $whereParts);

    $sql = "DELETE FROM {$table} WHERE {$whereClause}";

    try {
        $stmt = $pdo->prepare($sql);

        // WHERE parametrelerini bind et
        foreach ($where as $key => $value) {
            $stmt->bindValue(':' . $key, $value);
        }

        $stmt->execute();
        return $stmt->rowCount();
    } catch (PDOException $e) {
        throw new Exception("DELETE hatası: " . $e->getMessage());
    }
}

/**
 * Tek bir kayıt döndürür
 *
 * @param string $table Tablo adı
 * @param array $where WHERE koşulu
 * @param string $columns Seçilecek kolonlar (varsayılan: *)
 * @return array|null Tek bir kayıt veya null
 */
function dbSelectOne($table, $where, $columns = '*') {
    $results = dbSelect($table, $where, $columns, '', 1);
    return !empty($results) ? $results[0] : null;
}

/**
 * JSON başarı response döndürür
 *
 * @param mixed $data Döndürülecek veri
 * @param string $message Başarı mesajı
 * @param int $statusCode HTTP durum kodu (varsayılan: 200)
 */
function jsonSuccess($data = null, $message = 'İşlem başarılı', $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    $response = [
        'success' => true,
        'message' => $message,
        'data' => $data
    ];

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * JSON hata response döndürür
 *
 * @param string $message Hata mesajı
 * @param int $statusCode HTTP durum kodu (varsayılan: 400)
 * @param mixed $errors Detaylı hata bilgileri (opsiyonel)
 */
function jsonError($message = 'İşlem başarısız', $statusCode = 400, $errors = null) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');

    $response = [
        'success' => false,
        'message' => $message
    ];

    if ($errors !== null) {
        $response['errors'] = $errors;
    }

    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
