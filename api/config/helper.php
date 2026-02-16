<?php
require_once __DIR__ . '/session_manager.php';
//require_once __DIR__ . '/database.php';
function sendResponse($status, $data) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit();
}




/**
 * Get SessionManager instance
 */
function getSessionManager() {
    global $conn; // ✅ IMPORTANT: Access the global $conn variable
    static $sessionManager = null;
    
    if ($sessionManager === null) {
        if ($conn === null) {
            // If connection failed, try to reconnect
            require __DIR__ . '/database.php';
        }
        $sessionManager = new SessionManager($conn);
    }
    
    return $sessionManager;
}

/**
 * Get current logged-in user
 */
function getCurrentUser() {
    $sessionManager = getSessionManager();
    return $sessionManager->getCurrentUser();
}

/**
 * Require authentication (or die)
 */
function requireAuth() {
    $user = getCurrentUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized. Please login.']);
        exit;
    }
    
    return $user;
}

/**
 * Require admin role (or die)
 */
function requireAdmin() {
    $user = requireAuth();
    
    if ($user['role'] !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Admin access required']);
        exit;
    }
    
    return $user;
}

/**
 * Check if user is admin
 */
function isAdmin() {
    $user = getCurrentUser();
    return $user && $user['role'] === 'admin';
}

/**
 * Logout current user
 */
function logout() {
    $sessionManager = getSessionManager();
    $sessionManager->destroySession();
}