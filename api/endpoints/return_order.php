<?php
// --------------------------------------------------
// Return Order or Specific Items API Endpoint
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
// Main Function: Return Order
// --------------------------------------------------
function returnOrder() {
    // Get authenticated user
    $user = requireAuth();
    
    // Get database connection
    $conn = getConnection();
    
    // Read JSON input
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Validate required input
    if (empty($data['order_id'])) {
        sendResponse(400, ["message" => "Missing order_id in request body."]);
        return;
    }
    
    if (empty($data['return_type']) || !in_array($data['return_type'], ['full', 'partial'])) {
        sendResponse(400, ["message" => "Invalid or missing return_type. Use 'full' or 'partial'."]);
        return;
    }
    
    $orderId = (int)$data['order_id'];
    $returnType = $data['return_type'];
    $userId = $user['user_id'];
    
    // Validate items for partial return
    if ($returnType === 'partial') {
        if (empty($data['items']) || !is_array($data['items'])) {
            sendResponse(400, ["message" => "Missing items array for partial return."]);
            return;
        }
    }
    
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
            sendResponse(403, ["message" => "You are not authorized to return this order."]);
            return;
        }
        
        // Check if order is already returned
        if (strtoupper($order['order_status']) === 'RETURNED') {
            $conn->rollBack();
            sendResponse(400, ["message" => "Order has already been returned."]);
            return;
        }
        
        $returnedItems = [];
        
        // 2. Process return based on type
        if ($returnType === 'full') {
            // Full return: Get all items from the order
            $itemsStmt = $conn->prepare(
                "SELECT oi.item_id, oi.quantity, i.name, i.stock_level
                 FROM order_items oi
                 JOIN items i ON oi.item_id = i.item_id
                 WHERE oi.order_id = :order_id"
            );
            $itemsStmt->execute([':order_id' => $orderId]);
            $orderItems = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Restore stock for all items
            $updateStockStmt = $conn->prepare(
                "UPDATE items 
                 SET stock_level = stock_level + :quantity 
                 WHERE item_id = :item_id"
            );
            
            foreach ($orderItems as $item) {
                $updateStockStmt->execute([
                    ':quantity' => $item['quantity'],
                    ':item_id' => $item['item_id']
                ]);
                
                $returnedItems[] = [
                    'item_id' => $item['item_id'],
                    'item_name' => $item['name'],
                    'quantity_returned' => $item['quantity'],
                    'new_stock_level' => (int)$item['stock_level'] + (int)$item['quantity']
                ];
            }
            
        } else {
            // Partial return: Process specified items
            $updateStockStmt = $conn->prepare(
                "UPDATE items 
                 SET stock_level = stock_level + :quantity 
                 WHERE item_id = :item_id"
            );
            
            // Verify each item belongs to the order
            $verifyItemStmt = $conn->prepare(
                "SELECT oi.item_id, oi.quantity, i.name, i.stock_level
                 FROM order_items oi
                 JOIN items i ON oi.item_id = i.item_id
                 WHERE oi.order_id = :order_id AND oi.item_id = :item_id"
            );
            
            foreach ($data['items'] as $returnItem) {
                if (empty($returnItem['item_id']) || empty($returnItem['quantity'])) {
                    $conn->rollBack();
                    sendResponse(400, ["message" => "Each item must have item_id and quantity."]);
                    return;
                }
                
                $itemId = (int)$returnItem['item_id'];
                $returnQty = (int)$returnItem['quantity'];
                
                // Verify item is in the order
                $verifyItemStmt->execute([
                    ':order_id' => $orderId,
                    ':item_id' => $itemId
                ]);
                $orderItem = $verifyItemStmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$orderItem) {
                    $conn->rollBack();
                    sendResponse(400, ["message" => "Item ID {$itemId} not found in this order."]);
                    return;
                }
                
                // Validate return quantity
                if ($returnQty > (int)$orderItem['quantity']) {
                    $conn->rollBack();
                    sendResponse(400, [
                        "message" => "Return quantity ({$returnQty}) exceeds ordered quantity ({$orderItem['quantity']}) for item {$itemId}."
                    ]);
                    return;
                }
                
                // Update stock
                $updateStockStmt->execute([
                    ':quantity' => $returnQty,
                    ':item_id' => $itemId
                ]);
                
                $returnedItems[] = [
                    'item_id' => $itemId,
                    'item_name' => $orderItem['name'],
                    'quantity_returned' => $returnQty,
                    'new_stock_level' => (int)$orderItem['stock_level'] + $returnQty
                ];
            }
        }
        
        // 3. Update order status to RETURNED
        $updateOrderStmt = $conn->prepare(
            "UPDATE orders 
             SET order_status = 'RETURNED' 
             WHERE order_id = :order_id"
        );
        $updateOrderStmt->execute([':order_id' => $orderId]);
        
        // 4. Create audit log entry
        $auditStmt = $conn->prepare(
            "INSERT INTO order_audit_history (order_id, from_status, to_status, changed_by, reason)
             VALUES (:order_id, :from_status, 'RETURNED', :user_id, :reason)"
        );
        $auditStmt->execute([
            ':order_id' => $orderId,
            ':from_status' => $order['order_status'],
            ':user_id' => $userId,
            ':reason' => $returnType === 'full' 
                ? 'Full order return - all items returned to stock' 
                : 'Partial order return - selected items returned to stock'
        ]);
        
        // Commit transaction
        $conn->commit();
        
        sendResponse(200, [
            "success" => true,
            "message" => "Order returned successfully",
            "order_id" => $orderId,
            "return_type" => $returnType,
            "items_returned" => $returnedItems,
            "total_items_returned" => count($returnedItems)
        ]);
        
    } catch (PDOException $e) {
        // Rollback on error
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        error_log('return_order.php DB error: ' . $e->getMessage());
        sendResponse(500, ["message" => "Server error: " . $e->getMessage()]);
    }
}

// Execute the function
returnOrder();
?>