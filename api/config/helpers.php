<?php
// ============================================================
//  api/config/helpers.php — Utility & Helper Functions for API
// ============================================================

/**
 * Loads environment variables from a .env file into putenv, $_ENV, and $_SERVER.
 *
 * @param string|null $path Path to the .env file
 */
function loadEnv($path = null) {
    static $loaded = false;
    if ($loaded) {
        return;
    }

    if ($path === null) {
        $possiblePaths = [
            __DIR__ . '/../../.env',
            __DIR__ . '/../.env',
            __DIR__ . '/.env',
            (defined('ROOT_PATH') ? ROOT_PATH . '/.env' : null),
        ];
        foreach ($possiblePaths as $p) {
            if ($p && file_exists($p)) {
                $path = $p;
                break;
            }
        }
    }

    if ($path && file_exists($path)) {
        $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                list($name, $value) = explode('=', $line, 2);
                $name  = trim($name);
                $value = trim($value);

                // Strip surrounding quotes
                if ((str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                    (str_starts_with($value, "'") && str_ends_with($value, "'"))) {
                    $value = substr($value, 1, -1);
                }

                if (getenv($name) === false) {
                    putenv("{$name}={$value}");
                    $_ENV[$name] = $value;
                    $_SERVER[$name] = $value;
                }
            }
        }
    }
    $loaded = true;
}

// Automatically load environment variables
loadEnv();

/**
 * Sets standard CORS headers to allow cross-origin API requests.
 * Handles preflight OPTIONS requests by exiting with 200 OK.
 */
function setCORSHeaders() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-User-Id");

    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

/**
 * Sends a JSON response with the specified HTTP status code and terminates execution.
 *
 * @param int $statusCode HTTP status code (e.g. 200, 201, 400, 404, 405, 500)
 * @param mixed $data Data array or object to serialize as JSON
 */
function respond($statusCode, $data) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data);
    exit;
}

/**
 * Gets and decodes the JSON request body or falls back to $_POST input.
 *
 * @return array
 */
function getRequestBody() {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $decoded = json_decode($rawInput, true);
        if (is_array($decoded)) {
            return $decoded;
        }
    }
    return $_POST ?? [];
}

/**
 * Sanitizes input data by trimming whitespace and stripping HTML tags.
 *
 * @param mixed $data
 * @return mixed
 */
function clean($data) {
    if (is_string($data)) {
        return trim(strip_tags($data));
    }
    return $data;
}

/**
 * Requires authentication and returns the authenticated User ID.
 * Looks for user identification in headers, cookies, session, query parameters, or request body.
 * If unauthenticated, sends a 401 Unauthorized response and exits.
 *
 * @return int User ID
 */
function requireAuth() {
    $userId = null;

    // 1. Check Authorization header (raw numeric token)
    $authHeader = $_SERVER['HTTP_AUTHORIZATION']
        ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION']
        ?? (function_exists('apache_request_headers') ? (apache_request_headers()['Authorization'] ?? null) : null);

    if ($authHeader) {
        $token = trim(preg_replace('/^Bearer\s+/i', '', $authHeader));
        if (is_numeric($token) && (int) $token > 0) {
            $userId = (int) $token;
        }
    }

    // 2. Check X-User-Id or User-Id custom header
    if (!$userId) {
        $xUserId = $_SERVER['HTTP_X_USER_ID'] ?? $_SERVER['HTTP_USER_ID'] ?? null;
        if ($xUserId && is_numeric($xUserId) && (int) $xUserId > 0) {
            $userId = (int) $xUserId;
        }
    }

    if (!$userId || (int) $userId <= 0) {
        respond(401, ['error' => 'Unauthorized']);
    }

    return (int) $userId;
}

// 7. check name format
function checkName($name) {
    if (!$name || !is_string($name) || trim($name) === '') {
        respond(400, ['error' => 'Invalid name']);
    }
    return trim($name);
}

// 8. check email format

function checkEmail($email) {
    if (!$email || !is_string($email) || trim($email) === '' || !filter_var(trim($email), FILTER_VALIDATE_EMAIL)) 
    {
        respond(400, ['error' => 'Invalid email address']);
    }
    return trim($email);
}

// 9. check phone number format
function checkPhoneNumber($phoneNumber) {
    if (!$phoneNumber || !is_string($phoneNumber) || trim($phoneNumber) === '' || !preg_match('/^\+?[0-9]{10}$/', trim($phoneNumber))) {
        respond(400, ['error' => 'Invalid phone number, must be 10 digits.']);
    }
    return trim($phoneNumber);
}
