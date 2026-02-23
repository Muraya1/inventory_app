<?php

require_once '../config/database.php';
require_once '../config/session_manager.php';

function getitem() {
    $conn = getConnection();
    // Only select the specific columns needed
    $sql = "
        SELECT 
            item_id,
            name
        FROM items
        ORDER BY date_created DESC
    ";

    global $conn;
    
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "data"   => $items
        ]);
    } catch (PDOException $e) {
        // Good practice to catch errors
        echo json_encode([
            "status" => "error",
            "message" => $e->getMessage()
        ]);
    }
}
getitem();