<?php
// ============================================================
//  api/index.php — Unified Colors Manager RESTful API
//
//  GET    /api/index.php?ping=1   — status ping health check
//  POST   /api/index.php?action=login  — authenticate user
//  POST   /api/index.php?action=register  — register new user
// ============================================================
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';


setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$db     = getDB();

// 1. Unauthenticated Health Check (Ping)
if ($method === 'GET' && (isset($_GET['ping']) || (isset($_GET['action']) && $_GET['action'] === 'ping'))) {
    respond(200, ['status' => 'OK', 'timestamp' => time()]);
}

// 2. Unauthenticated Login (POST with login & password in body)
if ($method === 'POST' && $action === 'login') {
    $body = getRequestBody();
    if (isset($body['login']) && isset($body['password'])) {
        $login    = clean($body['login']);
        $password = clean($body['password']);

        if (!$login || !$password) {
            respond(400, ['error' => 'Login and password are required']);
        }

        $stmt = $db->prepare('SELECT ID, `First Name` AS firstName, `Last Name` AS lastName 
                              FROM Users 
                              WHERE Login = :login AND Password = :pass 
                              LIMIT 1');
        $stmt->execute([':login' => $login, ':pass' => $password]);
        $user = $stmt->fetch();

        if ($user) {
            respond(200, [
                'id'        => (int) $user['ID'],
                'firstName' => $user['firstName'],
                'lastName'  => $user['lastName'],
                'token'     => (string) $user['ID'],
                'error'     => ''
            ]);
        } else {
            respond(401, [
                'id'        => 0,
                'firstName' => '',
                'lastName'  => '',
                'error'     => 'No Records Found'
            ]);
        }
    }
}

// 3. Unauthenticated Registration (POST with user details in body)
if ($method === 'POST' && $action === 'register') {
    $body = getRequestBody();
    if (isset($body['login']) && isset($body['password']) && isset($body['firstName']) && isset($body['lastName'])) {
        $login     = clean($body['login']);
        $password  = clean($body['password']);
        $firstName = clean($body['firstName']);
        $lastName  = clean($body['lastName']);

        if (!$login || !$password || !$firstName || !$lastName) {
            respond(400, ['error' => 'All fields are required for registration']);
        }

        // Check if the login already exists
        $stmt = $db->prepare('SELECT ID FROM Users WHERE Login = :login LIMIT 1');
        $stmt->execute([':login' => $login]);
        if ($stmt->fetch()) {
            respond(409, ['error' => 'Login already exists']);
        }

        // Insert new user
        $stmt = $db->prepare('INSERT INTO Users (Login, Password, `First Name`, `Last Name`) 
                              VALUES (:login, :pass, :firstName, :lastName)');
        try {
            $stmt->execute([
                ':login'     => $login,
                ':pass'      => $password,
                ':firstName' => $firstName,
                ':lastName'  => $lastName
            ]);
            respond(201, ['id' => (int) $db->lastInsertId(),
                          'message' => 'User registered successfully',
                          'error' => '']);

        } catch (PDOException $e) {
            respond(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }
    }
}
// Everything BELOW this point requires authentication
requireAuth();
