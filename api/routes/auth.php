<?php
// ============================================================
//  routes/auth.php — Authentication Operations
//
//  POST ?action=login         — login user
//  POST ?action=register      — register new user
// ============================================================

// Login
if ($method === 'POST' && $action === 'login') {
    $body = getRequestBody();

    if (!isset($body['login']) || !isset($body['password'])) {
        respond(400, ['error' => 'Login and password are required']);
    }

    $login = clean($body['login']);
    $password = $body['password'];

    if (!$login || !$password) {
        respond(400, ['error' => 'Login and password are required']);
    }

    $stmt = $db->prepare(
        'SELECT ID, Password, `First Name` AS firstName, `Last Name` AS lastName, Admin, Enabled
         FROM Users
         WHERE Login = :login
         LIMIT 1'
    );
    $stmt->execute([':login' => $login]);

    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['Password'])) {
        if (!$user['Enabled']) {
            respond(403, ['error' => 'User account is disabled']);
        }
        respond(200, [
            'id'        => (int) $user['ID'],
            'firstName' => $user['firstName'],
            'lastName'  => $user['lastName'],
            'admin'      => (int) $user['Admin'],
            'enabled'   => (int) $user['Enabled'],
            'token'     => (string) $user['ID']
        ]);
    } else {
        respond(401, ['error' => 'Invalid login or password']);
    }
}


// Registration
if ($method === 'POST' && $action === 'register') {
    $body = getRequestBody();

    if (!isset($body['login']) || !isset($body['password']) 
        || !isset($body['firstName']) || !isset($body['lastName']))
    {
        respond(400, ['error' => 'All fields are required for registration']);
    }

    $login = clean($body['login']);
    $password = $body['password'];
    $firstName = checkName($body['firstName']);
    $lastName = checkName($body['lastName']);

    if (!$login || !$password || !$firstName || !$lastName) {
        respond(400, ['error' => 'Invalid registration data']);
    }

    // Check if the login already exists
    $stmt = $db->prepare('SELECT ID FROM Users WHERE Login = :login LIMIT 1');
    $stmt->execute([':login' => $login]);

    if ($stmt->fetch()) {
        respond(409, ['error' => 'Login already exists']);
    }

    // Hash password
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {        
        $stmt = $db->prepare(
            'INSERT INTO Users (Login, Password, `First Name`, `Last Name`, Admin, Enabled)
             VALUES (:login, :pass, :firstName, :lastName, :admin, :enabled)'
        );

        $stmt->execute([
            ':login'     => $login,
            ':pass'      => $passwordHash,
            ':firstName' => $firstName,
            ':lastName'  => $lastName,
            ':admin'      => 0,
            ':enabled'   => 1
        ]);

        respond(201, [
            'id'      => (int) $db->lastInsertId(),
            'message' => 'User registered successfully'
        ]);
    } catch (PDOException $e) {
        error_log('DB error: ' . $e->getMessage());
        respond(500, ['error' => 'Database error']);
    }
}
