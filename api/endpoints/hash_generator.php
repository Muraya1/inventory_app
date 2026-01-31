<?php
// hash_generator.php - DELETE THIS FILE AFTER USE

// Replace 'your_admin_password' with the plaintext password you want to use
$plaintext_password = '123'; 

// Generate the hash
$hashed_password = password_hash($plaintext_password, PASSWORD_DEFAULT);

echo "Plaintext: " . $plaintext_password . "<br>";
echo "Hash to use: " . $hashed_password . "<br>";
?>