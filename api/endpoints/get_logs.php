<?php


header('Content-Type: application/json');
include_once '../config/database.php';

$conn = getConnection();

try {
    $stmt = $conn->prepare("
        SELECT 
            l.item_id,
            i.name,
            l.restock_date,
            l.admin_name,
            l.old_quantity,
            l.quantity_added,
            l.new_quantity
        FROM inventory_restocks l
        JOIN items i ON l.item_id = i.item_id
        ORDER BY l.restock_date DESC
    ");

    $stmt->execute();
    $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode($logs);

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "message" => $e->getMessage()
    ]);
}

