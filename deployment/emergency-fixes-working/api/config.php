<?php
/**
 * Created: 2025-08-08 10:20:00 UTC
 * Updated: 2025-08-08 11:05:00 UTC
 * Purpose: Database configuration for Keze Tap Game - FIXED with better error handling
 * Features: MySQL connection with comprehensive error reporting
 */

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

// Database configuration - FIXED: Use actual database credentials
$servername = "localhost";
$username = "bisskhgv_bisskhgv"; // Replace with your actual cPanel username
$password = ""; // Replace with your actual database password
$dbname = "bisskhgv_keze_tap_game"; // Database name

// Create connection with error handling
try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);

    // Set PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Set default fetch mode
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

    // Enable persistent connections for better performance
    $pdo->setAttribute(PDO::ATTR_PERSISTENT, true);

} catch(PDOException $e) {
    // Log error (don't expose sensitive information)
    error_log("Database connection failed: " . $e->getMessage());

    // Return generic error for security
    http_response_code(500);
    echo json_encode(['error' => 'Database connection failed']);
    exit();
}

// Set content type for JSON responses
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Function to sanitize input
function sanitizeInput($input) {
    return htmlspecialchars(strip_tags(trim($input)));
}

// Function to validate Telegram user ID
function validateTelegramId($telegramId) {
    return is_numeric($telegramId) && $telegramId > 0;
}

// Function to generate referral code
function generateReferralCode($telegramId) {
    return 'KEZE' . str_pad($telegramId, 8, '0', STR_PAD_LEFT);
}

// Create tables if they don't exist
function initializeTables($pdo) {
    try {
        // Users table
        $pdo->exec("CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            telegram_id BIGINT UNIQUE NOT NULL,
            username VARCHAR(255),
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            referral_code VARCHAR(20) UNIQUE,
            coins BIGINT DEFAULT 0,
            ton_coins BIGINT DEFAULT 0,
            level INT DEFAULT 1,
            experience INT DEFAULT 0,
            taps_count BIGINT DEFAULT 0,
            total_earnings BIGINT DEFAULT 0,
            energy INT DEFAULT 1000,
            max_energy INT DEFAULT 1000,
            coins_per_tap INT DEFAULT 1,
            daily_streak INT DEFAULT 0,
            last_login_date DATE,
            boost_tap_power INT DEFAULT 1,
            boost_energy INT DEFAULT 1,
            boost_xp INT DEFAULT 1,
            boost_level INT DEFAULT 1,
            boost_tap_expiry TIMESTAMP NULL,
            boost_energy_expiry TIMESTAMP NULL,
            boost_xp_expiry TIMESTAMP NULL,
            boost_level_expiry TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )");

        // Game actions table for logging
        $pdo->exec("CREATE TABLE IF NOT EXISTS game_actions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            telegram_id BIGINT NOT NULL,
            action_type VARCHAR(50) NOT NULL,
            action_data JSON,
            coins_before BIGINT,
            coins_after BIGINT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE
        )");

        // Referrals table
        $pdo->exec("CREATE TABLE IF NOT EXISTS referrals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            referrer_telegram_id BIGINT NOT NULL,
            referred_telegram_id BIGINT NOT NULL,
            referral_code VARCHAR(20) NOT NULL,
            bonus_claimed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (referrer_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
            FOREIGN KEY (referred_telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
            UNIQUE KEY unique_referral (referrer_telegram_id, referred_telegram_id)
        )");

        // Tasks table for tracking daily tasks and achievements
        $pdo->exec("CREATE TABLE IF NOT EXISTS user_tasks (
            id INT AUTO_INCREMENT PRIMARY KEY,
            telegram_id BIGINT NOT NULL,
            task_id VARCHAR(100) NOT NULL,
            task_type ENUM('daily', 'achievement', 'social') NOT NULL,
            progress INT DEFAULT 0,
            completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (telegram_id) REFERENCES users(telegram_id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_task (telegram_id, task_id)
        )");

        return true;
    } catch(PDOException $e) {
        error_log("Failed to initialize tables: " . $e->getMessage());
        return false;
    }
}

// Initialize tables
if (!initializeTables($pdo)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to initialize database tables']);
    exit();
}
?>
