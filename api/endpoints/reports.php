<?php
require_once '../config/database.php';

function sendResponse($status, $data) {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit; // 🔥 always stop execution
}


if (isset($_GET['resource'])) {
    if ($_GET['resource'] === 'get_departments') {
        fetchAllDepartments();
        exit;
    }

    if ($_GET['resource'] === 'get_department_financial_report') {
        getDepartmentFinancialReport();
        exit;
    }
    if ($_GET['resource'] === 'get_department_balance') {
        getDepartmentBalance();
        exit;
    }
    if ($_GET['resource'] === 'total_expenditure') {
        fetchOrderbyDate();
        exit;
    }
}
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    add_department();
}



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function getDepartmentFinancialReport() {
    $conn = getConnection();
    
    // Get inputs from the frontend URL parameters
    $deptId = $_GET['dept_id'] ?? null;
    $startDate = $_GET['start_date'] ?? null; // Format: YYYY-MM-DD
    $endDate = $_GET['end_date'] ?? null;     // Format: YYYY-MM-DD

    if (!$deptId || !$startDate || !$endDate) {
        sendResponse(400, ["message" => "Department and Date Range are required."]);
    }

    try {
        // This query fetches orders and calculates the SUM for each one
        $sql = "SELECT 
                    o.order_id, 
                    o.order_timestamp, 
                    o.receiver_name, 
                    o.vendor_name,
                    SUM(oi.quantity * oi.unit_price) AS total_order_cost
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN items i ON oi.item_id = i.item_id
                WHERE o.department_id = :dept_id 
                  AND DATE(o.order_timestamp) BETWEEN :start AND :end
                GROUP BY o.order_id
                ORDER BY o.order_timestamp DESC";

        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':dept_id', $deptId, PDO::PARAM_INT);
        $stmt->bindParam(':start', $startDate);
        $stmt->bindParam(':end', $endDate);
        $stmt->execute();
        
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        


        /////////////////////////////////////////////////
        $itemSql = "SELECT 
                oi.item_id,
                i.name,
                oi.quantity,
                i.item_cost,
                (oi.quantity * i.item_cost) AS total_cost
            FROM order_items oi
            JOIN items i ON oi.item_id = i.item_id
            WHERE oi.order_id = :order_id";

        $itemStmt = $conn->prepare($itemSql);

        foreach ($orders as &$order) {
        $itemStmt->execute([':order_id' => $order['order_id']]);
        $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC); }
        sendResponse(200, ["data" => $orders]);
            

    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Database error: " . $e->getMessage()]);
    }
}

function fetchAllDepartments() {
    $conn = getConnection();
    try {
        // Fetch only the ID and Name
        $sql = "SELECT department_id, department_name FROM departments ORDER BY department_name ASC";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        
        $departments = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Send the list back to the browser
        echo json_encode($departments); 
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

// In api/endpoints/reports.php

function getDepartmentBalance() {
    $conn = getConnection();
    $deptId = $_GET['dept_id'];
    $start = $_GET['start_date'];
    $end = $_GET['end_date'];

    try {
        $sql = "SELECT 
                    SUM(oi.quantity_ordered * i.price) as total_accrued,
                    SUM(o.amount_paid) as total_paid
                FROM orders o
                JOIN order_items oi ON o.order_id = oi.order_id
                JOIN items i ON oi.item_id = i.item_id
                WHERE o.department_id = :dept_id 
                AND DATE(o.order_timestamp) BETWEEN :start AND :end";

        $stmt = $conn->prepare($sql);
        $stmt->execute([':dept_id' => $deptId, ':start' => $start, ':end' => $end]);
        $totals = $stmt->fetch(PDO::FETCH_ASSOC);

        // Calculate Debt
        $accrued = (float)$totals['total_accrued'];
        $paid = (float)$totals['total_paid'];
        $balance = $accrued - $paid;

        echo json_encode([
            "accrued" => $accrued,
            "paid" => $paid,
            "balance" => $balance
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

function add_department() {
    $conn = getConnection();
    $data = json_decode(file_get_contents(filename: "php://input"), true);

    if (!isset($data['department_name'])) {
        sendResponse(400, ["message" => "Missing department name."]);
    }

    $department_name = $data['department_name'];

    $sql = "INSERT INTO departments (department_name) VALUES (:department_name)";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':department_name', $department_name);
        $stmt->execute();

        sendResponse(201, ["message" => "Department added successfully."]);
    } catch (PDOException $e) {
        //sendResponse(500, ["message" => "Database error: " . $e->getMessage()]);
        sendResponse(500, ["message" => "THE DEPARTMENT NAME ALREADY EXISTS."]);
    }
}
function fetchOrderbyDate() {
    $conn = getConnection();
    $startDate = $_GET['start_date'] ?? null;
    $endDate = $_GET['end_date'] ?? null;

    if (!$startDate || !$endDate) {
        sendResponse(400, ["message" => "Start and end dates are required."]);
        return;
    }

    try {
        $sql = "SELECT SUM(oi.quantity * i.item_cost) as grand_total 
                FROM Orders o
                JOIN Order_Items oi ON o.order_id = oi.order_id
                JOIN Items i ON oi.item_id = i.item_id
                WHERE DATE(o.order_timestamp) BETWEEN :start AND :end";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':start' => $startDate,
            ':end' => $endDate
        ]);

        $result = $stmt->fetch(PDO::FETCH_ASSOC);

        // Handle case where no orders exist in that date range
        $total = $result['grand_total'] ? $result['grand_total'] : 0;

        sendResponse(200, ["total_expenditure" => $total]);

        

    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Database error: " . $e->getMessage()]);
    }
}