<?php
// api/endpoints/item_history.php
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../config/session_manager.php';

function itemreport() {

$itemId = isset($_GET['item_id']) ? (int)$_GET['item_id'] : 0;

    if ($itemId <= 0) {
        http_response_code(400);
        echo json_encode([
            "status"  => "error",
            "message" => "Invalid or missing item_id"
        ]);
        return;
    }

try {
    $conn = getConnection();

    // 1. Fetch basic item info
    $itemSql = "
        SELECT 
            i.item_id,
            i.name,
            i.sku,
            i.stock_level,
            i.measuring_unit,
            i.item_cost,
            i.is_active,
            i.date_created,
            i.last_stock_received,
            c.name AS category_name,
            d.department_name
        FROM items i
        LEFT JOIN categories c ON i.category_id = c.category_id
        LEFT JOIN departments d ON i.department_id = d.department_id
        WHERE i.item_id = :item_id
        LIMIT 1
    ";
    $itemStmt = $conn->prepare($itemSql);
    $itemStmt->execute([':item_id' => $itemId]);
    $item = $itemStmt->fetch(PDO::FETCH_ASSOC);

    if (!$item) {
        http_response_code(404);
        echo json_encode([
            "status"  => "error",
            "message" => "Item not found"
        ]);
        exit;
    }

    // 2. Inventory movement logs (inventory_logs)
    $logsSql = "
        SELECT 
            id,
            item_id,
            quantity_added,
            old_quantity,
            new_quantity,
            update_date,
            user_name,
            change_type
        FROM inventory_logs
        WHERE item_id = :item_id
        ORDER BY update_date DESC
    ";
    $logsStmt = $conn->prepare($logsSql);
    $logsStmt->execute([':item_id' => $itemId]);
    $inventoryLogs = $logsStmt->fetchAll(PDO::FETCH_ASSOC);

    // 3. Orders involving this item (order_items + orders)
    $ordersSql = "
        SELECT 
            oi.order_item_id,
            oi.order_id,
            oi.quantity,
            oi.unit_price,
            o.receiver_name,
            o.vendor_name,
            o.department_name,
            o.department_id,
            o.order_timestamp,
            o.status,
            o.order_status,
            o.amount_paid,
            o.approved_by,
            o.approved_at
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        WHERE oi.item_id = :item_id
        ORDER BY o.order_timestamp DESC
    ";
    $ordersStmt = $conn->prepare($ordersSql);
    $ordersStmt->execute([':item_id' => $itemId]);
    $orders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);

    // 4. Low stock alerts
    $alertsSql = "
        SELECT 
            alert_id,
            item_id,
            stock_level,
            created_at,
            resolved
        FROM low_stock_alerts
        WHERE item_id = :item_id
        ORDER BY created_at DESC
    ";
    $alertsStmt = $conn->prepare($alertsSql);
    $alertsStmt->execute([':item_id' => $itemId]);
    $alerts = $alertsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Response
    echo json_encode([
        "status" => "success",
        "data"   => [
            "item"           => $item,
            "inventory_logs" => $inventoryLogs,
            "orders"         => $orders,
            "low_stock"      => $alerts
        ]
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        "status"  => "error",
        "message" => "Server error: " . $e->getMessage()
    ]);
}
}

itemreport();