<?php

declare(strict_types=1);

// --------------------------------------------------
// 1. Headers
// --------------------------------------------------
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// --------------------------------------------------
// 2. Dependencies
// --------------------------------------------------
require_once '../config/database.php';
require_once '../../vendor/JWT.php';

use Firebase\JWT\JWT;

// --------------------------------------------------
// 3. Database Connection (FROM database.php)
// --------------------------------------------------
$pdo = getConnection();

// --------------------------------------------------
// 4. Read Input
// --------------------------------------------------
$input = json_decode(file_get_contents("php://input"), true);

if (
    empty($input['username']) ||
    empty($input['password']) ||
    empty($input['role'])
) {
    http_response_code(400);
    echo json_encode([
        "message" => "Username, password, and role are required"
    ]);
    exit;
}

$username = trim($input['username']);
$password = $input['password'];
$role     = trim($input['role']);

// --------------------------------------------------
// 5. Hash Password
// --------------------------------------------------
$passwordHash = password_hash($password, PASSWORD_DEFAULT);

// --------------------------------------------------
// 6. Insert User
// --------------------------------------------------
try {
    $sql = "INSERT INTO users (username, password_hash, role)
            VALUES (:username, :password_hash, :role)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':username'      => $username,
        ':password_hash' => $passwordHash,
        ':role'          => $role
    ]);

    $userId = (int)$pdo->lastInsertId();

} catch (PDOException $e) {
    http_response_code(409);
    echo json_encode([
        "message" => "User creation failed"
    ]);
    exit;
}

// --------------------------------------------------
// 7. Generate JWT
// --------------------------------------------------
$payload = [
    "iss" => "localhost",
    "iat" => time(),
    "exp" => time() + 3600,
    "data" => [
        "id"       => $userId,
        "username" => $username,
        "role"     => $role
    ]
];

$secretKey = "123"; // move to ENV later
$token = JWT::encode($payload, $secretKey, 'HS256');

// --------------------------------------------------
// 8. Response
// --------------------------------------------------
http_response_code(201);
echo json_encode([
    "message" => "User created successfully",
    "token"   => $token
]);
