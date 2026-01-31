<?php
require_once '../config/database.php';
require_once '../config/helper.php';

$conn = getConnection();

$stmt = $conn->prepare("
    SELECT 
    a.created_at, 
    i.name as item_name, 
    a.stock_level
FROM low_stock_alerts a
JOIN items i ON a.item_id = i.item_id
WHERE a.resolved = 0
ORDER BY a.created_at DESC;
");
$stmt->execute();

$alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);

sendResponse(200, $alerts);
exit;
