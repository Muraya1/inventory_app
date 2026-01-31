<?php
// function record_request() {
//     // 1. Set the path to the log file
//     $logDir = __DIR__ . '/../../logs';
//     $logFile = $logDir . '/app_requests.log';

//     // 2. Create the directory if it doesn't exist
//     if (!is_dir($logDir)) {

//         mkdir($logDir, 0777, true);
//         //sendResponse(500, ['error' => 'Log directory does not exist and could not be created.']);
//     }

//     // 3. Collect Request Data
//     $timestamp = date('Y-m-d H:i:s');
//     $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
//     $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
//     $uri = $_SERVER['REQUEST_URI'] ?? 'UNKNOWN';
    
//     // This captures JSON data sent in the body of the request
//     $inputData = file_get_contents('php://input');
    
//     // Clean up input for the log file (remove newlines)
//     $cleanInput = str_replace(["\r", "\n"], ' ', $inputData);

//     // 4. Format the log line
//     $logEntry = "[$timestamp] IP: $ip | $method: $uri | PAYLOAD: $cleanInput" . PHP_EOL;

//     // 5. Save to file (FILE_APPEND keeps old logs)
//     file_put_contents($logFile, $logEntry, FILE_APPEND);
// }


function start_logging() {
    // Start "holding" the output in memory
    ob_start();
}

function stop_and_log() {
    $logDir = __DIR__ . '/../../logs';
    $logFile = $logDir . '/app_requests.log';

    // 1. Get the Response that was about to be sent
    $responseBody = ob_get_contents(); 
    ob_end_flush(); // Send it to the user now

    // 2. Collect Request Data
    $timestamp = date('Y-m-d H:i:s');
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'UNKNOWN';
    $method = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
    $uri = $_SERVER['REQUEST_URI'] ?? 'UNKNOWN';
    $inputData = file_get_contents('php://input');
    
    // 3. Format Entry (Request -> Response)
    $logEntry = "------------------------------------------" . PHP_EOL;
    $logEntry .= "[$timestamp] $ip | $method: $uri" . PHP_EOL;
    $logEntry .= "REQUEST : " . ($inputData ?: "EMPTY/GET") . PHP_EOL;
    $logEntry .= "RESPONSE: " . $responseBody . PHP_EOL;

    file_put_contents($logFile, $logEntry, FILE_APPEND);
}