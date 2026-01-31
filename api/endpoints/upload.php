<?php
// header("Access-Control-Allow-Origin: *"); 
// header("Access-Control-Allow-Headers: Content-Type, Authorization");
// header("Access-Control-Allow-Methods: POST");
// require_once '../config/database.php';

// function sendResponse($status, $data) {
//     header('Content-Type: application/json');
//     http_response_code($status);
//     echo json_encode($data);
//     exit();
// }

// function handleFileUpload() {
//     $conn = getConnection();

//     if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
//         sendResponse(405, ["message" => "Method not allowed."]);
//     }
    
//     // 1. Basic Validation (Check for file and item ID)
//     if (!isset($_FILES['item_image']) || !isset($_POST['item_id'])) {
//         sendResponse(400, ["message" => "Missing file or item ID."]);
//     }

//     $itemId = (int)$_POST['item_id'];
//     $file = $_FILES['item_image'];
    
//     if ($file['error'] !== UPLOAD_ERR_OK) {
//         sendResponse(500, ["message" => "File upload error: " . $file['error']]);
//     }

//     // 2. Security and Sanitization
//     $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
//     if (!in_array($file['type'], $allowedTypes)) {
//         sendResponse(400, ["message" => "Invalid file type. Only JPG, PNG, and GIF are allowed."]);
//     }

//     // Create unique filename based on item ID and a timestamp
//     $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
//     $filename = "item_{$itemId}_" . time() . ".{$extension}";
    
//     // Define target directory and full path
//     $uploadDir = '../../uploads/item_images/';
//     $targetPath = $uploadDir . $filename;
    
//     // The relative path stored in the DB (accessible via HTTP)
//     $relativePath = 'uploads/item_images/' . $filename; 

//     // 3. Move the file
//     if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        
//         // 4. Update the Database
//         $sql = "UPDATE Items SET image_path = :path WHERE item_id = :id";
//         try {
//             $stmt = $conn->prepare($sql);
//             $stmt->bindParam(':path', $relativePath);
//             $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
//             $stmt->execute();

//             if ($stmt->rowCount() > 0) {
//                 sendResponse(200, [
//                     "message" => "Image uploaded and database updated.",
//                     "image_path" => $relativePath
//                 ]);
//             } else {
//                 // Should only happen if item ID doesn't exist
//                 sendResponse(404, ["message" => "Image uploaded but item not found."]);
//             }
//         } catch (PDOException $e) {
//             sendResponse(500, ["message" => "Database error updating item path."]);
//         }
//     } else {
//         sendResponse(500, ["message" => "Failed to move uploaded file."]);
//     }
// }

// handleFileUpload();

///////////////////////////////////////////////////////////////////////
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
require_once '../config/database.php';

function sendResponse($status, $data) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function handleFileUpload() {
    $conn = getConnection();

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(405, ["message" => "Method not allowed."]);
    }
    
    // 1. Basic Validation (Check for file and item ID)
    if (!isset($_FILES['item_image']) || !isset($_POST['item_id'])) {
        sendResponse(400, ["message" => "Missing file or item ID."]);
    }

    $itemId = (int)$_POST['item_id'];
    $file = $_FILES['item_image'];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        sendResponse(500, ["message" => "File upload error: " . $file['error']]);
    }

    // 2. Security and Sanitization
    $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowedTypes)) {
        sendResponse(400, ["message" => "Invalid file type. Only JPG, PNG, and GIF are allowed."]);
    }

    // Create unique filename based on item ID and a timestamp
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = "item_{$itemId}_" . time() . ".{$extension}";
    
    // Define target directory and full path
    $uploadDir = '../../uploads/item_images/';
    $targetPath = $uploadDir . $filename;
    
    // The relative path stored in the DB (accessible via HTTP)
    $relativePath = 'uploads/item_images/' . $filename; 

    // 3. Move the file
    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        
        // 4. Update the Database
        $sql = "UPDATE Items SET image_path = :path WHERE item_id = :id";
        try {
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':path', $relativePath);
            $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
            $stmt->execute();

            if ($stmt->rowCount() > 0) {
                sendResponse(200, [
                    "message" => "Image uploaded and database updated.",
                    "image_path" => $relativePath
                ]);
            } else {
                // Should only happen if item ID doesn't exist
                sendResponse(404, ["message" => "Image uploaded but item not found."]);
            }
        } catch (PDOException $e) {
            sendResponse(500, ["message" => "Database error updating item path."]);
        }
    } else {
        sendResponse(500, ["message" => "Failed to move uploaded file."]);
    }
}

handleFileUpload();
