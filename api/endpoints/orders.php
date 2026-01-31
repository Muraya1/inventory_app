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
//     $departmentId = (int)$data->department_name; // rename later to department_id
//     $items = $data->items;

//     try {
//         $conn->beginTransaction();

//         // 1. Validate stock
//         $stockStmt = $conn->prepare(
//             "SELECT stock_level, name FROM Items WHERE item_id = :item_id"
//         );

//         foreach ($items as $item) {
//             $stockStmt->execute([':item_id' => $item->item_id]);
//             $dbItem = $stockStmt->fetch(PDO::FETCH_ASSOC);

//             if (!$dbItem) {
//                 $conn->rollBack();
//                 sendResponse(409, [
//                     "message" => "Item not found"
//                 ]);
//                 return;
//             }

//             if ($dbItem['stock_level'] < $item->quantity) {
//                 $conn->rollBack();
//                 sendResponse(409, [
//                     "message" => "Not enough stock for {$dbItem['name']}"
//                 ]);
//                 return;
//             }
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
        

//         $insertItemStmt = $conn->prepare(
//             "INSERT INTO Order_Items (order_id, item_id, quantity)
//              VALUES (:order_id, :item_id, :qty)"
//         );

//         foreach ($items as $item) {
//             $updateStockStmt->execute([
//                 ':qty' => $item->quantity,
//                 ':item_id' => $item->item_id
//             ]);

//             $insertItemStmt->execute([
//                 ':order_id' => $orderId,
//                 ':item_id' => $item->item_id,
//                 ':qty' => $item->quantity
//             ]);
//         }

//         $conn->commit();

//         sendResponse(201, [
//             "message" => "Order placed successfully",
//             "order_id" => $orderId
//         ]);

//     } catch (PDOException $e) {
//         $conn->rollBack();
//         error_log($e->getMessage());
//         sendResponse(500, ["message" => "Server error while placing order"]);
//     }
// }
function placeOrder() {
    $conn = getConnection();
    $data = json_decode(file_get_contents("php://input"));

    if (
        empty($data->user_id) ||
        empty($data->receiver_name) ||
        empty($data->vendor_name) ||
        empty($data->department_name) ||
        empty($data->items)
    ) {
        sendResponse(400, ["message" => "Missing required order data."]);
        return;
    }

    $userId = (int)$data->user_id;
    $receiverName = trim($data->receiver_name);
    $vendorName = trim($data->vendor_name);
    $departmentId = (int)$data->department_name;
    $items = $data->items;

    try {
        $conn->beginTransaction();

        // 1. Validate stock AND get current price
        // ADDED 'item_cost' to the SELECT statement
        $stockStmt = $conn->prepare(
            "SELECT stock_level, name, item_cost FROM Items WHERE item_id = :item_id"
        );

        $validatedItems = []; // Temporary array to store prices for the next step

        foreach ($items as $item) {
            $stockStmt->execute([':item_id' => $item->item_id]);
            $dbItem = $stockStmt->fetch(PDO::FETCH_ASSOC);

            if (!$dbItem) {
                $conn->rollBack();
                sendResponse(404, ["message" => "Item ID {$item->item_id} not found"]);
                return;
            }

            if ($dbItem['stock_level'] < $item->quantity) {
                $conn->rollBack();
                sendResponse(409, ["message" => "Not enough stock for {$dbItem['name']}"]);
                return;
            }

            // Store the price so we don't have to query the DB again later
            $validatedItems[$item->item_id] = $dbItem['item_cost'];
        }

        // 2. Insert order
        $orderStmt = $conn->prepare(
            "INSERT INTO Orders 
             (user_id, department_id, receiver_name, vendor_name, order_timestamp)
             VALUES (:user_id, :department_id, :receiver_name, :vendor_name, NOW())"
        );

        $orderStmt->execute([
            ':user_id' => $userId,
            ':department_id' => $departmentId,
            ':receiver_name' => $receiverName,
            ':vendor_name' => $vendorName
        ]);

        $orderId = $conn->lastInsertId();

        // 3. Insert items + update stock
        $updateStockStmt = $conn->prepare(
            "UPDATE Items SET stock_level = stock_level - :qty WHERE item_id = :item_id"
        );
        
        // MODIFIED: Added unit_price to the INSERT statement
        $insertItemStmt = $conn->prepare(
            "INSERT INTO Order_Items (order_id, item_id, quantity, unit_price)
             VALUES (:order_id, :item_id, :qty, :unit_price)"
        );

        foreach ($items as $item) {
            // Update Stock
            $updateStockStmt->execute([
                ':qty' => $item->quantity,
                ':item_id' => $item->item_id
            ]);

            // Insert Item with the "Snapshot" Price
            $insertItemStmt->execute([
                ':order_id' => $orderId,
                ':item_id' => $item->item_id,
                ':qty' => $item->quantity,
                ':unit_price' => $validatedItems[$item->item_id] // Uses the price we grabbed in Step 1
            ]);
        }

        $conn->commit();

        sendResponse(201, [
            "message" => "Order placed successfully",
            "order_id" => $orderId
        ]);

    } catch (PDOException $e) {
        if ($conn->inTransaction()) {
            $conn->rollBack();
        }
        error_log($e->getMessage());
        sendResponse(500, ["message" => "Server error while placing order"]);
    }
}


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
//                     o.department_name,
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
        
//         // Loop through each order
//         foreach ($orders as &$order) {
//             // 1. Modified Query: We now select i.item_cost
//             $itemStmt = $conn->prepare("
//                 SELECT oi.quantity, i.name, i.item_cost 
//                 FROM Order_Items oi
//                 JOIN Items i ON oi.item_id = i.item_id
//                 WHERE oi.order_id = :order_id
//             ");
//             $itemStmt->bindParam(':order_id', $order['order_id'], PDO::PARAM_INT);
//             $itemStmt->execute();
//             $items = $itemStmt->fetchAll(PDO::FETCH_ASSOC);
            
//             // 2. Calculation Logic
//             $orderTotal = 0;
//             foreach ($items as $item) {
//                 // Calculate cost for this specific item (qty * price)
//                 $itemTotal = $item['quantity'] * $item['item_cost'];
//                 $orderTotal += $itemTotal;
//             }

//             // 3. Attach data to the order object
//             $order['items'] = $items;
//             $order['total_cost'] = $orderTotal; // Now the client sees the grand total
//         }

//         sendResponse(200, $orders);

//     } catch (PDOException $e) {
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
                    o.status,
                    o.department_name, -- Ensure you use the ID for relations
                    o.vendor_name
                FROM Orders o
                JOIN Users u ON o.user_id = u.user_id
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
        sendResponse(500, ["message" => "Database error fetching order history."]);
    }
}

// --- Main Execution Block ---
$method = $_SERVER['REQUEST_METHOD'];
$resource = isset($_GET['resource']) ? $_GET['resource'] : null;
error_log('METHOD: ' . $method);
error_log('RESOURCE: ' . print_r($resource, true));
error_log('GET: ' . print_r($_GET, true));


switch ($method) {
    case 'POST':
        placeOrder();
        break;

//     case 'GET':
//         if ($resource === 'history') {
//             fetchOrderHistory();
//         } elseif ($method === 'GET' && $resource === 'report_orders') { // <<< NEW ROUTE
//     fetchOrderReport();
// }
//           elseif ($resource === 'item_id') {
//              //beginTransaction();
//              //return ;
//              fetchitem();
// }
//         else {
//             sendResponse(400, ["message" => "Missing or invalid resource parameter."]);
//         }
//         break;
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
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// // api/endpoints/orders.php (Add this function)
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
// /**
//  * Fetches all orders with item details for reporting purposes.
//  */
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

