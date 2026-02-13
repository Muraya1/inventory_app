<?php
// api/endpoints/order_timeline.php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../config/helper.php';
require_once '../middleware/auth_check.php';

function getOrderTimeline() {
   // $user = requireAuth();
   $user = 1; // TEMPORARY HARDCODED USER FOR TESTING
   // $user = $user['user_id'];
    $conn = getConnection();
    
    // Fetch user data
    $userStmt = $conn->prepare("SELECT user_id, role FROM users WHERE user_id = :user_id");
    $userStmt->execute([':user_id' => $user]);
    $user = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user) {
        sendResponse(401, ["message" => "User not found"]);
        return;
    }
    
    $orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
    
    if ($orderId <= 0) {
        sendResponse(400, ["message" => "Invalid order ID"]);
        return;
    }

    try {
        // Verify access
        $orderStmt = $conn->prepare("SELECT user_id FROM orders WHERE order_id = :order_id");
        $orderStmt->execute([':order_id' => $orderId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            sendResponse(404, ["message" => "Order not found"]);
            return;
        }

        // Check access
        if ($user['role'] !== 'admin' && $order['user_id'] != $user['user_id']) {
            sendResponse(403, ["message" => "Access denied"]);
            return;
        }

        // Get timeline
        $timelineStmt = $conn->prepare(
            "SELECT * FROM v_order_timeline WHERE order_id = :order_id"
        );
        $timelineStmt->execute([':order_id' => $orderId]);
        $timeline = $timelineStmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(200, [
            'success' => true,
            'timeline' => $timeline
        ]);

    } catch (PDOException $e) {
        error_log($e->getMessage());
        sendResponse(500, ["message" => "Database error"]);
    }
}

getOrderTimeline();