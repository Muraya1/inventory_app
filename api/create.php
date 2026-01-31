<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");

require_once(__DIR__ . '../config/database.php');



function sendResponse($status, $data) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit();
}

$conn = getConnection();
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    sendResponse(405, ["message" => "Method not allowed."]);
}

// Parse body
$data = json_decode(file_get_contents("php://input"));
$resource = isset($_GET['resource']) ? $_GET['resource'] : null;

if (!$resource) {
    sendResponse(400, ["message" => "Missing resource parameter."]);
}

try {
    if ($resource === 'category') {
        if (empty($data->name)) {
            sendResponse(400, ["message" => "Category name is required."]);
        }

        $sql = "INSERT INTO Categories (name) VALUES (:name)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':name', $data->name);
        $stmt->execute();

        sendResponse(201, [
            "message" => "Category created successfully.",
            "id" => $conn->lastInsertId(),
            "name" => $data->name
        ]);

    } elseif ($resource === 'item') {
        if (empty($data->name) || empty($data->category_id) || empty($data->sku)) {
            sendResponse(400, ["message" => "Missing required fields."]);
        }

        $sql = "INSERT INTO Items (name, category_id, sku, quantity) VALUES (:name, :category_id, :sku, :quantity)";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':name', $data->name);
        $stmt->bindParam(':category_id', $data->category_id);
        $stmt->bindParam(':sku', $data->sku);
        $stmt->bindValue(':quantity', $data->quantity ?? 0, PDO::PARAM_INT);
        $stmt->execute();

        sendResponse(201, [
            "message" => "Item created successfully.",
            "id" => $conn->lastInsertId(),
            "name" => $data->name
        ]);

    } else {
        sendResponse(404, ["message" => "Unknown resource."]);
    }
} catch (PDOException $e) {
    sendResponse(500, [
        "message" => "Database error during creation.",
        "error" => $e->getMessage()
    ]);
}

