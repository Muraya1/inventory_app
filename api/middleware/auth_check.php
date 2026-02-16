<?php
// api/middleware/auth_check.php

// function requireAuth() {
//      $data = json_decode(file_get_contents("php://input"));
//      $user_role = $data->userRole ?? null;
//     if (session_status() === PHP_SESSION_NONE) {
//         session_start();
//     }

//     if (!isset($_SESSION['user_id'])) {
//         http_response_code(401);
//         echo json_encode([
//             'success' => false,
//             'message' => 'NO user_id found. Authentication required'
//         ]);
//         exit;
//     }

//     return [
//         'user_id'   => $_SESSION['user_id'],
//         'username'  => $_SESSION['username'],
//         'user_role' => $_SESSION['user_role']
//     ];
// }
// function requireAdmin() {
//     $user = requireAuth();
//     if ($user['user_role'] !== 'admin') {
//         http_response_code(403);
//         echo json_encode(['success' => false, 'message' => 'Admin access required']);
//         exit;
//     }
//     return $user;
// }

// function getCurrentUser() {
//     session_start();
//     if (!isset($_SESSION['user_id'])) {
//         return null;
//     }
//     return [
//         'user_id' => $_SESSION['user_id'],
//         'username' => $_SESSION['username'],
//         'role' => $_SESSION['role']
//     ];
// } -->