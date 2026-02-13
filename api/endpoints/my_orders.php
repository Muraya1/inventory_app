<?php
/**
 * API Endpoint: My Orders
 * Path: api/endpoints/my_orders.php
 * Purpose: Get all orders for the currently logged-in user
 * Access: Authenticated users only
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../config/helper.php';
// If you don't have this yet, remove this line and the requireAuth() call,
// OR create middleware/auth_check.php with requireAuth() as we used elsewhere.
require_once '../middleware/auth_check.php';

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

function getMyOrders()
{
    // Get logged in user (from session)

    // If you don’t want middleware, you can read $_SESSION directly.
    $user = requireAuth(); // expects ['user_id' => ..., 'username' => ..., 'role' => ...]
    $conn = getConnection();

    try {
        // 1) Fetch all orders created by this user
        //fetch orders for the logged in user
        $sql = "
            SELECT 
                o.order_id,
                o.receiver_name,
                o.vendor_name,
                o.order_timestamp,
                o.order_status,
                o.approved_by,
                o.approved_at,
                o.rejection_reason,
                o.department_id,
                d.department_name,
                u_creator.username AS created_by_username,
                u_approver.username AS approved_by_username
            FROM orders o
            LEFT JOIN departments d ON o.department_id = d.department_id
            LEFT JOIN users u_creator ON o.user_id = u_creator.user_id
            LEFT JOIN users u_approver ON o.approved_by = u_approver.user_id
            WHERE o.user_id = :user_id
            ORDER BY o.order_timestamp DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute([':user_id' => $user['user_id']]);
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // 2) For each order, fetch its items
        foreach ($orders as &$order) {
            $itemsSql = "
                SELECT 
                    oi.order_item_id,
                    oi.item_id,
                    oi.quantity,
                    oi.unit_price,
                    i.name,
                    i.measuring_unit
                FROM order_items oi
                JOIN items i ON oi.item_id = i.item_id
                WHERE oi.order_id = :order_id
            ";
            $itemsStmt = $conn->prepare($itemsSql);
            $itemsStmt->execute([':order_id' => $order['order_id']]);
            $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);
            $order['items'] = $items;

            // 3) Calculate total
            $total = 0;
            foreach ($items as $it) {
                $total += ((float)$it['quantity']) * ((float)$it['unit_price']);
            }
            $order['total_amount'] = number_format($total, 2, '.', '');
            $order['item_count'] = count($items);
        }

        echo json_encode($orders);
        exit;

    } catch (PDOException $e) {
        error_log('my_orders.php DB error: ' . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database error while loading orders'
        ]);
        exit;
    }
}

getMyOrders();