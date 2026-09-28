<?php
// ============================================================
//  routes/admin.php — Admin Operations
//
//  GET  ?action=admin&operation=userSearch&q=term  — search users
//  GET  ?action=admin&operation=contactList&id=1   — view user's contacts
//  PUT  ?action=admin&operation=toggle&id=1        — enable/disable user
//  PUT  ?action=admin&operation=passwordUpdate&id=1 — change user password
//  POST ?action=admin                              — create User/Admin
// ============================================================

$operation = $_GET['operation'] ?? null;

// Verify user is an Admin
$stmt = $db->prepare('SELECT ID FROM Users WHERE ID = :id AND Admin = 1 AND Enabled = 1 LIMIT 1');
$stmt->execute([':id' => $userId]);

if (!$stmt->fetch()) {
    respond(403, ['error' => 'Admin access required']);
}


// GET: search users OR view a user's contacts
if ($method === 'GET') {

    // Search users
    if ($operation === 'userSearch') {
        $search = $_GET['q'] ?? '';
        $search = str_replace(['%', '_'], ['\\%', '\\_'], $search);
        $like = '%' . $search . '%';

        $sql = "SELECT ID AS id, `First Name` AS firstName, `Last Name` AS lastName,
                    Login AS login, Admin AS admin, Enabled AS enabled
                FROM Users WHERE ID != :self AND (`First Name` LIKE :firstName
                OR `Last Name` LIKE :lastName OR Login LIKE :login";

        $params = [':self' => $userId,':firstName' => $like, ':lastName' => $like, ':login' => $like];

        //if $search is an (int), add ID to sql and params to search for the user by ID as well
        if (is_numeric($search)) {
            $sql .= " OR ID = :id";
            $params[':id'] = (int) $search;
	}
	$sql .=")";

        try {
            $stmt = $db->prepare($sql);
            $stmt->execute($params);

            $users = $stmt->fetchAll();
            respond(200, ['users' => $users]);
        } catch (PDOException $e) {
            error_log('DB error: ' . $e->getMessage());
            respond(500, ['error' => 'Database error']);
        }
    }

    // View a specific user's contacts
    else if ($operation === 'contactList') {
        $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

        if (!$id) {
            respond(400, ['error' => 'User ID is required — use ?id=']);
        }

        $check = $db->prepare('SELECT ID FROM Users WHERE ID = :id LIMIT 1');
        $check->execute([':id' => $id]);

        if (!$check->fetch()) {
            respond(404, ['error' => 'User not found']);
        }

        try {
            $stmt = $db->prepare(
                "SELECT ID AS id, `First Name` AS firstName, `Last Name` AS lastName,
                        `E-mail Address` AS email, `Phone Number` AS phoneNumber
                 FROM Contacts WHERE UserID = :uid"
            );

            $stmt->execute([':uid' => $id]);

            $contacts = $stmt->fetchAll();
            respond(200, ['contacts' => $contacts]);
        } catch (PDOException $e) {
            error_log('DB error: ' . $e->getMessage());
            respond(500, ['error' => 'Database error']);
        }
    }

    else {
        respond(400, ['error' => 'Invalid admin operation']);
    }
}


// PUT: enable/disable user OR change password
else if ($method === 'PUT') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if (!$id) {
        respond(400, ['error' => 'User ID is required — use ?id=']);
    }

    $check = $db->prepare('SELECT ID FROM Users WHERE ID = :id LIMIT 1');
    $check->execute([':id' => $id]);

    if (!$check->fetch()) {
        respond(404, ['error' => 'User not found']);
    }

    // Enable / disable user
    if ($operation === 'toggle') {
        $body = getRequestBody();

        if (!isset($body['enabled']) || !in_array((int) $body['enabled'], [0, 1], true)) {
            respond(400, ['error' => 'Enabled must be 0 or 1']);
        }

        // Prevent the current user from disabling their own account
        if ($id === $userId && (int) $body['enabled'] === 0) {
            respond(400, ['error' => 'You cannot disable your own account']);
        }

        // Prevent disabling the last remaining admin
        if ((int) $body['enabled'] === 0) {
            $countStmt = $db->prepare('SELECT COUNT(*) FROM Users WHERE Admin = 1 AND Enabled = 1');
            $countStmt->execute();
            $target = $db->prepare('SELECT Admin FROM Users WHERE ID = :id');
            $target->execute([':id' => $id]);

            if ((int) $target->fetchColumn() === 1 && (int) $countStmt->fetchColumn() <= 1) {
                respond(400, ['error' => 'Cannot disable the last remaining admin']);
            }
        }

        try {
            $stmt = $db->prepare('UPDATE Users SET Enabled = :enabled WHERE ID = :id');
            $stmt->execute([':id' => $id, ':enabled' => (int) $body['enabled']]);

            respond(200, ['message' => 'User enabled status updated']);
        } catch (PDOException $e) {
            error_log('DB error: ' . $e->getMessage());
            respond(500, ['error' => 'Database error']);
        }
    }

    // Change password
    else if ($operation === 'passwordUpdate') {
        $body = getRequestBody();

        if (!isset($body['password']) || !$body['password']) {
            respond(400, ['error' => 'Password is required']);
        }

        $passwordHash = password_hash($body['password'], PASSWORD_DEFAULT);

        try {
            $stmt = $db->prepare('UPDATE Users SET Password = :password WHERE ID = :id');
            $stmt->execute([':id' => $id, ':password' => $passwordHash]);

            respond(200, ['message' => 'User password updated']);
        } catch (PDOException $e) {
            error_log('DB error: ' . $e->getMessage());
            respond(500, ['error' => 'Database error']);
        }
    }

    else {
        respond(400, ['error' => 'Invalid admin operation']);
    }
}


// POST: create new User/Admin
else if ($method === 'POST') {
    $body = getRequestBody();

    if (!isset($body['login']) || !isset($body['password']) || !isset($body['firstName'])
        || !isset($body['lastName']) || !isset($body['admin']) || !isset($body['enabled']))
    {
        respond(400, ['error' => 'All fields are required for registration']);
    }

    $login = clean($body['login']);
    $password = $body['password'];
    $firstName = checkName($body['firstName']);
    $lastName = checkName($body['lastName']);
    $admin = (int) $body['admin'];
    $enabled = (int) $body['enabled'];

    if (!$login || !$password || !$firstName || !$lastName
        || !in_array($admin, [0, 1], true) || !in_array($enabled, [0, 1], true))
    {
        respond(400, ['error' => 'Invalid registration data']);
    }

    // Check if login already exists
    $stmt = $db->prepare('SELECT ID FROM Users WHERE Login = :login LIMIT 1');
    $stmt->execute([':login' => $login]);

    if ($stmt->fetch()) {
        respond(409, ['error' => 'Login already exists']);
    }

    $passwordHash = password_hash($password, PASSWORD_DEFAULT);

    try {
        $stmt = $db->prepare(
            'INSERT INTO Users (Login, Password, `First Name`, `Last Name`, Admin, Enabled)
             VALUES (:login, :pass, :firstName, :lastName, :admin, :enabled)'
        );

        $stmt->execute([
            ':login' => $login, ':pass' => $passwordHash, ':firstName' => $firstName,
            ':lastName' => $lastName, ':admin' => $admin, ':enabled' => $enabled
        ]);

        respond(201, ['id' => (int) $db->lastInsertId(), 'message' => 'User registered successfully']);
    } catch (PDOException $e) {
        error_log('DB error: ' . $e->getMessage());
        respond(500, ['error' => 'Database error']);
    }
}


else {
    respond(405, ['error' => 'Method Not Allowed']);
}
