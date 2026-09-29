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
 * Starts the session used to identify the caller.
 * The cookie is HttpOnly so JavaScript cannot read it, and Secure over TLS.
 */
function startSession() {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }

    session_name('contacts_session');
    session_set_cookie_params([
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Lax',
    ]);

    session_start();
}

/**
 * Sets CORS headers, echoing back only known front-end origins.
 * Handles preflight OPTIONS requests by exiting with 200 OK.
 */
function setCORSHeaders() {
    $allowedOrigins = ['https://disc.quest', 'http://localhost', 'http://127.0.0.1'];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Access-Control-Allow-Credentials: true');
    }

    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, X-Requested-With");

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
 * Requires a valid session and returns the User ID.
 * The ID is read only from the server-side session, then re-checked against
 * the database so a disabled or deleted account loses access right away.
 */
function requireAuth() {
    $userId = (int) ($_SESSION['userId'] ?? 0);

    if (!$userId) {
        respond(401, ['error' => 'Unauthorized']);
    }

    $stmt = getDB()->prepare('SELECT ID FROM Users WHERE ID = :id AND Enabled = 1 LIMIT 1');
    $stmt->execute([':id' => $userId]);

    if (!$stmt->fetch()) {
        destroySession();
        respond(401, ['error' => 'Session is no longer valid']);
    }

    return $userId;
}

/**
 * Clears the session data.
 */
function destroySession() {
    $_SESSION = [];
    session_destroy();
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
