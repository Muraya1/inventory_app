<?php

// header("Access-Control-Allow-Origin: *"); 
// header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type, Authorization");
// require_once '../config/database.php';
// require_once '../../vendor/JWT.php';
// require_once '../config/helper.php';
// header("Access-Control-Allow-Origin: http://localhost");
// header("Access-Control-Allow-Credentials: true");
// header("Access-Control-Allow-Methods: POST, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type");

// require_once '../config/database.php';
// require_once '../config/helper.php';

//  use \Firebase\JWT\JWT;
//  use \Firebase\JWT\Key;

// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//     http_response_code(200);
//     exit;
// }

// session_set_cookie_params([
//     'path' => '/',
//     'httponly' => true,
//     'samesite' => 'Lax'
// ]);
// session_start();

// $conn = getConnection();
// $data = json_decode(file_get_contents("php://input"));

// $username = $data->username ?? '';
// $password = $data->password ?? '';

// $sql = "SELECT user_id, username, password_hash, role FROM users WHERE username = :username";
// $stmt = $conn->prepare($sql);
// $stmt->execute(['username' => $username]);

// $user = $stmt->fetch(PDO::FETCH_ASSOC);

// if (!$user || !password_verify($password, $user['password_hash'])) {
//     http_response_code(401);
//     echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
//     exit;
// }

// // ✅ SET SESSION
// $_SESSION['user_id']   = $user['user_id'];
// $_SESSION['username']  = $user['username'];
// $_SESSION['user_role'] = $user['role'];


//   $payload = array(
//                     "user_id" => $user['user_id'],
//                     "username" => $user['username'],
//                     "role" => $user['role'], // CRITICAL FOR SECURITY CHECK
//                     "exp" => time() + (60 * 60) // valid for 1 hr
//                 );
//                  $jwt = JWT::encode($payload, "123", 'HS256');

// sendResponse(200, [
//                     "message" => "Login successful.",
//                     "token" => $jwt,
//                     "user_id" => $user['user_id'],
//                     "role" => $user['role'],
//                     "username" => $user['username']
    
// ]);
// exit;



/**
 * Authentication Endpoint
 * File: api/endpoints/auth.php
 */

header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../config/session_manager.php';
require_once '../config/helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        echo json_encode([
            'success' => false,
            'message' => 'Username and password are required'
        ]);
        exit;
    }
    
    try {
        $conn = getConnection();
        
        // Get user from database
        $stmt = $conn->prepare(
            "SELECT user_id, username, password_hash, role 
             FROM users 
             WHERE username = :username"
        );
        $stmt->execute([':username' => $username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            echo json_encode([
                'success' => false,
                'message' => 'Invalid username or password'
            ]);
            exit;
        }
        
        // Create session using PHP's session_id()
        $sessionManager = new SessionManager($conn);
        $sessionResult = $sessionManager->createSession(
            $user['user_id'],
            $user['username'],
            $user['role']
        );
        
        if ($sessionResult['success']) {
            echo json_encode([
                'success' => true,
                'message' => 'Login successful',
                 'user' => [
                    'user_id' => $user['user_id'],
                    'username' => $user['username'],
                    'role' => $user['role']
                ]
            ]);
        } else {
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create session'
            ]);
        }
        
    } catch (PDOException $e) {
        error_log("Login error: " . $e->getMessage());
        echo json_encode([
            'success' => false,
            'message' => 'Database error occurred'
        ]);
    }
}
