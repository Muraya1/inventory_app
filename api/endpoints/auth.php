<?php
// api/endpoints/login.php (Add at the top)

// header("Access-Control-Allow-Origin: *"); 
// header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
// header("Access-Control-Allow-Headers: Content-Type, Authorization");
// require_once '../config/database.php';
// require_once '../../vendor/JWT.php';
// require_once '../config/helper.php';

// use \Firebase\JWT\JWT;
// use \Firebase\JWT\Key;

// //  function sendResponse($status, $data) {
// //      header('Content-Type: application/json');
// //      http_response_code($status);
// //     echo json_encode($data);
// //      exit();
// //  }
// if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
//     // Send 200 OK headers immediately for preflight check
//     http_response_code(200);
//     exit;
// }




// function handleLogin() {
//     $conn = getConnection();
//     $data = json_decode(file_get_contents("php://input"));

//     // Ensure JWT class is available (Add at the top of the file)
//     // use Firebase\JWT\JWT; 
    
//     if (!isset($data->username) || !isset($data->password)) {
//         sendResponse(400, ["message" => "Missing username or password."]);
//     }

//     $username = $data->username;
//     $password = $data->password;

//     $sql = "SELECT user_id, username, password_hash, role FROM Users WHERE username = :username";

//     try {
//         $stmt = $conn->prepare($sql);
//         $stmt->bindParam(':username', $username);
//         $stmt->execute();
        
//         if ($stmt->rowCount() == 1) {

//             $user = $stmt->fetch(PDO::FETCH_ASSOC);
//             $hashedPassword = $user['password_hash'];

//             // 1. VERIFY PASSWORD SECURELY
//             if (password_verify($password, $hashedPassword)) {

//                 $db_username = $user['username']; 
//                 $user_role = $user['role'];
//                 $user_id = $user['user_id'];

//                 // 2. BUILD JWT PAYLOAD with role
//                 $payload = array(
//                     "user_id" => $user_id,
//                     "username" => $db_username,
//                     "role" => $user_role, // CRITICAL FOR SECURITY CHECK
//                     "exp" => time() + (60 * 60) // valid for 1 hr
//                 );
                
//                 // --- REMOVED INCORRECT $GLOBALS ASSIGNMENT HERE ---

//                 // Encode JWT (Assuming "123" is your secret key)
//                 $jwt = JWT::encode($payload, "123", 'HS256');

//                 // 3. SEND SUCCESS RESPONSE
//                 sendResponse(200, [
//                     "message" => "Login successful.",
//                     "token" => $jwt,
//                     "user_id" => $user_id,
//                     "role" => $user_role,
//                     "username" => $db_username
//                 ]); 
//             } else {
//                 sendResponse(401, ["message" => "Invalid username or password."]);
//             }

//         } else {
//             sendResponse(401, ["message" => "Invalid username or password."]);
//         }
//     $GLOBALS['user_id'] = $payload['user_id'];
//     $GLOBALS['username'] = $payload['username'];
//     $GLOBALS['user_role'] = $payload['role'];

//     } catch (PDOException $e) {
//         sendResponse(500, ["message" => "Server error during login."]);
//     }
// }

// handleLogin();
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
require_once '../config/database.php';
require_once '../../vendor/JWT.php';
require_once '../config/helper.php';
header("Access-Control-Allow-Origin: http://localhost");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/database.php';
require_once '../config/helper.php';

 use \Firebase\JWT\JWT;
 use \Firebase\JWT\Key;

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_set_cookie_params([
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax'
]);
session_start();

$conn = getConnection();
$data = json_decode(file_get_contents("php://input"));

$username = $data->username ?? '';
$password = $data->password ?? '';

$sql = "SELECT user_id, username, password_hash, role FROM users WHERE username = :username";
$stmt = $conn->prepare($sql);
$stmt->execute(['username' => $username]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    exit;
}

// ✅ SET SESSION
$_SESSION['user_id']   = $user['user_id'];
$_SESSION['username']  = $user['username'];
$_SESSION['user_role'] = $user['role'];


  $payload = array(
                    "user_id" => $user['user_id'],
                    "username" => $user['username'],
                    "role" => $user['role'], // CRITICAL FOR SECURITY CHECK
                    "exp" => time() + (60 * 60) // valid for 1 hr
                );
                 $jwt = JWT::encode($payload, "123", 'HS256');

sendResponse(200, [
                    "message" => "Login successful.",
                    "token" => $jwt,
                    "user_id" => $user['user_id'],
                    "role" => $user['role'],
                    "username" => $user['username']
    
]);
exit;
