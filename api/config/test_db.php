<?php
require_once(__DIR__ . '/../config/database.php');

$conn = getConnection();

if ($conn) {
    echo "✅ Database connection successful!";
} else {
    echo "❌ Database connection failed!";
}
?>


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Select Items</title>
    <link rel="stylesheet" href="../css/style.css">
    <style>
        /* Specific styles for the items list */
        .item-row {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 100px; /* Name | Stock | Input | Button */
            gap: 15px;
            padding: 10px 0;
            border-bottom: 1px solid #eee;
            align-items: center;
        }
        .item-row:last-child { border-bottom: none; }
        .item-header { font-weight: bold; padding-bottom: 5px; border-bottom: 2px solid #ccc; }
        .item-name { font-weight: 500; }
        .input-qty { width: 80px; text-align: center; padding: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Items in Category: <span id="categoryNameDisplay"></span></h1>
        
        <div id="itemList">
            <div class="item-row item-header">
                <div>Item Name</div>
                <div>Stock</div>
                <div>Quantity</div>
                <div></div>
            </div>
            </div>
        
        <div class="status-bar">
            <a href="cart.html" id="viewCartButton">View Cart (0)</a>
            <a href="categories.html">← Change Category</a>
        </div>
    </div>

    <script src="../js/app.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', fetchAndDisplayItems);
    </script>
</body>
</html>