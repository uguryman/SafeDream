<?php
/**
 * DNS Yapılandırma ve IP Çözümleme Testi
 */

header('Content-Type: application/json');

$results = [
    'timestamp' => date('Y-m-d H:i:s'),
    'server_dns_config' => [],
    'manual_ip_lookup' => [],
    'dns_test' => [],
];

// 1. Sunucu DNS ayarlarını kontrol et
if (function_exists('shell_exec')) {
    // Linux/Unix sistemlerde
    $resolvConf = @file_get_contents('/etc/resolv.conf');
    $results['server_dns_config']['resolv_conf'] = $resolvConf ?: 'Okunamadı';

    // DNS test
    $results['server_dns_config']['nslookup_test'] = shell_exec('nslookup api.binance.tr 2>&1') ?: 'Çalıştırılamadı';
} else {
    $results['server_dns_config']['note'] = 'shell_exec devre dışı';
}

// 2. PHP DNS fonksiyonlarını test et
$domains = [
    'api.binance.tr',
    'www.binance.tr',
    'api.binance.com',
    'google.com', // Genel test
];

foreach ($domains as $domain) {
    // gethostbyname
    $ip = @gethostbyname($domain);
    $resolved = ($ip !== $domain);

    // dns_get_record
    $records = @dns_get_record($domain, DNS_A);

    $results['dns_test'][$domain] = [
        'gethostbyname' => [
            'result' => $ip,
            'resolved' => $resolved,
        ],
        'dns_get_record' => [
            'count' => count($records),
            'ips' => $records ? array_column($records, 'ip') : [],
        ],
        'checkdnsrr' => @checkdnsrr($domain, 'A'),
    ];
}

// 3. Bilinen public DNS serverları ile test
$publicDNS = [
    '8.8.8.8' => 'Google DNS',
    '1.1.1.1' => 'Cloudflare DNS',
    '208.67.222.222' => 'OpenDNS',
];

foreach ($publicDNS as $dnsIP => $dnsName) {
    if (function_exists('shell_exec')) {
        $cmd = "nslookup api.binance.tr $dnsIP 2>&1";
        $output = shell_exec($cmd);
        $results['manual_ip_lookup'][$dnsName] = [
            'dns_server' => $dnsIP,
            'output' => $output ?: 'Çalıştırılamadı'
        ];
    }
}

// 4. cURL DNS server override test (PHP 7.3+)
$curlTest = [];
$testDomains = ['api.binance.tr', 'api.binance.com'];

foreach ($testDomains as $domain) {
    foreach ($publicDNS as $dnsIP => $dnsName) {
        $ch = curl_init("https://$domain/api/v3/time");
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_DNS_SERVERS, $dnsIP);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $curlTest[$domain][$dnsName] = [
            'dns_server' => $dnsIP,
            'success' => ($httpCode == 200 && !$error),
            'http_code' => $httpCode,
            'error' => $error ?: null,
            'response_preview' => $response ? substr($response, 0, 100) : null,
        ];
    }
}

$results['curl_with_custom_dns'] = $curlTest;

// 5. Recommendation
$recommendations = [];
$recommendations[] = "PHP Version: " . PHP_VERSION;
$recommendations[] = "cURL Version: " . (curl_version()['version'] ?? 'Unknown');

// Google test sonucu
if ($results['dns_test']['google.com']['gethostbyname']['resolved']) {
    $recommendations[] = "✅ Google.com çözümlendi - Genel DNS çalışıyor";
} else {
    $recommendations[] = "❌ Google.com bile çözümlenemiyor - DNS tamamen kapalı!";
}

// Binance test
if (!$results['dns_test']['api.binance.tr']['gethostbyname']['resolved']) {
    $recommendations[] = "❌ api.binance.tr çözümlenemiyor";
    $recommendations[] = "💡 Çözüm 1: Hosting sağlayıcınızdan DNS ayarlarını kontrol ettirin";
    $recommendations[] = "💡 Çözüm 2: cURL DNS_SERVERS seçeneği ile custom DNS kullanın";
    $recommendations[] = "💡 Çözüm 3: IP adresi ile direkt bağlantı kurun (Host header ile)";
}

// Custom DNS başarılı mı?
$customDNSWorks = false;
foreach ($curlTest as $domain => $dnsTests) {
    foreach ($dnsTests as $dnsName => $result) {
        if ($result['success']) {
            $customDNSWorks = true;
            $recommendations[] = "✅ Custom DNS çalıştı: $domain ile $dnsName ($result[dns_server])";
            break 2;
        }
    }
}

if (!$customDNSWorks && function_exists('curl_setopt')) {
    $curlVersion = curl_version();
    if (version_compare($curlVersion['version'], '7.24.0', '<')) {
        $recommendations[] = "⚠️ cURL versiyonu eski (${curlVersion['version']}) - CURLOPT_DNS_SERVERS desteklenmiyor";
    }
}

$results['recommendations'] = $recommendations;

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
