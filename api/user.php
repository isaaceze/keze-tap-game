<?php
/**
 * Created: 2025-08-08 10:25:00 UTC
 * Purpose: User API endpoint for Keze Tap Game
 * Features: Get/Create/Update user data with Telegram integration
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$pathParts = explode('/', trim($path, '/'));

// Extract telegram_id from URL path
$telegramId = null;
if (isset($pathParts[2]) && is_numeric($pathParts[2])) {
    $telegramId = (int)$pathParts[2];
}

try {
    switch ($method) {
        case 'GET':
            if (!$telegramId || !validateTelegramId($telegramId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Valid Telegram ID required']);
                exit();
            }

            getUserData($pdo, $telegramId);
            break;

        case 'POST':
            createOrUpdateUser($pdo);
            break;

        case 'PUT':
            if (!$telegramId || !validateTelegramId($telegramId)) {
                http_response_code(400);
                echo json_encode(['error' => 'Valid Telegram ID required']);
                exit();
            }

            updateUserData($pdo, $telegramId);
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("User API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function getUserData($pdo, $telegramId) {
    try {
        // Get user data
        $stmt = $pdo->prepare("SELECT * FROM users WHERE telegram_id = ?");
        $stmt->execute([$telegramId]);
        $user = $stmt->fetch();

        if (!$user) {
            // User doesn't exist, create default user
            $referralCode = generateReferralCode($telegramId);

            $stmt = $pdo->prepare("INSERT INTO users (telegram_id, referral_code) VALUES (?, ?)");
            $stmt->execute([$telegramId, $referralCode]);

            // Get the newly created user
            $stmt = $pdo->prepare("SELECT * FROM users WHERE telegram_id = ?");
            $stmt->execute([$telegramId]);
            $user = $stmt->fetch();
        }

        // Get user's referrals
        $stmt = $pdo->prepare("
            SELECT r.*, u.username, u.first_name, u.last_name
            FROM referrals r
            JOIN users u ON r.referred_telegram_id = u.telegram_id
            WHERE r.referrer_telegram_id = ?
        ");
        $stmt->execute([$telegramId]);
        $referrals = $stmt->fetchAll();

        // Get user's tasks
        $stmt = $pdo->prepare("SELECT * FROM user_tasks WHERE telegram_id = ?");
        $stmt->execute([$telegramId]);
        $userTasks = $stmt->fetchAll();

        // Format response data to match frontend structure
        $response = [
            'userId' => $user['telegram_id'],
            'username' => $user['username'],
            'firstName' => $user['first_name'],
            'lastName' => $user['last_name'],
            'referralCode' => $user['referral_code'],
            'coins' => (int)$user['coins'],
            'tonCoins' => (int)$user['ton_coins'],
            'level' => (int)$user['level'],
            'experience' => (int)$user['experience'],
            'experienceToNext' => (int)$user['level'] * 1000,
            'tapsCount' => (int)$user['taps_count'],
            'coinsPerTap' => (int)$user['coins_per_tap'],
            'energy' => (int)$user['energy'],
            'maxEnergy' => (int)$user['max_energy'],
            'totalEarnings' => (int)$user['total_earnings'],
            'dailyStreak' => (int)$user['daily_streak'],
            'lastLoginDate' => $user['last_login_date'],
            'boosts' => [
                'tapPowerBoost' => (int)$user['boost_tap_power'],
                'energyBoost' => (int)$user['boost_energy'],
                'xpBoost' => (int)$user['boost_xp'],
                'levelBoost' => (int)$user['boost_level'],
                'tapPowerBoostExpiry' => $user['boost_tap_expiry'] ? strtotime($user['boost_tap_expiry']) * 1000 : 0,
                'energyBoostExpiry' => $user['boost_energy_expiry'] ? strtotime($user['boost_energy_expiry']) * 1000 : 0,
                'xpBoostExpiry' => $user['boost_xp_expiry'] ? strtotime($user['boost_xp_expiry']) * 1000 : 0,
                'levelBoostExpiry' => $user['boost_level_expiry'] ? strtotime($user['boost_level_expiry']) * 1000 : 0,
            ],
            'referrals' => array_map(function($ref) {
                return [
                    'id' => $ref['id'],
                    'username' => $ref['username'] ?: 'User' . substr($ref['referred_telegram_id'], -4),
                    'earnings' => calculateReferralEarnings($ref['referred_telegram_id']),
                    'joinedAt' => $ref['created_at']
                ];
            }, $referrals),
            'tasks' => getDefaultTasks($userTasks),
            'isInitialized' => true,
            'telegramWebAppAvailable' => true
        ];

        // Update last login date
        $today = date('Y-m-d');
        if ($user['last_login_date'] !== $today) {
            updateLastLogin($pdo, $telegramId, $today);
        }

        echo json_encode($response);

    } catch (PDOException $e) {
        error_log("Database error in getUserData: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function createOrUpdateUser($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['telegramId']) || !validateTelegramId($input['telegramId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid Telegram ID required']);
        return;
    }

    $telegramId = $input['telegramId'];
    $username = $input['username'] ?? null;
    $firstName = $input['firstName'] ?? null;
    $lastName = $input['lastName'] ?? null;

    try {
        // Check if user exists
        $stmt = $pdo->prepare("SELECT telegram_id FROM users WHERE telegram_id = ?");
        $stmt->execute([$telegramId]);
        $exists = $stmt->fetch();

        if ($exists) {
            // Update existing user
            $stmt = $pdo->prepare("
                UPDATE users
                SET username = ?, first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ?
            ");
            $stmt->execute([$username, $firstName, $lastName, $telegramId]);
        } else {
            // Create new user
            $referralCode = generateReferralCode($telegramId);
            $stmt = $pdo->prepare("
                INSERT INTO users (telegram_id, username, first_name, last_name, referral_code)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([$telegramId, $username, $firstName, $lastName, $referralCode]);
        }

        // Return updated user data
        getUserData($pdo, $telegramId);

    } catch (PDOException $e) {
        error_log("Database error in createOrUpdateUser: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function updateUserData($pdo, $telegramId) {
    $input = json_decode(file_get_contents('php://input'), true);

    try {
        $updateFields = [];
        $updateValues = [];

        // Build dynamic update query based on provided fields
        $allowedFields = [
            'coins', 'ton_coins', 'level', 'experience', 'taps_count',
            'total_earnings', 'energy', 'max_energy', 'coins_per_tap',
            'daily_streak', 'last_login_date'
        ];

        foreach ($allowedFields as $field) {
            if (isset($input[$field])) {
                $updateFields[] = "$field = ?";
                $updateValues[] = $input[$field];
            }
        }

        if (empty($updateFields)) {
            http_response_code(400);
            echo json_encode(['error' => 'No valid fields to update']);
            return;
        }

        $updateValues[] = $telegramId;

        $sql = "UPDATE users SET " . implode(', ', $updateFields) . ", updated_at = CURRENT_TIMESTAMP WHERE telegram_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($updateValues);

        // Return updated user data
        getUserData($pdo, $telegramId);

    } catch (PDOException $e) {
        error_log("Database error in updateUserData: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function updateLastLogin($pdo, $telegramId, $date) {
    try {
        $stmt = $pdo->prepare("UPDATE users SET last_login_date = ? WHERE telegram_id = ?");
        $stmt->execute([$date, $telegramId]);
    } catch (PDOException $e) {
        error_log("Error updating last login: " . $e->getMessage());
    }
}

function calculateReferralEarnings($telegramId) {
    // This would calculate earnings based on the referred user's activity
    // For now, return a default value
    return rand(1000, 5000);
}

function getDefaultTasks($userTasks) {
    $defaultTasks = [
        [
            'id' => 'daily-attendance',
            'title' => 'Daily Check-in',
            'description' => 'Log in today to claim reward',
            'reward' => 1000,
            'completed' => false,
            'type' => 'daily',
            'requirement' => 1,
            'progress' => 0
        ],
        [
            'id' => 'daily-tap-100',
            'title' => 'Daily Tapper',
            'description' => 'Tap 100 times today',
            'reward' => 500,
            'completed' => false,
            'type' => 'daily',
            'requirement' => 100,
            'progress' => 0
        ],
        [
            'id' => 'daily-energy',
            'title' => 'Energy Saver',
            'description' => 'Use all your energy today',
            'reward' => 300,
            'completed' => false,
            'type' => 'daily',
            'requirement' => 1000,
            'progress' => 0
        ],
        [
            'id' => 'social-follow',
            'title' => 'Follow Us',
            'description' => 'Follow our Telegram channel',
            'reward' => 1000,
            'completed' => false,
            'type' => 'social'
        ],
        [
            'id' => 'achievement-level-5',
            'title' => 'Level Up Champion',
            'description' => 'Reach level 5',
            'reward' => 2500,
            'completed' => false,
            'type' => 'achievement',
            'requirement' => 5,
            'progress' => 1
        ],
        [
            'id' => 'achievement-10k',
            'title' => 'Coin Collector',
            'description' => 'Earn 10,000 Keze coins',
            'reward' => 5000,
            'completed' => false,
            'type' => 'achievement',
            'requirement' => 10000,
            'progress' => 0
        ]
    ];

    // Merge with user's actual task progress
    foreach ($defaultTasks as &$task) {
        foreach ($userTasks as $userTask) {
            if ($userTask['task_id'] === $task['id']) {
                $task['completed'] = (bool)$userTask['completed'];
                $task['progress'] = (int)$userTask['progress'];
                break;
            }
        }
    }

    return $defaultTasks;
}
?>
