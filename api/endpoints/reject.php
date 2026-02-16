<?php
// api/endpoints/reject_order.php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

//require_once '../config/database.php';
//require_once '../config/helper.php';
//require_once '../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Reject order (no stock changes needed)
 */
function rejectOrder() {
    $admin = requireAdmin(); // Fixed typo: requireAdmint() -> requireAdmin()
    $conn = getConnection();
    $data = json_decode(file_get_contents("php://input"));

    if (empty($data->order_id)) {
        sendResponse(400, ["message" => "Order ID required"]);
        return;
    }

    if (empty($data->reason)) {
        sendResponse(400, ["message" => "Rejection reason required"]);
        return;
    }

    $orderId = (int)$data->order_id;
    $reason = trim($data->reason);

    try {
        $conn->beginTransaction();

        // 1. Get order
        $orderStmt = $conn->prepare(
            "SELECT * FROM orders WHERE order_id = :order_id FOR UPDATE"
        );
        $orderStmt->execute([':order_id' => $orderId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            throw new Exception("Order not found");
        }

        if ($order['order_status'] !== 'PENDING') {
            throw new Exception("Order is not pending");
        }

        // 2. Update order status
        $updateStmt = $conn->prepare(
            "UPDATE orders 
             SET order_status = 'REJECTED',
                 approved_by = :admin_id,
                 approved_at = NOW(),
                 rejection_reason = :reason
             WHERE order_id = :order_id"
        );
        $updateStmt->execute([
            ':admin_id' => $admin['user_id'],
            ':reason' => $reason,
            ':order_id' => $orderId
        ]);

        // 3. Audit trail
        $auditStmt = $conn->prepare(
            "INSERT INTO order_audit_history 
             (order_id, from_status, to_status, changed_by, reason, ip_address)
             VALUES (:order_id, 'PENDING', 'REJECTED', :admin_id, :reason, :ip)"
        );
        $auditStmt->execute([
            ':order_id' => $orderId,
            ':admin_id' => $admin['user_id'],
            ':reason' => $reason,
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ]);

        // 4. Notify user
        $notifyStmt = $conn->prepare(
            "INSERT INTO order_notifications (order_id, user_id, message)
             VALUES (:order_id, :user_id, :message)"
        );
        $notifyStmt->execute([
            ':order_id' => $orderId,
            ':user_id' => $order['user_id'],
            ':message' => "Your order #{$orderId} was rejected. Reason: {$reason}"
        ]);

        $conn->commit();

        sendResponse(200, [
            "success" => true,
            "message" => "Order rejected",
            "order_id" => $orderId
        ]);

    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        sendResponse(400, ["success" => false, "message" => $e->getMessage()]);
    }
}

rejectOrder();