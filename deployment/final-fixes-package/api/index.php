<?php
/**
 * Created: 2025-08-08 10:45:00 UTC
 * Purpose: Main API router for Keze Tap Game
 * Features: Route requests to appropriate handlers and provide API documentation
 */

// Set headers
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Remove 'api' from path if present
if (isset($pathParts[0]) && $pathParts[0] === 'api') {
    array_shift($pathParts);
}

$endpoint = $pathParts[0] ?? '';

try {
    switch ($endpoint) {
        case 'user':
            require_once 'user.php';
            break;

        case 'tap':
            require_once 'tap.php';
            break;

        case 'referral':
            require_once 'referral.php';
            break;

        case 'tasks':
            require_once 'tasks.php';
            break;

        case 'health':
            // Health check endpoint
            echo json_encode([
                'status' => 'healthy',
                'timestamp' => date('c'),
                'version' => '1.0.0',
                'endpoints' => [
                    'GET /api/user/{telegram_id}' => 'Get user data',
                    'POST /api/user' => 'Create or update user',
                    'POST /api/tap' => 'Handle tap actions',
                    'GET /api/referral/{telegram_id}' => 'Get referral stats',
                    'POST /api/referral' => 'Process referral',
                    'GET /api/tasks/{telegram_id}' => 'Get user tasks',
                    'POST /api/tasks' => 'Complete task',
                    'PUT /api/tasks' => 'Reset daily tasks'
                ]
            ]);
            break;

        case '':
            // API documentation
            echo json_encode([
                'name' => 'Keze Tap Game API',
                'version' => '1.0.0',
                'description' => 'Backend API for Keze Tap Game - Telegram WebApp',
                'endpoints' => [
                    'GET /api/health' => 'Health check',
                    'GET /api/user/{telegram_id}' => 'Get user game data',
                    'POST /api/user' => 'Create or update user profile',
                    'PUT /api/user/{telegram_id}' => 'Update user data',
                    'POST /api/tap' => 'Process tap action and update game state',
                    'GET /api/referral/{telegram_id}' => 'Get user referral statistics',
                    'POST /api/referral' => 'Process friend referral',
                    'GET /api/tasks/{telegram_id}' => 'Get user task progress',
                    'POST /api/tasks' => 'Complete a task and claim reward',
                    'PUT /api/tasks' => 'Reset daily tasks'
                ],
                'database_tables' => [
                    'users' => 'User profiles and game state',
                    'game_actions' => 'Logged game actions for analytics',
                    'referrals' => 'Friend referral relationships',
                    'user_tasks' => 'Task progress and completion status'
                ],
                'features' => [
                    'Cross-device sync',
                    'Real-time game state updates',
                    'Referral system with bonuses',
                    'Daily task reset system',
                    'Progressive achievements',
                    'Energy regeneration',
                    'Boost system with timers',
                    'Activity logging'
                ]
            ]);
            break;

        default:
            http_response_code(404);
            echo json_encode([
                'error' => 'Endpoint not found',
                'available_endpoints' => [
                    '/api/user',
                    '/api/tap',
                    '/api/referral',
                    '/api/tasks',
                    '/api/health'
                ]
            ]);
            break;
    }
} catch (Exception $e) {
    error_log("API Router error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>
