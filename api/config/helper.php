<?php
function sendResponse($status, $data) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit();
}

// Move checkRole() here too!
function checkRole(array $requiredRoles) {
    global $user_role, $user_id; // <<< CRITICAL: This line is required!

    if (!isset($user_role) || empty($user_role)) {
        // This is the line that's executing when the error occurs!
        sendResponse(403, ["message" => "Forbidden: User role not defined."]);
    }
    
    if (!in_array($user_role, $requiredRoles)) {
        sendResponse(403, ["message" => "Forbidden: Insufficient privileges."]);
    }
}
