<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET");
require_once '../config/database.php';
require_once '../config/helper.php';


// function sendResponse($status, $data) {
//     header('Content-Type: application/json');
//     http_response_code($status);
//     echo json_encode($data);
//     exit();
// }

function fetchCategories() {
    $conn = getConnection();
    $sql = "SELECT category_id, name FROM Categories ORDER BY name";
    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        sendResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Database error fetching categories."]);
    }
}


function fetchItems() {
    $conn = getConnection();
    $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
    
    // NEW: Pagination parameters
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50; // Default limit
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $offset = ($page - 1) * $limit;

    if (!$categoryId) {
        sendResponse(400, ["message" => "Missing category ID."]);
    }

    // SQL with LIMIT and OFFSET
    $sql = "SELECT 
                item_id, 
                name, 
                stock_level, 
                category_id,
                image_path,
                date_created,
                last_stock_received
            FROM Items 
            WHERE category_id = :cat_id 
            AND is_active = 1
            ORDER BY name ASC
            LIMIT :limit OFFSET :offset"; // <<< Pagination added

    try {
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':cat_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT); // Bind as integer
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT); // Bind as integer
        $stmt->execute();
        
        // We also need the total count for the client to build pagination controls
        // $countStmt = $conn->prepare("SELECT COUNT(*) AS total FROM Items WHERE category_id = :cat_id");
        // $countStmt->bindParam(':cat_id', $categoryId, PDO::PARAM_INT);
        // $countStmt->execute();
        // $totalItems = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
        $countSql = "SELECT COUNT(*) AS total FROM Items 
                     WHERE category_id = :cat_id 
                     AND is_active = 1";
        
        $countStmt = $conn->prepare($countSql);
        $countStmt->bindParam(':cat_id', $categoryId, PDO::PARAM_INT);
        $countStmt->execute();
        $totalItems = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];


        sendResponse(200, [
            'data' => $stmt->fetchAll(PDO::FETCH_ASSOC),
            'total' => $totalItems,
            'page' => $page,
            'limit' => $limit
        ]);

    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Database error fetching items."]);
    }
}



// api/endpoints/data.php (Replace Main Execution Block)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// --- Main Execution Block (Routing) ---
// $method = $_SERVER['REQUEST_METHOD'];
// $resource = isset($_GET['resource']) ? $_GET['resource'] : null;

// if (!$resource) {
//     sendResponse(400, ["message" => "Missing resource parameter."]);
// }

// if ($method === 'GET') {
//     if ($resource === 'categories') {
//         fetchCategories();
//     } elseif ($resource === 'items') {
//         fetchItems();
//     } else {
//         sendResponse(404, ["message" => "Resource not found."]);
//     }}
    

// elseif ($method === 'POST') {
//     // --- POST Handling ---
//     $data = json_decode(file_get_contents("php://input"));
    
//     if ($resource === 'categories') {
//         if (!isset($data->name)) {
//             sendResponse(400, ["message" => "Missing category name."]);
//         }
//         createCategory($data->name); 
    
//     } // api/endpoints/data.php (Modify POST Handling in Main Execution Block)

// } elseif ($method === 'POST') {
//     // --- POST Handling ---
//     $data = json_decode(file_get_contents("php://input"));
//     $action = isset($_GET['action']) ? $_GET['action'] : null; // Check for action parameter

//     if ($resource === 'categories') {
//         // ... (Existing createCategory logic) ...
        
//     } elseif ($resource === 'items') { 
        
//         if ($action === 'receive') { // <<< NEW STOCK RECEIVING ROUTE
//             if (!isset($data->item_id) || !isset($data->quantity)) {
//                 sendResponse(400, ["message" => "Missing item ID or quantity for receiving."]);
//             }
//             updateStock($data->item_id, $data->quantity);
//         }
        
//         // ... (Existing createItem logic) ...
//         // Ensure you keep the existing createItem logic for when action is NOT 'receive'
//         else if (!isset($data->name) || !isset($data->category_id) || !isset($data->stock_level)) {
//             sendResponse(400, ["message" => "Missing item name, category ID, or stock level."]);
//         }
//         createItem($data->name, $data->category_id, $data->stock_level);

//     } else {
//         sendResponse(405, ["message" => "POST method not supported for this resource."]);
//     }
// } else {
//     sendResponse(405, ["message" => "Method not allowed."]);

// }
////////////////////////////////////////////////////////////////////////////
// --- Main Execution Block (Routing) ---
$method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? $_GET['resource'] : null;
$action = isset($_GET['action']) ? $_GET['action'] : null; // moved here globally

if (!$resource) {
    sendResponse(400, ["message" => "Missing resource parameter."]);
}
if ($method === 'DELETE') {
    if ($resource === 'category') {
        deleteCategory();
    } elseif ($resource === 'item') {
        deleteItem();
    } else {
        sendResponse(404, ["message" => "Resource not found for deletion."]);
    }
} 
else
if ($method === 'GET') {
    // --- GET Handling ---
    if ($resource === 'categories') {
        fetchCategories();
    } elseif ($resource === 'items') {
        fetchItems();
      
    } 
    elseif ($resource === 'departments') {
        sendResponse(404, ["message" => "NO department not found."]);
        //fetchDepartments();
      
    }
    elseif ($resource === 'reports') { // <<< NEW ROUTE
        fetchOrderReports();     
    }
    elseif ($resource === 'report_items') { // <<< NEW ROUTE
        fetchItemReport();     
    } else {
        sendResponse(404, ["message" => "Resource not found."]);
    }

} elseif ($method === 'POST') {
    // --- POST Handling ---
    $data = json_decode(file_get_contents("php://input"));

    if ($resource === 'categories') {
        if (!isset($data->name)) {
            sendResponse(400, ["message" => "Missing category name."]);
        }
        createCategory($data->name);
    } elseif ($resource === 'items') {
        handleItemUpdateOrCreate();
    }

    
    elseif ($resource === 'items') {
        // Handle actions within items resource
        if ($action === 'receive') {
            if (!isset($data->item_id) || !isset($data->quantity)) {
                sendResponse(400, ["message" => "Missing item ID or quantity for receiving."]);
            }
            updateStock($data->item_id, $data->quantity);
        } 
        else {
            if (!isset($data->name) || !isset($data->category_id) || !isset($data->stock_level)) {
                sendResponse(400, ["message" => "Missing item name, category ID, or stock level."]);
            }
            createItem($data->name, $data->category_id, $data->stock_level);
        }
    } 
    /////////////////////////////////////////
    elseif ($resource === 'item_id') {
        // Use $_POST because JS is sending FormData
        $item_id   = $_POST['item_id'] ?? null;
        $stock_add = $_POST['stock_add'] ?? null;
        $item_cost = $_POST['item_cost'] ?? null;
        $item_image = $_POST['item_image'] ?? null;

        if (!$item_id) {
            sendResponse(400, ["message" => "Missing item_id."]);
        }
         $items_image = $_FILES['items_image'] ?? null;
        // Call your update function with these parameters
        updateItem($item_id, $stock_add, $item_cost, $items_image);
    }
    
    //////////////////////////
    else {
        sendResponse(405, ["message" => "POST method not supported for this resource."]);
    }

}


 else {
    sendResponse(405, ["message" => "Method not allowed at the data.php."]);
}


// api/endpoints/data.php (Add this new function)

/**
 * Handles the creation of a new category via POST request.
 * NOTE: This is where you would enforce authorization (e.g., check user role = 'admin').
 */
function createCategory($name) {
    //checkRole(['admin']); 
    $conn = getConnection();
    
    // 1. Basic Sanitization (CRITICAL)
    $name = trim($name);
    if (empty($name)) {
        sendResponse(400, ["message" => "Category name cannot be empty."]);
    }
//database script for creating category
    // 2. Prepare SQL Statement
    $sql = "INSERT INTO Categories (name) VALUES (:name)";
    
    try {
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':name', $name);
        $stmt->execute();

        $newId = $conn->lastInsertId();

        sendResponse(201, [
            "message" => "Category created successfully.",
            "category_id" => $newId,
            "name" => $name
        ]);

    } catch (PDOException $e) {
        // Handle duplicate name error (error code '23000' is common for unique constraints)
        if ($e->getCode() === '23000') {
            sendResponse(409, ["message" => "A category with that name already exists."]);
        }
        sendResponse(500, ["message" => "Database error during category creation."]);
    }
}

// api/endpoints/data.php (Add this new function)

/**
 * Handles the creation of a new item via POST request.
 * Requires name, category_id, and stock_level.
 */
function createItem($name, $categoryId, $stockLevel) {
    //checkRole(['admin']);
    $conn = getConnection();
    
    // 1. Basic Sanitization and Validation
    $name = trim($name);
    $stockLevel = (int)$stockLevel;
    $categoryId = (int)$categoryId;
    
    if (empty($name) || $stockLevel < 0 || $categoryId <= 0) {
        sendResponse(400, ["message" => "Invalid item data provided."]);
    }

    // Using NULL for SKU for simplicity, though a real system would generate one
    // $sql = "INSERT INTO Items (name, sku, category_id, stock_level) 
    //         VALUES (:name, NULL,  :cat_id, :stock_level)";
    $sql = "INSERT INTO Items (name, sku, category_id, stock_level, date_created, last_stock_received) 
        VALUES (:name, NULL, :cat_id, :stock_level, NOW(), NOW())";        
    
    try {
        $check = $conn->prepare("SELECT COUNT(*) FROM Items WHERE name = :name AND category_id = :cat_id");
        $check->execute([':name' => $name, ':cat_id' => $categoryId]);
      if ($check->fetchColumn() > 0) {
         sendResponse(409, ["message" => "Item already exists in this category."]);
}
//     // 2. Prepare SQL Statement

        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':name', $name);
        $stmt->bindParam(':cat_id', $categoryId, PDO::PARAM_INT);
        $stmt->bindParam(':stock_level', $stockLevel, PDO::PARAM_INT);
        $stmt->execute();


        $newId = $conn->lastInsertId();

        sendResponse(201, [
            "message" => "Item created successfully.",
            "item_id" => $newId,
            "name" => $name
        ]);

    } catch (PDOException $e) {
    sendResponse(500, [
        "message" => "Database error during item creation.",
        "error" => $e->getMessage()
    ]);
}

}


// api/endpoints/data.php (Add this new function)

/**
 * Handles stock receiving by adding to the existing stock level.
 */
function updateStock($itemId, $quantityReceived) {
    //checkRole(['admin']);
    $conn = getConnection();
    
    $itemId = (int)$itemId;
    $quantityReceived = (int)$quantityReceived;
    
    if ($itemId <= 0 || $quantityReceived <= 0) {
        sendResponse(400, ["message" => "Invalid item ID or quantity."]);
    }
    
    // $sql = "UPDATE Items 
    //         SET stock_level = stock_level + :qty_received 
    //         WHERE item_id = :item_id";
    $sql = "UPDATE Items 
        SET stock_level = stock_level + :qty_received,
            last_stock_received = NOW() 
        WHERE item_id = :item_id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':qty_received', $quantityReceived, PDO::PARAM_INT);
        $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            sendResponse(200, ["message" => "Stock successfully updated."]);
        } else {
            sendResponse(404, ["message" => "Item not found or stock did not change."]);
        }
    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Database error during stock update."]);
    }
}

// api/endpoints/data.php (Add this new function)

function fetchItemReport() {
    //checkRole(['admin']);
    $conn = getConnection();
    // Fetch all items, including the new date_created column
    // $sql = "SELECT item_id, name, stock_level, category_id, date_created 
    //         FROM Items 
    //         ORDER BY date_created DESC";
    $sql = "SELECT item_id, name, stock_level, category_id, date_created, last_stock_received
        FROM Items 
        ORDER BY date_created DESC";        

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        sendResponse(200, $stmt->fetchAll(PDO::FETCH_ASSOC));
    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Database error fetching item report."]);
    }
}

function deleteCategory() {
    global $user_role;
    $conn = getConnection();
    
    // 1. Security check: Only admins can delete.
    // Assuming checkRole is called before this, but good to double check 
    // if this function is called directly by the router.
    if ($user_role !== 'admin') {
         sendResponse(403, ["message" => "Forbidden: Only administrators can delete categories."]);
    }
    
    // 2. Get data from JSON body
    $data = json_decode(file_get_contents("php://input"));
    $categoryId = $data->category_id ?? null;

    if (!$categoryId) {
        sendResponse(400, ["message" => "Missing category ID for deletion."]);
    }

    try {
        // 3. Pre-check: Does this category have any items?
        $checkSql = "SELECT COUNT(*) FROM Items WHERE category_id = :id";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bindParam(':id', $categoryId, PDO::PARAM_INT);
        $checkStmt->execute();
        $itemCount = $checkStmt->fetchColumn();

        if ($itemCount > 0) {
            // HIGHLY RECOMMENDED: Prevent deletion to maintain data integrity
            sendResponse(409, [
                "message" => "Conflict: Cannot delete category. {$itemCount} item(s) are currently linked to it."
            ]);
            return;
        }

        // 4. Proceed with deletion
        $sql = "DELETE FROM Categories WHERE category_id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $categoryId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            sendResponse(200, ["message" => "Category ID {$categoryId} successfully deleted."]);
        } else {
            sendResponse(404, ["message" => "Category ID {$categoryId} not found or already deleted."]);
        }

    } catch (PDOException $e) {
        // Log the error but send a generic message
        error_log("DB Error in deleteCategory: " . $e->getMessage());
        sendResponse(500, ["message" => "A server error occurred during category deletion."]);
    }
}

function deleteItem() {
    //global $user_role;
    $conn = getConnection();
    $itemId = $data->item_id ?? null;
    // 1. Security check: Only admins can delete items.
    // 2. Get data from JSON body
    $data = json_decode(file_get_contents("php://input"));
    $itemId = $data->item_id ?? null;

    if (!$itemId) {
        sendResponse(400, ["message" => "Missing item ID for deletion."]);
    }

    try {
        // 3. Proceed with deletion from the Items table
        //$sql = "DELETE FROM Items WHERE item_id = :id";
        $sql = "UPDATE Items SET is_active = 0 WHERE item_id = :id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() > 0) {
            sendResponse(200, ["message" => "Item ID {$itemId} successfully deleted."]);
        } else {
            sendResponse(404, ["message" => "Item ID {$itemId} not found or already deleted."]);
        }

    } catch (PDOException $e) {
        // Log the error but send a generic message
        error_log("DB Error in deleteItem: " . $e->getMessage());
        sendResponse(500, ["message" => "A server error occurred during item deletion."]);
    }
}//

///////////////////////////////////////////////////////////////
// api/endpoints/data.php (Add the updateItem function)

// api/endpoints/data.php (Refactor the function that handles POST / item)

function handleItemUpdateOrCreate() {
    //global $user_role;
    $conn = getConnection();
    $measuringUnit = $_POST['measuring_unit'] ?? 'units';
    
    //checkRole(['admin', 'manager']); 

    // Data retrieval is the same for both ADD and EDIT
    $itemId = $_POST['item_id'] ?? null; // Null if adding a new item
    $itemName = $_POST['name'] ?? null;
    //$itemDescription = $_POST['description'] ?? null;
    $categoryId = $_POST['category_id'] ?? null;
    $itemCost = (int)($_POST['item_cost'] ?? 0);
    //$stockToAdd = (int)($_POST['stock'] ?? 0); // Only relevant for EDIT (modification)
    $stockLevel = (int)($_POST['stock_level'] ?? 0); // Only relevant for ADD (initial level)
   // $file = $_FILES['item_image'];
    if (!$itemName || !$categoryId) {
        sendResponse(400, ["message" => "Missing Item Name or Category ID."]);
    }


    $imagePath = null;
    // ... (File Upload Logic remains the same - handles $_FILES['picture']) ...
    if (isset($_FILES['item_image']) && $_FILES['item_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/item_images/';
        // $uploadDir = __DIR__ . '/../../uploads/item_images/';
        $file = $_FILES['item_image'];
        //if (!is_dir($uploadDir)) { mkdir($uploadDir, 0777, true); }
        
        //$fileName = basename($_FILES['picture']['name']);
        ///////////
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = "item_{$itemId}_" . time() . ".{$extension}";
        //////////
        //$uniqueName = time() . '_' . $fileName; 
        $targetFile = $uploadDir . $filename;
        
        if (move_uploaded_file($_FILES['item_image']['tmp_name'], $targetFile)) {
            //$imagePath = $targetFile; // Store the path to save in DB
            $imagePath = "uploads/item_images/" . $filename; // Relative path for DB
        } else {
            sendResponse(500, ["message" => "Failed to move uploaded file."]);
        }
    }
  

    try {
         if ($itemId) {

         } 
         else {
            // --- NEW ITEM CREATION ---
            $sql = "INSERT INTO Items (name, category_id, stock_level, image_path, measuring_unit, item_cost) 
                    VALUES (:name, :cat_id, :stock_level, :image_path, :unit, :item_cost)"; // <-- New column added
            
            $stmt = $conn->prepare($sql);
            // Stock is set to the initial level (0 from JS)
            $stmt->bindParam(':stock_level', $stockLevel, PDO::PARAM_INT);
            $stmt->bindParam(':unit', $measuringUnit);
            $stmt->bindParam(':item_cost', $itemCost);
            $successMessage = "New item created successfully.";
            $stockToAdd = null; // No need to bind this for INSERT
        }

        // Bind common parameters
        $stmt->bindParam(':name', $itemName);
        //$stmt->bindParam(':description', $itemDescription);
        $stmt->bindParam(':cat_id', $categoryId, PDO::PARAM_INT);
        if ($imagePath) {
            $stmt->bindParam(':image_path', $imagePath);
        } else if (!$itemId) {
             // Bind empty image path for INSERT if no file was uploaded
             $emptyImagePath = null; 
             $stmt->bindParam(':image_path', $emptyImagePath);
        }

        $stmt->execute();
        
        sendResponse(200, ["message" => $successMessage, "item_id" => $itemId ?: $conn->lastInsertId()]);

    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Database error during item handling: " . $e->getMessage()]);
    }
}
////////////////////////////////////////////////////////new function to hundle update

$itemId = $item_id;


// function updateItem($item_id, $stock_add, $item_cost, $items_image): void {
//     $conn = getConnection();

//     $itemId     = $item_id;
//     $stockToAdd = $stock_add;
//     $itemCost   = $item_cost;
//    // $image = basename($item_image);

//     ///////////////////////
//     $imagePath = null;

//     // ... (File Upload Logic remains the same - handles $_FILES['picture']) ...
//     if (isset($_FILES['items_image']) && $_FILES['items_image']['error'] === UPLOAD_ERR_OK) {
//         $uploadDir = '../../uploads/item_images/';
        
//         $file = $_FILES['items_image'];
        
//         $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
//         $filename = "item_{$itemId}_" . time() . ".{$extension}";
         
//         $targetFile = $uploadDir . $filename;
        
//         if (move_uploaded_file($_FILES['items_image']['tmp_name'], $targetFile)) {
            
//             $imagePath = "uploads/item_images/" . $filename; // Relative path for DB
//         } else {
//             sendResponse(500, ["message" => "Failed to move uploaded file."]);
//         }
//     }
//     ///////////////////////

//     if (!$itemId) {
//         http_response_code(400);
//         exit('Missing item_id');
//     }

//     $sql = "
//     UPDATE Items
//     SET
//         last_stock_received = NOW(),
//         stock_level = stock_level + :stock_add,
//         item_cost = :item_cost
// ";

// if ($imagePath !== null) {
//     $sql .= ", image_path = :items_image";
// }

// $sql .= " WHERE item_id = :id";

//     $stmt = $conn->prepare($sql);
//     $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
//     $stmt->bindParam(':stock_add', $stockToAdd, PDO::PARAM_INT);
//     $stmt->bindParam(':item_cost', $itemCost, PDO::PARAM_STR);
//     //$stmt->bindParam(':item_image', $image, PDO::PARAM_STR);
//     //$stmt->bindParam(':items_image', $imagePath);
//     // Bind image properly
//     if ($imagePath !== null) {
//         $stmt->bindParam(':items_image', $imagePath, PDO::PARAM_STR);
//      }// else {
//     //     $stmt->bindValue(':items_image', null, PDO::PARAM_NULL);
//     // }
    
//     $stmt->execute();
//     sendResponse(200, [
//     "message" => "Item updated successfully"
// ]);
// exit;
// }
function updateItem($item_id, $stock_add, $item_cost, $items_image): void {
    $conn = getConnection();

    $itemId     = (int)$item_id;
    $stockToAdd = (int)$stock_add;
    $itemCost   = $item_cost;
    $imagePath  = null;

    // 1. Fetch the CURRENT stock level before we change it (Old Quantity)
    $preStmt = $conn->prepare("SELECT stock_level FROM Items WHERE item_id = :id");
    $preStmt->execute([':id' => $itemId]);
    $oldQuantity = (int)$preStmt->fetchColumn();

    // --- File Upload Logic ---
    if (isset($_FILES['items_image']) && $_FILES['items_image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../../uploads/item_images/';
        $file = $_FILES['items_image'];
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = "item_{$itemId}_" . time() . ".{$extension}";
        $targetFile = $uploadDir . $filename;
        
        if (move_uploaded_file($file['tmp_name'], $targetFile)) {
            $imagePath = "uploads/item_images/" . $filename;
        } else {
            sendResponse(500, ["message" => "Failed to move uploaded file."]);
            return;
        }
    }

    try {
        $conn->beginTransaction();

        // 2. Perform the Update
        $sql = "UPDATE Items SET 
                    last_stock_received = NOW(),
                    stock_level = stock_level + :stock_add,
                    item_cost = :item_cost";

        if ($imagePath !== null) {
            $sql .= ", image_path = :items_image";
        }
        $sql .= " WHERE item_id = :id";

        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':id', $itemId, PDO::PARAM_INT);
        $stmt->bindParam(':stock_add', $stockToAdd, PDO::PARAM_INT);
        $stmt->bindParam(':item_cost', $itemCost, PDO::PARAM_STR);
        if ($imagePath !== null) {
            $stmt->bindParam(':items_image', $imagePath, PDO::PARAM_STR);
        }
        $stmt->execute();

        // 3. LOG THE CHANGE specifically as STOCK_REFRESH
        $newQuantity = $oldQuantity + $stockToAdd;
        $logSql = "INSERT INTO inventory_logs 
                   (item_id, old_quantity, quantity_added, new_quantity, change_type, update_date) 
                   VALUES (:id, :old, :added, :new, 'STOCK_REFRESH', NOW())";
        
        $logStmt = $conn->prepare($logSql);
        $logStmt->execute([
            ':id'    => $itemId,
            ':old'   => $oldQuantity,
            ':added' => $stockToAdd,
            ':new'   => $newQuantity
        ]);

        $conn->commit();

        sendResponse(200, ["message" => "Item updated and logged successfully"]);
        
    } catch (Exception $e) {
        $conn->rollBack();
        error_log("Update Error: " . $e->getMessage());
        sendResponse(500, ["message" => "Error updating item: " . $e->getMessage()]);
    }
    exit;
}

function fetchOrderReports() {
    $conn = getConnection();

    try {
        $sql = "
            SELECT 
                o.order_id,
                o.receiver_name,
                o.vendor_name,
                o.department_name,
                o.order_timestamp,
                SUM(oi.quantity * i.item_cost) AS total_order_cost
            FROM Orders o
            INNER JOIN Order_Items oi ON o.order_id = oi.order_id
            INNER JOIN Items i ON oi.item_id = i.item_id
            GROUP BY 
                o.order_id,
                o.receiver_name,
                o.vendor_name,
                o.department_name,
                o.order_timestamp
            ORDER BY o.order_timestamp DESC
        ";

        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $reports = $stmt->fetchAll(PDO::FETCH_ASSOC);

        sendResponse(200, ["data" => $reports]);

    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Report fetch failed: " . $e->getMessage()]);
    }
}
