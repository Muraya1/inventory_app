<?php


require_once '../config/database.php';
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'POST') {
    addproject();
} elseif ($method === 'GET') {
    fetchProjects();
} else {
    http_response_code(405);
    echo json_encode(['message' => 'Method Not Allowed']);
    exit;
}
function addproject(){
    $conn = getConnection();
    $data = json_decode(file_get_contents("php://input"), true);
    $projectName = $data['project_name'] ?? null;
    $projectNumber = $data['project_number'] ?? null;

    if (!$projectName) {
        http_response_code(400);
        echo json_encode(['message' => 'Project name is required']);
        exit;
    }

    try {
        $stmt = $conn->prepare("INSERT INTO projects (project_name, project_number, created_at) VALUES (?, ?, NOW())");
        $stmt->execute([$projectName, $projectNumber]);
        http_response_code(201);
        echo json_encode(['message' => 'Project added successfully']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
    }
}
/////////////////////////////////fetch projects for dropdown in order form
function fetchProjects() {
    $conn = getConnection();
    try {
        $stmt = $conn->query("SELECT project_number, project_name FROM projects ORDER BY project_name ASC");
        $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($projects);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Database error: ' . $e->getMessage()]);
    }
}