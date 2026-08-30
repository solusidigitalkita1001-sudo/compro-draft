<?php

declare(strict_types=1);

const RECIPIENT = 'solusidigitalkita1001@gmail.com';
const MAX_NAME_LENGTH = 100;
const MAX_PHONE_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 5000;

header('Content-Type: text/plain; charset=UTF-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('ERROR');
}

$requestHost = strtolower((string) ($_SERVER['HTTP_HOST'] ?? ''));
$expectedHost = preg_replace('/:\d+$/', '', $requestHost);
foreach (['HTTP_ORIGIN', 'HTTP_REFERER'] as $headerName) {
    if (empty($_SERVER[$headerName])) {
        continue;
    }

    $originHost = strtolower((string) parse_url($_SERVER[$headerName], PHP_URL_HOST));
    if ($originHost === '' || $expectedHost === '' || $originHost !== $expectedHost) {
        http_response_code(403);
        exit('ERROR');
    }
}

if (!empty($_POST['website'])) {
    http_response_code(400);
    exit('ERROR');
}

$name = trim((string) ($_POST['name'] ?? ''));
$email = trim((string) ($_POST['mail'] ?? ''));
$phone = trim((string) ($_POST['phone'] ?? ''));
$message = trim((string) ($_POST['message'] ?? ''));

if (
    $name === '' || strlen($name) > MAX_NAME_LENGTH ||
    !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254 ||
    $phone === '' || strlen($phone) > MAX_PHONE_LENGTH || !preg_match('/^[0-9+().\s-]+$/', $phone) ||
    $message === '' || strlen($message) > MAX_MESSAGE_LENGTH ||
    preg_match('/[\r\n]/', $name . $email . $phone)
) {
    http_response_code(400);
    exit('ERROR');
}

$rateFile = sys_get_temp_dir() . '/contact-' . hash('sha256', (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown'));
$rateHandle = @fopen($rateFile, 'c+');
if ($rateHandle !== false) {
    flock($rateHandle, LOCK_EX);
    $lastSubmission = (int) trim((string) stream_get_contents($rateHandle));
    if ($lastSubmission > time() - 60) {
        flock($rateHandle, LOCK_UN);
        fclose($rateHandle);
        http_response_code(429);
        exit('ERROR');
    }
    ftruncate($rateHandle, 0);
    rewind($rateHandle);
    fwrite($rateHandle, (string) time());
    fflush($rateHandle);
    flock($rateHandle, LOCK_UN);
    fclose($rateHandle);
}

$subject = 'Pesan kontak website';
$body = implode("\n", [
    'Pesan baru dari form kontak website',
    '',
    'Nama: ' . $name,
    'Email: ' . $email,
    'Telepon: ' . $phone,
    '',
    'Pesan:',
    $message,
]);
$headers = implode("\r\n", [
    'From: Website Contact <no-reply@' . $expectedHost . '>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
]);

if (mail(RECIPIENT, $subject, wordwrap($body, 70), $headers)) {
    exit('Success');
}

http_response_code(500);
exit('ERROR');
