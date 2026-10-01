<?php
// ============================================================
//  routes/contacts.php — Contact Operations
//
//  GET  ?action=contacts&q=term  — search contacts
//  POST ?action=contacts         — create contact
//  PUT  ?action=contacts&id=1    — update contact
//  DELETE ?action=contacts&id=1    — delete contact
// ============================================================

// GET: search for contacts
if ($method === 'GET') {
    $search = $_GET['q'] ?? '';
    $search = str_replace(['%', '_'], ['\\%', '\\_'], $search);
    $like = '%' . $search . '%';
    // A contact ID is a single number, so it is matched exactly. Using LIKE
    // here turned "2" into a substring search that matched IDs 213 and 214.
    $id = ctype_digit($search) ? (int) $search : -1;

    try {
        $stmt = $db->prepare(
            "SELECT ID AS id, `First Name` AS firstName, `Last Name` AS lastName,
                    `E-mail Address` AS email, `Phone Number` AS phoneNumber
             FROM Contacts WHERE UserID = :uid AND (
                 `First Name` LIKE :firstName OR `Last Name` LIKE :lastName
                 OR `E-mail Address` LIKE :email OR `Phone Number` LIKE :phoneNumber
                 OR ID = :id)
             ORDER BY ID LIMIT 100"
        );

        $stmt->execute([
            ':uid' => $userId, ':firstName' => $like, ':lastName' => $like,
            ':email' => $like, ':phoneNumber' => $like, ':id' => $id
        ]);

        $contacts = $stmt->fetchAll();
        respond(200, ['contacts' => $contacts]);
    } catch (PDOException $e) {
        error_log('DB error: ' . $e->getMessage());
        respond(500, ['error' => 'Database error']);
    }
}


// POST: create contact
if ($method === 'POST') {
    $body = getRequestBody();

    if (!isset($body['firstName']) || !isset($body['lastName'])
        || !isset($body['email']) || !isset($body['phoneNumber']))
    {
        respond(400, ['error' => 'All fields are required to create a new contact']);
    }

    $firstName = checkName($body['firstName']);
    $lastName = checkName($body['lastName']);
    $email = checkEmail($body['email']);
    $phoneNumber = checkPhoneNumber($body['phoneNumber']);

    if (!$firstName || !$lastName || !$email || !$phoneNumber) {
        respond(400, ['error' => 'Invalid contact data']);
    }

    try {
        // Check if the contact already exists
        $stmt = $db->prepare(
            'SELECT ID FROM Contacts WHERE `Phone Number` = :phoneNumber
             AND `E-mail Address` = :email AND UserID = :userID LIMIT 1'
        );

        $stmt->execute([':phoneNumber' => $phoneNumber, ':email' => $email, ':userID' => $userId]);

        if ($stmt->fetch()) {
            respond(409, ['error' => 'Another contact with the same phone number and email already exists']);
        }

        // Insert new contact
        $stmt = $db->prepare(
            'INSERT INTO Contacts (`First Name`, `Last Name`, `E-mail Address`, `Phone Number`, UserID)
             VALUES (:firstName, :lastName, :email, :phoneNumber, :userID)'
        );

        $stmt->execute([
            ':firstName' => $firstName, ':lastName' => $lastName, ':email' => $email,
            ':phoneNumber' => $phoneNumber, ':userID' => $userId
        ]);

        respond(201, ['id' => (int) $db->lastInsertId(), 'message' => 'Contact created successfully']);
    } catch (PDOException $e) {
        error_log('DB error: ' . $e->getMessage());
        respond(500, ['error' => 'Database error']);
    }
}


// PUT: update contact
if ($method === 'PUT') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if (!$id) {
        respond(400, ['error' => 'Contact ID is required — use ?id=']);
    }

    $check = $db->prepare('SELECT ID FROM Contacts WHERE ID = :id AND UserID = :uid LIMIT 1');
    $check->execute([':id' => $id, ':uid' => $userId]);

    if (!$check->fetch()) {
        respond(404, ['error' => 'Contact not found']);
    }

    $body = getRequestBody();

    if (!isset($body['firstName']) || !isset($body['lastName'])
        || !isset($body['email']) || !isset($body['phoneNumber']))
    {
        respond(400, ['error' => 'All fields are required']);
    }

    $firstName = checkName($body['firstName']);
    $lastName = checkName($body['lastName']);
    $email = checkEmail($body['email']);
    $phoneNumber = checkPhoneNumber($body['phoneNumber']);

    if (!$firstName || !$lastName || !$email || !$phoneNumber) {
        respond(400, ['error' => 'Invalid contact data']);
    }

    try {
        $stmt = $db->prepare(
            "UPDATE Contacts SET `First Name` = :firstName, `Last Name` = :lastName,
             `Phone Number` = :phoneNumber, `E-mail Address` = :email
             WHERE ID = :id AND UserID = :uid"
        );

        $stmt->execute([
            ':firstName' => $firstName, ':lastName' => $lastName, ':phoneNumber' => $phoneNumber,
            ':email' => $email, ':id' => $id, ':uid' => $userId
        ]);

        respond(200, ['message' => 'Contact updated']);
    } catch (PDOException $e) {
        error_log('DB error: ' . $e->getMessage());
        respond(500, ['error' => 'Database error']);
    }
}


// DELETE: delete contact
if ($method === 'DELETE') {
    $id = isset($_GET['id']) ? (int) $_GET['id'] : 0;

    if (!$id) {
        respond(400, ['error' => 'Contact ID is required — use ?id=']);
    }

    try {
        $stmt = $db->prepare('DELETE FROM Contacts WHERE ID = :id AND UserID = :uid');
        $stmt->execute([':id' => $id, ':uid' => $userId]);

        if ($stmt->rowCount() === 0) {
            respond(404, ['error' => 'Contact not found']);
        }

        respond(200, ['message' => 'Contact deleted']);
    } catch (PDOException $e) {
        error_log('DB error: ' . $e->getMessage());
        respond(500, ['error' => 'Database error']);
    }
}
