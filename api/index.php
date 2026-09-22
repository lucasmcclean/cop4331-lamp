<?php
// ============================================================
//  api/index.php — Unified Contacts Manager RESTful API
//
//  GET    /api/index.php?ping=1          — status ping health check
//  POST   /api/index.php?action=login    — authenticate user
//  POST   /api/index.php?action=register — register new user
//  GET    /api/index.php                 — list all contacts for user
//  GET    /api/index.php?q=term          — partial search contacts
//  POST   /api/index.php                 — create new contact
//  PUT    /api/index.php?id=1            — update contact by ID
//  DELETE /api/index.php?id=1            — delete contact by ID
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

    if (!isset($body['login']) || !isset($body['password'])) {
        respond(400, ['error' => 'Login and password are required']);
    }

    $login    = clean($body['login']);
    $password = $body['password'];

    if (!$login || !$password) {
        respond(400, ['error' => 'Login and password are required']);
    }

    $stmt = $db->prepare('SELECT ID, Password, `First Name` AS firstName, `Last Name` AS lastName 
                          FROM Users 
                          WHERE Login = :login 
                          LIMIT 1');

    $stmt->execute([
        ':login' => $login
    ]);

    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['Password'])) {
        respond(200, [
            'id'        => (int) $user['ID'],
            'firstName' => $user['firstName'],
            'lastName'  => $user['lastName'],
            'token'     => (string) $user['ID']
        ]);
    } else {
        respond(401, ['error'     => 'No Records Found']);
    }
}

// 3. Unauthenticated Registration (POST with user details in body)
if ($method === 'POST' && $action === 'register') {
    $body = getRequestBody();

    if (
        !isset($body['login']) ||
        !isset($body['password']) ||
        !isset($body['firstName']) ||
        !isset($body['lastName'])
    ) {
        respond(400, ['error' => 'All fields are required for registration']);
    }

    $login     = clean($body['login']);
    $password  = $body['password'];
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

    // Insert new user (`password_hash` uses bcrypt which already includes salt)
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $db->prepare('INSERT INTO Users (Login, Password, `First Name`, `Last Name`) 
                          VALUES (:login, :pass, :firstName, :lastName)');

    try {
        $stmt->execute([
            ':login'     => $login,
            ':pass'      => $passwordHash,
            ':firstName' => $firstName,
            ':lastName'  => $lastName
        ]);

        respond(201, [
            'id'      => (int) $db->lastInsertId(),
            'message' => 'User registered successfully',
        ]);
    } catch (PDOException $e) {
        respond(500, ['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// Everything BELOW this point requires authentication
$userId = requireAuth();

switch ($method) {

    // ── GET: search for contact ──────────────────
    case 'GET':
        $search = $_GET['q'] ?? '';
        $like = '%' . $search . '%';

        try {
            $stmt = $db->prepare(
                "SELECT ID AS id, `First Name` AS firstName, `Last Name` AS lastName,
                    `E-mail Address` AS email, `Phone Number` AS phoneNumber
                FROM Contacts WHERE UserID = :uid AND (
                    `First Name` LIKE :firstName
                    OR `Last Name` LIKE :lastName
                    OR `E-mail Address` LIKE :email
                    OR `Phone Number` LIKE :phoneNumber
                )"
            );

            $stmt->execute([
                ':uid'         => $userId,
                ':firstName'   => $like,
                ':lastName'    => $like,
                ':email'       => $like,
                ':phoneNumber' => $like
            ]);

            $contacts = $stmt->fetchAll();

            respond(200, ['contacts' => $contacts]);
        } catch (PDOException $e) {
            respond(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }

        break;
    // ── POST: create contact ───────────────────────────────────
    case 'POST':
        $body = getRequestBody();

        if (
            !isset($body['firstName']) ||
            !isset($body['lastName']) ||
            !isset($body['email']) ||
            !isset($body['phoneNumber'])
        ) {
            respond(400, ['error' => 'All fields are required to create a new contact']);
        }

        $firstName   = clean($body['firstName']);
        $lastName    = clean($body['lastName']);
        $email       = clean($body['email']);
        $phoneNumber = clean($body['phoneNumber']);

        if (!$firstName || !$lastName || !$phoneNumber || !$email) {
            respond(400, ['error' => 'All fields are required to create a new contact']);
        }

        try {
            // Check if the contact already exists
            $stmt = $db->prepare(
                'SELECT ID FROM Contacts WHERE `Phone Number` = :phoneNumber
                 AND `E-mail Address` = :email AND UserID = :userID
                 LIMIT 1'
            );

            $stmt->execute([
                ':phoneNumber' => $phoneNumber,
                ':email'       => $email,
                ':userID'      => $userId
            ]);

            if ($stmt->fetch()) {
                respond(409, ['error' => 'Another contact with the same phone number and email already exists']);
            }

            // Insert new contact
            $stmt = $db->prepare(
                'INSERT INTO Contacts
                 (`First Name`, `Last Name`, `E-mail Address`, `Phone Number`, UserID)
                 VALUES (:firstName, :lastName, :email, :phoneNumber, :userID)'
            );

            $stmt->execute([
                ':firstName'   => $firstName,
                ':lastName'    => $lastName,
                ':email'       => $email,
                ':phoneNumber' => $phoneNumber,
                ':userID'      => $userId
            ]);

            respond(201, [
                'id'      => (int) $db->lastInsertId(),
                'message' => 'Contact created successfully'
            ]);
        } catch (PDOException $e) {
            respond(500, ['error' => 'Database error: ' . $e->getMessage()]);
        }

        break;

    // ── PUT: update contact ────────────────────────────────────
    case 'PUT':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if (!$id) {
            respond(400, ['error' => 'Contact ID is required — use ?id=']);
        }

        $check = $db->prepare(
            'SELECT ID FROM Contacts WHERE ID = :id AND UserID = :uid LIMIT 1'
        );
        $check->execute([
            ':id' => $id,
            ':uid' => $userId
        ]);

        if (!$check->fetch()) {
            respond(404, ['error' => 'Contact not found']);
        }

        $body = getRequestBody();

        $firstName   = clean($body['firstName'] ?? '');
        $lastName    = clean($body['lastName'] ?? '');
        $phoneNumber = clean($body['phoneNumber'] ?? '');
        $email       = clean($body['email'] ?? '');

        if (!$firstName || !$lastName || !$phoneNumber || !$email) {
            respond(400, ['error' => 'All fields are required']);
        }

        $stmt = $db->prepare(
            "UPDATE Contacts
            SET `First Name` = :firstName,
                `Last Name` = :lastName,
                `Phone Number` = :phoneNumber,
                `E-mail Address` = :email
            WHERE ID = :id AND UserID = :uid"
        );

        $stmt->execute([
            ':firstName'   => $firstName,
            ':lastName'    => $lastName,
            ':phoneNumber' => $phoneNumber,
            ':email'       => $email,
            ':id'          => $id,
            ':uid'         => $userId
        ]);

        respond(200, ['message' => 'Contact updated']);
        break;

    // ── DELETE: delete contact ─────────────────────────────────
    case 'DELETE':
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if (!$id) {
            respond(400, ['error' => 'Contact ID is required — use ?id=']);
        }

        $stmt = $db->prepare(
            'DELETE FROM Contacts WHERE ID = :id AND UserID = :uid'
        );

        $stmt->execute([
            ':id'  => $id,
            ':uid' => $userId
        ]);

        if ($stmt->rowCount() === 0) {
            respond(404, ['error' => 'Contact not found']);
        }

        respond(200, ['message' => 'Contact deleted']);
        break;

    default:
        respond(405, ['error' => 'Method Not Allowed']);
}
