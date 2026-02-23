<?php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json");
require_once '../config/database.php';
require_once '../config/helper.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// function placeOrder() {
//     $conn = getConnection();
//     $data = json_decode(file_get_contents("php://input"));

//     if (
//         empty($data->user_id) ||
//         empty($data->receiver_name) ||
//         empty($data->vendor_name) ||
//         empty($data->department_name) ||
//         empty($data->items)
//     ) {
//         sendResponse(400, ["message" => "Missing required order data."]);
//         return;
//     }

//     $userId = (int)$data->user_id;
//     $receiverName = trim($data->receiver_name);
//     $vendorName = trim($data->vendor_name);
//     $departmentId = (int)$data->department_name;
//     $items = $data->items;

//     try {
//         $conn->beginTransaction();

//         // 1. Validate stock AND get current price
//         // ADDED 'item_cost' to the SELECT statement
//         $stockStmt = $conn->prepare(
//             "SELECT stock_level, name, item_cost FROM Items WHERE item_id = :item_id"
//         );

//         $validatedItems = []; // Temporary array to store prices for the next step

//         foreach ($items as $item) {
//             $stockStmt->execute([':item_id' => $item->item_id]);
//             $dbItem = $stockStmt->fetch(PDO::FETCH_ASSOC);

//             if (!$dbItem) {
//                 $conn->rollBack();
//                 sendResponse(404, ["message" => "Item ID {$item->item_id} not found"]);
//                 return;
//             }

//             if ($dbItem['stock_level'] < $item->quantity) {
//                 $conn->rollBack();
//                 sendResponse(409, ["message" => "Not enough stock for {$dbItem['name']}"]);
//                 return;
//             }

//             // Store the price so we don't have to query the DB again later
//             $validatedItems[$item->item_id] = $dbItem['item_cost'];
//         }

//         // 2. Insert order
//         $orderStmt = $conn->prepare(
//             "INSERT INTO Orders 
//              (user_id, department_id, receiver_name, vendor_name, order_timestamp)
//              VALUES (:user_id, :department_id, :receiver_name, :vendor_name, NOW())"
//         );

//         $orderStmt->execute([
//             ':user_id' => $userId,
//             ':department_id' => $departmentId,
//             ':receiver_name' => $receiverName,
//             ':vendor_name' => $vendorName
//         ]);

//         $orderId = $conn->lastInsertId();

//         // 3. Insert items + update stock
//         $updateStockStmt = $conn->prepare(
//             "UPDATE Items SET stock_level = stock_level - :qty WHERE item_id = :item_id"
//         );
        
//         // MODIFIED: Added unit_price to the INSERT statement
//         $insertItemStmt = $conn->prepare(
//             "INSERT INTO Order_Items (order_id, item_id, quantity, unit_price)
//              VALUES (:order_id, :item_id, :qty, :unit_price)"
//         );

//         foreach ($items as $item) {
//             // Update Stock
//             $updateStockStmt->execute([
//                 ':qty' => $item->quantity,
//                 ':item_id' => $item->item_id
//             ]);

//             // Insert Item with the "Snapshot" Price
//             $insertItemStmt->execute([
//                 ':order_id' => $orderId,
//                 ':item_id' => $item->item_id,
//                 ':qty' => $item->quantity,
//                 ':unit_price' => $validatedItems[$item->item_id] // Uses the price we grabbed in Step 1
//             ]);
//         }

//         $conn->commit();

//         sendResponse(201, [
//             "message" => "Order placed successfully",
//             "order_id" => $orderId
//         ]);

//     } catch (PDOException $e) {
//         if ($conn->inTransaction()) {
//             $conn->rollBack();
//         }
//         error_log($e->getMessage());
//         sendResponse(500, ["message" => "Server error while placing order"]);
//     }
// }


// function fetchOrderHistory() {
//     $conn = getConnection();
//     $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
//     $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
//     $offset = ($page - 1) * $limit;
    
//     $sql = "SELECT 
//                     o.order_id,
//                     u.username,
//                     o.receiver_name,
//                     o.order_timestamp,
//                     o.status,
//                     o.department_name, -- Ensure you use the ID for relations
//                     o.vendor_name
//                 FROM Orders o
//                 JOIN Users u ON o.user_id = u.user_id
//                 ORDER BY o.order_timestamp DESC
//                 LIMIT :limit OFFSET :offset";

//     try {
//         $stmt = $conn->prepare($sql);
//         $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
//         $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
//         $stmt->execute();
//         $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
//         foreach ($orders as &$order) {
//             // MODIFIED QUERY: Select unit_price from Order_Items (oi) 
//             // instead of item_cost from Items (i)
//             $itemStmt = $conn->prepare("
//                 SELECT 
//                     oi.quantity, 
//                     i.name, 
//                     oi.unit_price 
//                 FROM Order_Items oi
//                 JOIN Items i ON oi.item_id = i.item_id
//                 WHERE oi.order_id = :order_id
//             ");
//             $itemStmt->bindParam(':order_id', $order['order_id'], PDO::PARAM_INT);
//             $itemStmt->execute();
//             $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
            
//             $orderTotal = 0;
//             foreach ($items as $item) {
//                 // Calculation now uses the 'frozen' unit_price from the transaction record
//                 $itemTotal = $item['quantity'] * $item['unit_price'];
//                 $orderTotal += $itemTotal;
//             }

//             $order['items'] = $items;
//             $order['total_cost'] = $orderTotal; 
//         }

//         sendResponse(200, $orders);

//     } catch (PDOException $e) {
//         error_log($e->getMessage());
//         sendResponse(500, ["message" => "Database error fetching order history."]);
//     }
// }
function fetchOrderHistory() {
    $conn = getConnection();
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $offset = ($page - 1) * $limit;
    
    $sql = "SELECT 
                    o.order_id,
                    u.username,
                    o.receiver_name,
                    o.order_timestamp,
                    a.to_status,
                    o.department_name, -- Ensure you use the ID for relations
                    p.project_name
                FROM Orders o
                LEFT JOIN order_audit_history a ON o.order_id = a.order_id
                LEFT JOIN projects p ON o.project_number = p.project_number
                LEFT JOIN Users u ON o.user_id = u.user_id
                ORDER BY o.order_timestamp DESC
                LIMIT :limit OFFSET :offset";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($orders as &$order) {
            // MODIFIED QUERY: Select unit_price from Order_Items (oi) 
            // instead of item_cost from Items (i)
            $itemStmt = $conn->prepare("
                SELECT 
                    oi.quantity, 
                    i.name, 
                    oi.unit_price 
                FROM Order_Items oi
                JOIN Items i ON oi.item_id = i.item_id
                WHERE oi.order_id = :order_id
            ");
            $itemStmt->bindParam(':order_id', $order['order_id'], PDO::PARAM_INT);
            $itemStmt->execute();
            $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
            
            $orderTotal = 0;
            foreach ($items as $item) {
                // Calculation now uses the 'frozen' unit_price from the transaction record
                $itemTotal = $item['quantity'] * $item['unit_price'];
                $orderTotal += $itemTotal;
            }

            $order['items'] = $items;
            $order['total_cost'] = $orderTotal; 
        }

        sendResponse(200, $orders);

    } catch (PDOException $e) {
        error_log($e->getMessage());
        sendResponse(500, ["message" => "Database error fetching order history from API endpoint!!!!."]);
    }
}

//--- Main Execution Block ---
$method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? $_GET['resource'] : null;
error_log('METHOD: ' . $method);
error_log('RESOURCE: ' . print_r($resource, true));
error_log('GET: ' . print_r($_GET, true));


switch ($method) {
    case 'POST':
        createOrder();
        //placeOrder();
        sendResponse(405, ["message" => "POST method not allowed in orders.php."]);
        break;


    case 'GET':
        if ($resource === 'history') {
            fetchOrderHistory();
        } elseif ($resource === 'report_orders') { // <<< NEW ROUTE
            fetchOrderReport();
        } elseif ($resource === 'item_id') {
            fetchitem();
        } else {
            sendResponse(400, ["message" => "Missing or invalid resource parameter."]);
        }
        break;

    default:
        sendResponse(405, ["message" => "Method in order.php not allowed not allowed."]);
        break;
}
// // ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // // api/endpoints/orders.php (Add this function)
function fetchitem() {
    $conn = getConnection();
    $itemId = isset($_GET['item_id']) ? intval($_GET['item_id']) : 0;

    if ($itemId <= 0) {
        sendResponse(400, ["message" => "Invalid item ID."]);
    }

    $sql = "SELECT item_id, name, stock_level, category_id FROM Items WHERE item_id = :item_id";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':item_id', $itemId, PDO::PARAM_INT);
        $stmt->execute();
        $item = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($item) {
            sendResponse(200, $item);
        } else {
            sendResponse(404, ["message" => "Item not found."]);
        }

    } catch (PDOException $e) {
        sendResponse(500, ["message" => "Database error fetching item details."]);
    }
}
// // /**
// //  * Fetches all orders with item details for reporting purposes.
// //  */
function fetchOrderReport() {
    
    $conn = getConnection();
    
    // SQL: Same structure as history, but we'll use a new route for clarity.
    $sql = "SELECT 
                o.order_id, 
                u.username, 
                o.receiver_name, 
                o.order_timestamp,  -- This is the write datetime
                o.status
            FROM Orders o
            JOIN Users u ON o.user_id = u.user_id
            ORDER BY o.order_timestamp DESC";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $orders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Loop through each order to fetch its associated items
        foreach ($orders as &$order) {
            $itemStmt = $conn->prepare("
                SELECT oi.quantity, i.name 
                FROM Order_Items oi
                JOIN Items i ON oi.item_id = i.item_id
                WHERE oi.order_id = :order_id
            ");
            $itemStmt->bindParam(':order_id', $order['order_id'], PDO::PARAM_INT);
            $itemStmt->execute();
            $order['items'] = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
        }

        sendResponse(200, $orders);

    } catch (PDOException $e) {
       // sendResponse(500, ["message" => "Database error fetching order report."]);
        sendResponse(500, ["message" => "Database error: " . $e->getMessage()]);
    }
}

// api/endpoints/orders_v2.php
header("Access-Control-Allow-Origin: *"); 
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, GET");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../config/helper.php';
require_once '../middleware/auth_check.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

/**
 * Create order WITHOUT deducting stock
 * Stock will only be deducted when admin approves
 */
function createOrder() {
    //$user = requireAuth();
    //$userId = 1; // TEMPORARY HARDCODED USER FOR TESTING
    //$userId = $user['user_id'];
    $conn = getConnection();
    $data = json_decode(file_get_contents("php://input"));

    if (isset($data->user_id)) {
        $userId = (int)$data->user_id;
    } else {
        sendResponse(400, ["message" => "Missing user_id in request body."]);
        return;
    }

    if (
        empty($data->receiver_name) ||
        empty($data->vendor_name) ||
        // empty($data->department_id) ||
        // empty($data->project_name) ||
        empty($data->items)
    ) {
        sendResponse(400, ["message" => "Missing required order data."]);
        return;
    }
    $userId = (int)$userId;
    $receiverName = trim($data->receiver_name);
    $vendorName = trim($data->vendor_name);
    $departmentId = (int)$data->department_id;
    $projectID = trim($data->project_id);
    $items = $data->items;

    try {
        $conn->beginTransaction();

        // 1. Validate items exist and get prices (but DON'T check stock yet)
        $stockStmt = $conn->prepare(
            "SELECT item_id, name, item_cost, stock_level FROM items WHERE item_id = :item_id"
        );

        $validatedItems = [];

        foreach ($items as $item) {
            $stockStmt->execute([':item_id' => $item->item_id]);
            $dbItem = $stockStmt->fetch(PDO::FETCH_ASSOC);

            if (!$dbItem) {
                $conn->rollBack();
                sendResponse(404, ["message" => "Item ID {$item->item_id} not found"]);
                return;
            }

            // Store price for order_items
            $validatedItems[$item->item_id] = [
                'name' => $dbItem['name'],
                'price' => $dbItem['item_cost'],
                'current_stock' => $dbItem['stock_level']
            ];
        }

        // 2. Insert order with PENDING status
        $orderStmt = $conn->prepare(
            "INSERT INTO orders 
             (user_id, department_id, receiver_name, vendor_name, order_timestamp, order_status, project_id)
             VALUES (:user_id, :department_id, :receiver_name, :vendor_name, NOW(), 'PENDING', :project_id)"
        );

        $orderStmt->execute([
            ':user_id' => $userId,
            ':department_id' => $departmentId,
            ':receiver_name' => $receiverName,
            ':vendor_name' => $vendorName,
            ':project_id' => $projectID
        ]);

        $orderId = $conn->lastInsertId();

        // 3. Insert order items (NO STOCK DEDUCTION)
        $insertItemStmt = $conn->prepare(
            "INSERT INTO order_items (order_id, item_id, quantity, unit_price)
             VALUES (:order_id, :item_id, :qty, :unit_price)"
        );

        foreach ($items as $item) {
            $insertItemStmt->execute([
                ':order_id' => $orderId,
                ':item_id' => $item->item_id,
                ':qty' => $item->quantity,
                ':unit_price' => $validatedItems[$item->item_id]['price']
            ]);
        }

        // 4. Create audit log entry
        $auditStmt = $conn->prepare(
            "INSERT INTO order_audit_history (order_id, from_status, to_status, changed_by, reason)
             VALUES (:order_id, 'PENDING', 'PENDING', :user_id, 'Order created')"
        );
        $auditStmt->execute([
            ':order_id' => $orderId,
            ':user_id' => $userId
        ]);

        // 5. Notify admins (create notification)
        $notifyStmt = $conn->prepare(
            "INSERT INTO order_notifications (order_id, user_id, message)
             SELECT :order_id, user_id, :message
             FROM users WHERE role = 'admin'"
        );
        $notifyStmt->execute([
            ':order_id' => $orderId,
            ':message' => "New order #{$orderId}    awaiting approval"
        ]);

        $conn->commit();

        sendResponse(201, [
            "success" => true,
            "message" => "Order submitted for approval",
            "order_id" => $orderId,
            "status" => "PENDING"
        ]);
        // 6.update projects table with project number and name and order id from orders table
        // $updateProjectStmt = $conn->prepare(
        //     "UPDATE projects p
        //      JOIN orders o ON o.project_name = p.project_name
        //      SET p.order_id = o.order_id
        //      WHERE o.order_id = :order_id"
        // );
        // $updateProjectStmt->execute([':order_id' => $orderId]); 

    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        error_log($e->getMessage());
        sendResponse(500, ["message" => "Server error: " . $e->getMessage()]);
    }
}

/**
 * Get order details with items
 */
function getOrderDetails() {
    $user = requireAuth();
    $conn = getConnection();
    
    $orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
    
    if ($orderId <= 0) {
        sendResponse(400, ["message" => "Invalid order ID"]);
        return;
    }

    try {
        // Get order
        $orderStmt = $conn->prepare(
            "SELECT o.*, u.username, d.department_name
             FROM orders o
             JOIN users u ON o.user_id = u.user_id
             LEFT JOIN departments d ON o.department_id = d.department_id
             WHERE o.order_id = :order_id"
        );
        $orderStmt->execute([':order_id' => $orderId]);
        $order = $orderStmt->fetch(PDO::FETCH_ASSOC);

        if (!$order) {
            sendResponse(404, ["message" => "Order not found"]);
            return;
        }

        // Check access (user can see their own orders, admins can see all)
        if ($user['role'] !== 'admin' && $order['user_id'] != $user['user_id']) {
            sendResponse(403, ["message" => "Access denied"]);
            return;
        }

        // Get order items
        $itemsStmt = $conn->prepare(
            "SELECT oi.*, i.name, i.measuring_unit
             FROM order_items oi
             JOIN items i ON oi.item_id = i.item_id
             WHERE oi.order_id = :order_id"
        );
        $itemsStmt->execute([':order_id' => $orderId]);
        $order['items'] = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

        // Calculate total
        $total = 0;
        foreach ($order['items'] as $item) {
            $total += $item['quantity'] * $item['unit_price'];
        }
        $order['total_amount'] = $total;

        sendResponse(200, $order);

    } catch (PDOException $e) {
        error_log($e->getMessage());
        sendResponse(500, ["message" => "Database error"]);
    }
}

// Route handler
// $method = $_SERVER['REQUEST_METHOD'];

// if ($method === 'POST') {
//     createOrder();
// } elseif ($method === 'GET') {
//     getOrderDetails();
// } else {
//     sendResponse(405, ["message" => "Method not allowed"]);
// }