<?php
/**
 * Created: 2025-08-08 10:40:00 UTC
 * Purpose: Tasks API endpoint for Keze Tap Game
 * Features: Handle task completion, daily task reset, and task progress tracking
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            // Complete a task
            completeTask($pdo);
            break;

        case 'PUT':
            // Reset daily tasks
            resetDailyTasks($pdo);
            break;

        case 'GET':
            // Get user tasks
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $pathParts = explode('/', trim($path, '/'));

            if (isset($pathParts[2]) && is_numeric($pathParts[2])) {
                getUserTasks($pdo, (int)$pathParts[2]);
            } else {
                http_response_code(400);
                echo json_encode(['error' => 'Telegram ID required']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            break;
    }
} catch (Exception $e) {
    error_log("Tasks API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function completeTask($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['telegramId']) || !isset($input['taskId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Telegram ID and task ID required']);
        return;
    }

    $telegramId = $input['telegramId'];
    $taskId = sanitizeInput($input['taskId']);

    if (!validateTelegramId($telegramId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid Telegram ID']);
        return;
    }

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Get task definition
        $taskDefinitions = getTaskDefinitions();

        if (!isset($taskDefinitions[$taskId])) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Task not found']);
            return;
        }

        $taskDef = $taskDefinitions[$taskId];

        // Check if task is already completed
        $stmt = $pdo->prepare("
            SELECT * FROM user_tasks
            WHERE telegram_id = ? AND task_id = ? AND completed = TRUE
        ");
        $stmt->execute([$telegramId, $taskId]);
        $completedTask = $stmt->fetch();

        if ($completedTask) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Task already completed']);
            return;
        }

        // Get current task progress
        $stmt = $pdo->prepare("
            SELECT * FROM user_tasks
            WHERE telegram_id = ? AND task_id = ?
        ");
        $stmt->execute([$telegramId, $taskId]);
        $userTask = $stmt->fetch();

        // Check if task can be completed
        if ($taskDef['type'] === 'daily') {
            // For daily tasks, check if requirements are met
            $progress = $userTask ? $userTask['progress'] : 0;
            if (isset($taskDef['requirement']) && $progress < $taskDef['requirement']) {
                $pdo->rollBack();
                http_response_code(400);
                echo json_encode(['error' => 'Task requirements not met']);
                return;
            }
        }

        // Mark task as completed
        if ($userTask) {
            $stmt = $pdo->prepare("
                UPDATE user_tasks
                SET completed = TRUE, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ? AND task_id = ?
            ");
            $stmt->execute([$telegramId, $taskId]);
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO user_tasks (telegram_id, task_id, task_type, progress, completed, completed_at)
                VALUES (?, ?, ?, ?, TRUE, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([$telegramId, $taskId, $taskDef['type'], $taskDef['requirement'] ?? 1]);
        }

        // Give reward to user
        $reward = $taskDef['reward'];
        $stmt = $pdo->prepare("
            UPDATE users
            SET coins = coins + ?, total_earnings = total_earnings + ?
            WHERE telegram_id = ?
        ");
        $stmt->execute([$reward, $reward, $telegramId]);

        // Log action
        $actionData = [
            'task_id' => $taskId,
            'reward' => $reward,
            'task_type' => $taskDef['type']
        ];

        $stmt = $pdo->prepare("
            INSERT INTO game_actions (telegram_id, action_type, action_data)
            VALUES (?, 'TASK_COMPLETE', ?)
        ");
        $stmt->execute([$telegramId, json_encode($actionData)]);

        // Handle achievement progression
        if ($taskDef['type'] === 'achievement') {
            createProgressiveAchievement($pdo, $telegramId, $taskId, $taskDef);
        }

        // Commit transaction
        $pdo->commit();

        echo json_encode([
            'success' => true,
            'reward' => $reward,
            'taskId' => $taskId,
            'message' => 'Task completed successfully'
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Database error in completeTask: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function resetDailyTasks($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['telegramId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Telegram ID required']);
        return;
    }

    $telegramId = $input['telegramId'];

    if (!validateTelegramId($telegramId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid Telegram ID']);
        return;
    }

    try {
        // Reset all daily tasks for the user
        $stmt = $pdo->prepare("
            UPDATE user_tasks
            SET completed = FALSE, progress = 0, completed_at = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE telegram_id = ? AND task_type = 'daily'
        ");
        $stmt->execute([$telegramId]);

        // Update user's last login date and daily streak
        $today = date('Y-m-d');
        $stmt = $pdo->prepare("SELECT last_login_date, daily_streak FROM users WHERE telegram_id = ?");
        $stmt->execute([$telegramId]);
        $user = $stmt->fetch();

        $newStreak = 1;
        if ($user && $user['last_login_date']) {
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            if ($user['last_login_date'] === $yesterday) {
                $newStreak = $user['daily_streak'] + 1;
            }
        }

        $stmt = $pdo->prepare("
            UPDATE users
            SET last_login_date = ?, daily_streak = ?
            WHERE telegram_id = ?
        ");
        $stmt->execute([$today, $newStreak, $telegramId]);

        echo json_encode([
            'success' => true,
            'dailyStreak' => $newStreak,
            'message' => 'Daily tasks reset successfully'
        ]);

    } catch (PDOException $e) {
        error_log("Database error in resetDailyTasks: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function getUserTasks($pdo, $telegramId) {
    try {
        $taskDefinitions = getTaskDefinitions();
        $stmt = $pdo->prepare("SELECT * FROM user_tasks WHERE telegram_id = ?");
        $stmt->execute([$telegramId]);
        $userTasks = $stmt->fetchAll();

        $tasks = [];
        foreach ($taskDefinitions as $taskId => $taskDef) {
            $task = $taskDef;
            $task['id'] = $taskId;

            // Find user's progress for this task
            foreach ($userTasks as $userTask) {
                if ($userTask['task_id'] === $taskId) {
                    $task['completed'] = (bool)$userTask['completed'];
                    $task['progress'] = (int)$userTask['progress'];
                    break;
                }
            }

            $tasks[] = $task;
        }

        echo json_encode(['tasks' => $tasks]);

    } catch (PDOException $e) {
        error_log("Database error in getUserTasks: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function createProgressiveAchievement($pdo, $telegramId, $completedTaskId, $completedTaskDef) {
    try {
        if (strpos($completedTaskId, 'achievement-level-') === 0) {
            $currentTarget = $completedTaskDef['requirement'];
            $nextTarget = $currentTarget + 5;
            $newTaskId = "achievement-level-$nextTarget";

            // Create new progressive achievement
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO user_tasks (telegram_id, task_id, task_type, progress)
                VALUES (?, ?, 'achievement', ?)
            ");
            $stmt->execute([$telegramId, $newTaskId, 0]);

        } elseif (strpos($completedTaskId, 'achievement-') === 0 && strpos($completedTaskId, 'k') !== false) {
            $currentTarget = $completedTaskDef['requirement'];
            $nextTarget = $currentTarget * 2;
            $newTaskId = "achievement-$nextTarget";

            // Create new progressive achievement
            $stmt = $pdo->prepare("
                INSERT IGNORE INTO user_tasks (telegram_id, task_id, task_type, progress)
                VALUES (?, ?, 'achievement', ?)
            ");
            $stmt->execute([$telegramId, $newTaskId, 0]);
        }
    } catch (PDOException $e) {
        error_log("Error creating progressive achievement: " . $e->getMessage());
    }
}

function getTaskDefinitions() {
    return [
        'daily-attendance' => [
            'title' => 'Daily Check-in',
            'description' => 'Log in today to claim reward',
            'reward' => 1000,
            'type' => 'daily',
            'requirement' => 1
        ],
        'daily-tap-100' => [
            'title' => 'Daily Tapper',
            'description' => 'Tap 100 times today',
            'reward' => 500,
            'type' => 'daily',
            'requirement' => 100
        ],
        'daily-energy' => [
            'title' => 'Energy Saver',
            'description' => 'Use all your energy today',
            'reward' => 300,
            'type' => 'daily',
            'requirement' => 1000
        ],
        'social-follow' => [
            'title' => 'Follow Us',
            'description' => 'Follow our Telegram channel',
            'reward' => 1000,
            'type' => 'social'
        ],
        'achievement-level-5' => [
            'title' => 'Level Up Champion',
            'description' => 'Reach level 5',
            'reward' => 2500,
            'type' => 'achievement',
            'requirement' => 5
        ],
        'achievement-10k' => [
            'title' => 'Coin Collector',
            'description' => 'Earn 10,000 Keze coins',
            'reward' => 5000,
            'type' => 'achievement',
            'requirement' => 10000
        ]
    ];
}
?>
