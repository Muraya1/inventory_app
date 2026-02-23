<?php

require_once '../config/database.php';

$conn = getConnection();

// Fetch items
$stmt = $conn->query("
    SELECT item_id, name, stock_level, item_cost 
    FROM Items 
    ORDER BY name ASC
");
$items = $stmt->fetchAll(PDO::FETCH_ASSOC);

// Force CSV download
header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=stock_update_template.csv');

$output = fopen('php://output', 'w');

// CSV Header
fputcsv($output, [
    'item_id',
    'item_name',
    'current_stock',
    'ADD_NEW_STOCK',
    'NEW_ITEM_COST',
    'SUPPLIER_NAME (OPTIONAL)',
    'SUPPLIER_INVOICE_NUMBER'
]);

// Data rows
foreach ($items as $item) {
    fputcsv($output, [
        $item['item_id'],
        $item['name'],
        $item['stock_level'],
        0, // User edits this
        $item['item_cost']
    ]);
}

fclose($output);
exit;
