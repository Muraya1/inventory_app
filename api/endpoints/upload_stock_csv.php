<?php
require_once '../config/database.php';

$conn = getConnection();
$csc_file = null;

if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(['message' => 'CSV file upload failed']);
    exit;
}

$handle = fopen($_FILES['csv_file']['tmp_name'], 'r');

if (!$handle) {
    http_response_code(400);
    echo json_encode(['message' => 'Unable to read uploaded CSV']);
    exit;
}

// Skip header row
fgetcsv($handle);

$conn->beginTransaction();

try {
    while (($data = fgetcsv($handle, 1000, ",")) !== false) {

        $itemId     = intval($data[0]);
        $stockToAdd = intval($data[3]); // ADD_NEW_STOCK
        $itemCost   = floatval($data[4]); // NEW_ITEM_COST




        if ($itemId <= 0 || $stockToAdd <= 0) {
            continue; // Skip invalid or empty rows
        }

        // 1️⃣ Get current stock
        $stmt = $conn->prepare("SELECT stock_level FROM Items WHERE item_id = ?");
        $stmt->execute([$itemId]);
        $currentStock = $stmt->fetchColumn();

        //////////////////////////////////////////




        if ($currentStock === false) continue;

        $newStock = $currentStock + $stockToAdd;

        // 2️⃣ Update Items table
        $updateStmt = $conn->prepare("
            UPDATE Items 
            SET stock_level = ?, item_cost = ?
            WHERE item_id = ?
        ");
        $updateStmt->execute([$newStock, $itemCost, $itemId]);

        // 3️⃣ Log stock update
        $logStmt = $conn->prepare("
            INSERT INTO inventory_logs 
            (item_id, old_quantity, quantity_added, new_quantity, update_date)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $logStmt->execute([
            $itemId,
            $currentStock,
            $stockToAdd,
            $newStock
        ]);
        $restockStmt = $conn->prepare("
    INSERT INTO inventory_restocks 
    (item_id, quantity_added, unit_cost, admin_name, source_file)
    VALUES (?, ?, ?, ?, ?)
");

$restockStmt->execute([
    $itemId,
    $stockToAdd,
    $itemCost,
    'Admin', // You can pull this from your session: $_SESSION['username']
    $_FILES['csv_file']['name'] // Records which file triggered this restock
]);
    }

    $conn->commit();
    
    // sendResponse(200, [
    //         "success" => true,
    //         "message" => "Stock updated successfully via CSV."
    //     ]);

    header("Location: /inventory_app/client/views/bulk.html?upload=success");
    exit;
    
} catch (Exception $e) {
    $conn->rollBack();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error processing CSV',
        'error' => $e->getMessage()
    ]);
}

fclose($handle);
