<?php
// api/endpoints/pending_orders.php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../config/helper.php';
require_once '../middleware/auth_check.php';


/**
 * Get all pending orders (Admin only)
 */
function getPendingOrders() {
   $user = requireAdmin(); // Only admins can see pending orders
    $conn = getConnection();
    

    try {
        // Use the view we created
        $stmt = $conn->prepare("SELECT * FROM v_pending_orders");
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Get items for each order
        foreach ($orders as &$order) {
            $itemsStmt = $conn->prepare(
                "SELECT oi.*, i.name, i.measuring_unit, i.stock_level as current_stock
                 FROM order_items oi
                 JOIN items i ON oi.item_id = i.item_id
                 WHERE oi.order_id = :order_id"
            );
            $itemsStmt->execute([':order_id' => $order['order_id']]);
            $order['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

            // Check if stock is still available
            $order['can_approve'] = true;
            foreach ($order['items'] as $item) {
                if ($item['current_stock'] < $item['quantity']) {
                    $order['can_approve'] = false;
                    $order['stock_issue'] = "Insufficient stock for {$item['name']}";
                    break;
                }
            }
        }

        sendResponse(200, [
            'success' => true,
            'count' => count($orders),
            'orders' => $orders
        ]);

    } catch (PDOException $e) {
        error_log($e->getMessage());
        sendResponse(500, ["message" => "Database error"]);
    }
}

getPendingOrders();