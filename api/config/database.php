<?php
// include_once __DIR__ . '/../middleware/Logger.php';
// //require_once __DIR__ . '/../config/database.php';

// // Call it immediately at the top of the file
// // record_request();
// start_logging();
// define('DB_HOST', 'localhost');
// define('DB_NAME', 'inventory_app'); 
// define('DB_USER', 'root');
// define('DB_PASS', ''); 

// function getConnection() {
//     $conn = null;
//     try {
//         $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
//         $conn = new PDO($dsn, DB_USER, DB_PASS);
//         $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
//         return $conn;
//     } catch (PDOException $e) {
//         http_response_code(500);
//         echo json_encode(["message" => "Database connection error."]);
//         exit();
//     }
// }
// stop_and_log();



/**
 * Database Connection
 * File: api/config/database.php
 */

include_once __DIR__ . '/../middleware/Logger.php';

// Start logging
start_logging();

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'inventory_app'); 
define('DB_USER', 'root');
define('DB_PASS', ''); 

// Global connection variable (for SessionManager and helpers)
$conn = null;

/**
 * Get database connection (function approach)
 */
if (!function_exists('getConnection')) {
    function getConnection() {
        global $conn;
        
        // Return existing connection if already created
        if ($conn !== null) {
            return $conn;
        }
        
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $conn = new PDO($dsn, DB_USER, DB_PASS);
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            return $conn;
        } catch (PDOException $e) {
            error_log("Database connection error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database connection error."]);
            exit();
        }
    }
}

// Initialize global $conn for SessionManager
$conn = getConnection();

// Stop logging
stop_and_log();
?>


