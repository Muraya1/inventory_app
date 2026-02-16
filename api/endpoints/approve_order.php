<?php
// api/endpoints/approve_order.php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../config/helper.php';
require_once '../config/session_manager.php';
require_once '../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
// At the top of api/endpoints/approve_order.php


// Continue with your logic...
/**
 * Approve order and deduct stock
 * This is the ONLY place where stock is deducted
 */
function approveOrder() {
    $admin = requireAdmin(); // Only admins can approve
    $conn = getConnection();
    $data = json_decode(file_get_contents("php://input"));

    $sessionManager = new SessionManager($conn);

if (!$sessionManager->validateSession()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Session expired. Please login again.']);
    exit;
}

    if (empty($data->order_id)) {
        sendResponse(400, ["message" => "Order ID required"]);
        return;
    }

    $orderId = (int)$data->order_id;
    $approvalNote = isset($data->note) ? trim($data->note) : null;

    try {
        $conn->beginTransaction();

        // 1. Get order and verify it's pending
        $orderStmt = $conn->prepare(
            "SELECT * FROM orders WHERE order_id = :order_id FOR UPDATE"
        );
        $orderStmt->execute([':order_id' => $orderId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            throw new Exception("Order not found");
        }

        if ($order['order_status'] !== 'PENDING') {
            throw new Exception("Order is not pending (current status: {$order['order_status']})");
        }

        // 2. Get order items
        $itemsStmt = $conn->prepare(
            "SELECT oi.*, i.name, i.stock_level
             FROM order_items oi
             JOIN items i ON oi.item_id = i.item_id
             WHERE oi.order_id = :order_id"
        );
        $itemsStmt->execute([':order_id' => $orderId]);
        $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        // 3. Validate stock availability
        foreach ($items as $item) {
            if ($item['stock_level'] < $item['quantity']) {
                throw new Exception(
                    "Insufficient stock for {$item['name']}. " .
                    "Required: {$item['quantity']}, Available: {$item['stock_level']}"
                );
            }
        }

        // 4. Deduct stock (THIS IS THE CRITICAL STEP)
        $updateStockStmt = $conn->prepare(
            "UPDATE items 
             SET stock_level = stock_level - :qty,
                 last_stock_received = NOW()
             WHERE item_id = :item_id"
        );

        foreach ($items as $item) {
            $updateStockStmt->execute([
                ':qty' => $item['quantity'],
                ':item_id' => $item['item_id']
            ]);

            // Log to inventory_logs
            // $logStmt = $conn->prepare(
            //     "INSERT INTO inventory_logs 
            //      (item_id, quantity_added, old_quantity, new_quantity, user_name, change_type)
            //      VALUES (:item_id, :qty_change, :old_qty, :new_qty, :user, 'ORDER_APPROVED')"
            // );
            // $logStmt->execute([
            //     ':item_id' => $item['item_id'],
            //     ':qty_change' => -$item['quantity'],
            //     ':old_qty' => $item['stock_level'],
            //     ':new_qty' => $item['stock_level'] - $item['quantity'],
            //     ':user' => $admin['username']
            // ]);
        }

        // 5. Update order status
        $updateOrderStmt = $conn->prepare(
            "UPDATE orders 
             SET order_status = 'APPROVED',
                 approved_by = :admin_id,
                 approved_at = NOW()
             WHERE order_id = :order_id"
        );
        $updateOrderStmt->execute([
            ':admin_id' => $admin['user_id'],
            ':order_id' => $orderId
        ]);

        // 6. Create audit trail
        $auditStmt = $conn->prepare(
            "INSERT INTO order_audit_history 
             (order_id, from_status, to_status, changed_by, reason, ip_address)
             VALUES (:order_id, 'PENDING', 'APPROVED', :admin_id, :reason, :ip)"
        );
        $auditStmt->execute([
            ':order_id' => $orderId,
            ':admin_id' => $admin['user_id'],
            ':reason' => $approvalNote ?: 'Order approved by admin',
            ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
        ]);

        // 7. Notify the order creator
        $notifyStmt = $conn->prepare(
            "INSERT INTO order_notifications (order_id, user_id, message)
             VALUES (:order_id, :user_id, :message)"
        );
        $notifyStmt->execute([
            ':order_id' => $orderId,
            ':user_id' => $order['user_id'],
            ':message' => "Your order #{$orderId} has been approved by {$admin['username']}"
        ]);

        $conn->commit();

        sendResponse(200, [
            "success" => true,
            "message" => "Order approved and stock deducted successfully",
            "order_id" => $orderId,
            "approved_by" => $admin['username'],
            "approved_at" => date('Y-m-d H:i:s')
        ]);

    } catch (Exception $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        error_log($e->getMessage());
        sendResponse(400, [
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }
}

approveOrder();