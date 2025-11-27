<?php
/**
 * Basit Test Sayfası - Hiçbir bağımlılık yok
 */

// CORS
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json; charset=utf-8');

// Temel bilgiler
$testResults = [
    'success' => true,
    'message' => 'API çalışıyor!',
    'timestamp' => date('Y-m-d H:i:s'),
    'server_info' => [
        'php_version' => phpversion(),
        'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Bilinmiyor',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Bilinmiyor',
        'script_filename' => __FILE__,
        'current_directory' => __DIR__
    ],
    'tests' => []
];

// Test 1: PHP çalışıyor mu?
$testResults['tests']['php_working'] = [
    'status' => 'OK',
    'message' => 'PHP düzgün çalışıyor'
];

// Test 2: .env dosyası var mı?
$envPath = __DIR__ . '/.env';
$testResults['tests']['env_file'] = [
    'status' => file_exists($envPath) ? 'OK' : 'FAIL',
    'path' => $envPath,
    'exists' => file_exists($envPath),
    'readable' => file_exists($envPath) ? is_readable($envPath) : false
];

// Test 3: core klasörü var mı?
$corePath = __DIR__ . '/core';
$testResults['tests']['core_directory'] = [
    'status' => is_dir($corePath) ? 'OK' : 'FAIL',
    'path' => $corePath,
    'exists' => is_dir($corePath)
];

// Test 4: vendor klasörü var mı?
$vendorPath = __DIR__ . '/vendor';
$testResults['tests']['vendor_directory'] = [
    'status' => is_dir($vendorPath) ? 'OK' : 'FAIL',
    'path' => $vendorPath,
    'exists' => is_dir($vendorPath)
];

// Test 5: vendor/autoload.php var mı?
$autoloadPath = __DIR__ . '/vendor/autoload.php';
$testResults['tests']['vendor_autoload'] = [
    'status' => file_exists($autoloadPath) ? 'OK' : 'FAIL',
    'path' => $autoloadPath,
    'exists' => file_exists($autoloadPath),
    'readable' => file_exists($autoloadPath) ? is_readable($autoloadPath) : false
];

// Test 6: JSON extension var mı?
$testResults['tests']['json_extension'] = [
    'status' => function_exists('json_encode') ? 'OK' : 'FAIL',
    'available' => function_exists('json_encode')
];

// Test 7: PDO extension var mı?
$testResults['tests']['pdo_extension'] = [
    'status' => class_exists('PDO') ? 'OK' : 'FAIL',
    'available' => class_exists('PDO')
];

// Test 8: POST data alınabiliyor mu?
$input = file_get_contents('php://input');
$testResults['tests']['post_input'] = [
    'status' => 'OK',
    'raw_input' => $input,
    'json_valid' => $input ? (json_decode($input) !== null) : false
];

// Test 9: Core dosyaları var mı?
$coreFiles = [
    'config.php',
    'response.php',
    'functions.php',
    'jwt.php',
    'middleware.php'
];

$testResults['tests']['core_files'] = [];
foreach ($coreFiles as $file) {
    $filePath = __DIR__ . '/core/' . $file;
    $testResults['tests']['core_files'][$file] = [
        'exists' => file_exists($filePath),
        'readable' => file_exists($filePath) ? is_readable($filePath) : false,
        'path' => $filePath
    ];
}

// Test 10: login.php var mı?
$loginPath = __DIR__ . '/login.php';
$testResults['tests']['login_file'] = [
    'status' => file_exists($loginPath) ? 'OK' : 'FAIL',
    'path' => $loginPath,
    'exists' => file_exists($loginPath),
    'readable' => file_exists($loginPath) ? is_readable($loginPath) : false
];

// Genel durum kontrolü
$allOk = true;
foreach ($testResults['tests'] as $testName => $testData) {
    if (is_array($testData) && isset($testData['status']) && $testData['status'] === 'FAIL') {
        $allOk = false;
        break;
    }
}

$testResults['overall_status'] = $allOk ? 'ALL_OK' : 'SOME_FAILED';
$testResults['ready_for_login'] = $allOk;

// Response
echo json_encode($testResults, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
