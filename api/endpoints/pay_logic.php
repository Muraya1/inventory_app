<?php
header("Content-Type: application/json");
include_once '../config/helper.php'; // Ensure this path is correct
require_once '../config/database.php';
require_once '../config/helper.php';

$method = $_SERVER['REQUEST_METHOD'];
 $conn = getConnection();

if ($method === 'GET') {
    $dept_id = $_GET['dept_id'];

    // 1. Get Total Debt (All time cost of all orders)
    $stmt = $conn->prepare("SELECT SUM(oi.quantity * i.item_cost) as total_debt 
                            FROM orders o 
                            JOIN order_items oi ON o.order_id = oi.order_id 
                            JOIN items i ON oi.item_id = i.item_id 
                            WHERE o.department_id = :id");
    $stmt->execute([':id' => $dept_id]);
    $debt = $stmt->fetch(PDO::FETCH_ASSOC)['total_debt'] ?? 0;

    // 2. Get Payment History
    $stmt = $conn->prepare("SELECT * FROM department_payments WHERE department_id = :id ORDER BY payment_date ASC");
    $stmt->execute([':id' => $dept_id]);
    $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(["total_debt" => $debt, "history" => $history]);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $sql = "INSERT INTO department_payments (department_id, amount, payment_date, reference) 
            VALUES (:dept_id, :amount, :p_date, :ref)";
    $stmt = $conn->prepare($sql);
    $success = $stmt->execute([
        ':dept_id' => $data['dept_id'],
        ':amount'  => $data['amount'],
        ':p_date'  => $data['date'],
        ':ref'     => $data['ref']
    ]);

    echo json_encode(["success" => $success]);
}