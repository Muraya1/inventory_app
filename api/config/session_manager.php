<?php
///// Session Manager Class - Handles User Sessions and Authentication


/**
 * Simple Session Manager - Uses PHP's Native Sessions
 * File: api/config/session_manager.php
 */
require_once __DIR__ . '/database.php';
class SessionManager {
    private $conn;
    private $now;
    private $session_lifetime = 3600; // 1 hour
    
    public function __construct($db_connection) {
        $this->conn = $db_connection;
        $this->now = time();
        $this->startSecureSession();
        //session_start();
    }
    
    /**
     * Start secure PHP session
     */
    private function startSecureSession() {
        if (session_status() === PHP_SESSION_NONE) {
            // Configure secure session settings
            ini_set('session.cookie_httponly', 1);
            ini_set('session.use_only_cookies', 1);
            ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
            ini_set('session.cookie_samesite', 'Lax');
            ini_set('session.gc_maxlifetime', $this->session_lifetime);
            
            session_name('INVENTORY_SESSION');
            session_start();
        }
    }
    
    /**
     * Create session after successful login
     */
    public function createSession($user_id, $username, $role) {
        try {
            // Regenerate session ID to prevent fixation attacks
            session_regenerate_id(true);
            date_default_timezone_set('Africa/Nairobi');
            
            // Get PHP's session ID
            $session_id = session_id();
            
            // Get client info
            $ip_address = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
            $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
            
            // Calculate expiry
            $expires_at = date('Y-m-d H:i:s', $this->now + $this->session_lifetime);
            
            // Store session in database
            $stmt = $this->conn->prepare(
                "INSERT INTO user_sessions 
                (user_id, session_id, ip_address, user_agent, expires_at) 
                VALUES (:user_id, :session_id, :ip_address, :user_agent, :expires_at)"
            );
            
            $stmt->execute([
                ':user_id' => $user_id,
                ':session_id' => $session_id,
                ':ip_address' => $ip_address,
                ':user_agent' => $user_agent,
                ':expires_at' => $expires_at
            ]);
            
            // Store user data in PHP session
            $_SESSION['user_id'] = $user_id;
            $_SESSION['username'] = $username;
            $_SESSION['role'] = $role;
            $_SESSION['login_time'] = time();
            $_SESSION['last_activity'] = time();
            $_SESSION['ip_address'] = $ip_address;
            
            // Update user's last login
            $updateStmt = $this->conn->prepare(
                "UPDATE users SET last_login = NOW(), last_ip = :ip WHERE user_id = :user_id"
            );
            $updateStmt->execute([
                ':ip' => $ip_address,
                ':user_id' => $user_id
            ]);
            
            return [
                'success' => true,
                'session_id' => $session_id,
                'expires_at' => $expires_at
            ];
            
        } catch (PDOException $e) {
            error_log("Session creation error: " . $e->getMessage());
            return ['success' => false, 'message' => 'Failed to create session'];
        }
    }
    
    /**
     * Validate current session
     */
    public function validateSession() {
        // Check if user is logged in
        if (!isset($_SESSION['user_id'])) {
            return false;
        }
        
        // Check session timeout (inactivity)
        if (isset($_SESSION['last_activity'])) {
            $inactive_time = time() - $_SESSION['last_activity'];
            if ($inactive_time > $this->session_lifetime) {
                $this->destroySession();
                return false;
            }
        }
        
        // Validate session exists in database
        try {
            $session_id = session_id();
            
            $stmt = $this->conn->prepare(
                "SELECT user_id, expires_at, is_active 
                 FROM user_sessions 
                 WHERE session_id = :session_id 
                 AND user_id = :user_id"
            );
            
            $stmt->execute([
                ':session_id' => $session_id,
                ':user_id' => $_SESSION['user_id']
            ]);
            
            $session = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Check if session exists and is active
            if (!$session || !$session['is_active']) {
                $this->destroySession();
                return false;
            }
            
            // Check if expired
            if (strtotime($session['expires_at']) < time()) {
                $this->destroySession();
                return false;
            }
            
            // Update last activity
            $_SESSION['last_activity'] = time();
            $this->updateSessionActivity($session_id);
            
            return true;
            
        } catch (PDOException $e) {
            error_log("Session validation error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Update session last activity
     */
    private function updateSessionActivity($session_id) {
        try {
            $stmt = $this->conn->prepare(
                "UPDATE user_sessions 
                 SET last_activity = NOW() 
                 WHERE session_id = :session_id"
            );
            $stmt->execute([':session_id' => $session_id]);
        } catch (PDOException $e) {
            error_log("Activity update error: " . $e->getMessage());
        }
    }
    
    /**
     * Get current user info
     */
    public function getCurrentUser() {
        if ($this->validateSession()) {
            return [
                'user_id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'role' => $_SESSION['role']
            ];
        }
        return null;
    }
    
    /**
     * Destroy current session
     */
    public function destroySession() {
        $session_id = session_id();
        
        if ($session_id) {
            try {
                // Mark session as inactive in database
                $stmt = $this->conn->prepare(
                    "UPDATE user_sessions 
                     SET is_active = 0 
                     WHERE session_id = :session_id"
                );
                $stmt->execute([':session_id' => $session_id]);
            } catch (PDOException $e) {
                error_log("Session destruction error: " . $e->getMessage());
            }
        }
        
        // Clear PHP session
        $_SESSION = array();
        
        // Delete session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/');
        }
        
        session_destroy();
    }
    
    /**
     * Get all active sessions for a user
     */
    public function getUserActiveSessions($user_id) {
        try {
            $stmt = $this->conn->prepare(
                "SELECT id, session_id, ip_address, user_agent, created_at, last_activity,
                        CASE WHEN session_id = :current_session THEN 1 ELSE 0 END as is_current
                 FROM user_sessions 
                 WHERE user_id = :user_id AND is_active = 1 
                 ORDER BY last_activity DESC"
            );
            $stmt->execute([
                ':user_id' => $user_id,
                ':current_session' => session_id()
            ]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Get sessions error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Logout from specific session
     */
    public function logoutSession($session_db_id, $user_id) {
        try {
            $stmt = $this->conn->prepare(
                "UPDATE user_sessions 
                 SET is_active = 0 
                 WHERE id = :id AND user_id = :user_id"
            );
            $stmt->execute([
                ':id' => $session_db_id,
                ':user_id' => $user_id
            ]);
            return true;
        } catch (PDOException $e) {
            error_log("Logout session error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Clean up expired sessions (run via cron or periodically)
     */
    public function cleanupExpiredSessions() {
        try {
            $stmt = $this->conn->prepare(
                "UPDATE user_sessions 
                 SET is_active = 0 
                 WHERE expires_at < NOW() AND is_active = 1"
            );
            $stmt->execute();
            return $stmt->rowCount();
        } catch (PDOException $e) {
            error_log("Cleanup error: " . $e->getMessage());
            return 0;
        }
    }
    
    /**
     * Extend session expiry (call on user activity)
     */
    public function extendSession() {
        try {
            $session_id = session_id();
            $new_expiry = date('Y-m-d H:i:s', time() + $this->session_lifetime);
            
            $stmt = $this->conn->prepare(
                "UPDATE user_sessions 
                 SET expires_at = :expires_at 
                 WHERE session_id = :session_id"
            );
            $stmt->execute([
                ':expires_at' => $new_expiry,
                ':session_id' => $session_id
            ]);
            return true;
        } catch (PDOException $e) {
            error_log("Extend session error: " . $e->getMessage());
            return false;
        }
    }
}
