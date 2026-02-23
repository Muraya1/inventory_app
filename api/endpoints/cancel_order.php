<?php
// --------------------------------------------------
// Cancel/Delete Pending Orders API Endpoint
// --------------------------------------------------

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../config/helper.php';
require_once '../config/session_manager.php';
require_once '../middleware/auth_check.php';

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendResponse(405, ["message" => "Method not allowed. Use POST."]);
    exit;
}

// --------------------------------------------------
// Main Function: Cancel Order
// --------------------------------------------------
function cancelOrder() {
    // Get authenticated user
    $user = requireAuth();
    
    // Get database connection
    $conn = getConnection();
    
    // Read JSON input
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate input
    if (empty($data['order_id'])) {
        sendResponse(400, ["message" => "Missing order_id in request body."]);
        return;
    }
    
    $orderId = (int)$data['order_id'];
    $userId = $user['user_id'];
    
    try {
        // Start transaction
        $conn->beginTransaction();
        
        // 1. Check if order exists and belongs to the authenticated user
        $orderStmt = $conn->prepare(
            "SELECT order_id, user_id, order_status 
             FROM orders 
             WHERE order_id = :order_id"
        );
        $orderStmt->execute([':order_id' => $orderId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$order) {
            $conn->rollBack();
            sendResponse(404, ["message" => "Order not found."]);
            return;
        }
        
        // Verify order belongs to authenticated user
        if ((int)$order['user_id'] !== $userId) {
            $conn->rollBack();
            sendResponse(403, ["message" => "You are not authorized to cancel this order."]);
            return;
        }
        
        // 2. Check if order status is PENDING
        if (strtoupper($order['order_status']) !== 'PENDING') {
            $conn->rollBack();
            sendResponse(400, ["message" => "Cannot cancel non-pending orders"]);
            return;
        }
        
        // 3. Delete related records from order_notifications
        $deleteNotificationsStmt = $conn->prepare(
            "DELETE FROM order_notifications WHERE order_id = :order_id"
        );
        $deleteNotificationsStmt->execute([':order_id' => $orderId]);
        
        // 4. Delete related records from order_audit_history
        $deleteAuditStmt = $conn->prepare(
            "DELETE FROM order_audit_history WHERE order_id = :order_id"
        );
        $deleteAuditStmt->execute([':order_id' => $orderId]);
        
        // 5. Delete order_items first (due to foreign key constraints)
        $deleteItemsStmt = $conn->prepare(
            "DELETE FROM order_items WHERE order_id = :order_id"
        );
        $deleteItemsStmt->execute([':order_id' => $orderId]);
        
        // 6. Delete the order record
        $deleteOrderStmt = $conn->prepare(
            "DELETE FROM orders WHERE order_id = :order_id"
        );
        $deleteOrderStmt->execute([':order_id' => $orderId]);
        
        // Commit transaction
        $conn->commit();
        
        sendResponse(200, [
            "success" => true,
            "message" => "Order cancelled successfully",
            "order_id" => $orderId
        ]);
        
    } catch (PDOException $e) {
        // Rollback on error
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        error_log('cancel_order.php DB error: ' . $e->getMessage());
        sendResponse(500, ["message" => "Server error: " . $e->getMessage()]);
    }
}

// Execute the function
cancelOrder();
?>