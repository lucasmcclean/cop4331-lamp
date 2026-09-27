<?php
// ============================================================
//  index.php — Main Entry Point
//
//  Handles routing for different actions and enforces authentication.
// ============================================================

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/helpers.php';

setCORSHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? null;
$db = getDB();

//1. Health check
if ($method === 'GET' && (isset($_GET['ping']) || $action === 'ping')) {
    respond(200, ['status' => 'OK', 'timestamp' => time()]);
}

//2. Public authentication routes
if ($action === 'login' || $action === 'register') {
    require __DIR__ . '/routes/auth.php';
    exit;
}

// Everything below requires authentication
$userId = requireAuth();

//3. Admin routes
if ($action === 'admin') {
    require __DIR__ . '/routes/admin.php';
}

//4. User Contact routes
require __DIR__ . '/routes/contacts.php';