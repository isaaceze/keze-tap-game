<?php
/**
 * Created: 2025-08-08 10:30:00 UTC
 * Purpose: Tap API endpoint for Keze Tap Game
 * Features: Handle tap actions, update coins, energy, experience, and sync with database
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['telegramId']) || !validateTelegramId($input['telegramId'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Valid Telegram ID required']);
        exit();
    }

    $telegramId = $input['telegramId'];
    $taps = isset($input['taps']) ? (int)$input['taps'] : 1;

    // Validate taps count (prevent cheating)
    if ($taps < 1 || $taps > 10) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid tap count']);
        exit();
    }

    handleTap($pdo, $telegramId, $taps);

} catch (Exception $e) {
    error_log("Tap API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleTap($pdo, $telegramId, $taps) {
    try {
        // Start transaction
        $pdo->beginTransaction();

        // Get current user data with row locking
        $stmt = $pdo->prepare("SELECT * FROM users WHERE telegram_id = ? FOR UPDATE");
        $stmt->execute([$telegramId]);
        $user = $stmt->fetch();

        if (!$user) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'User not found']);
            return;
        }

        // Check if user has enough energy
        if ($user['energy'] < $taps) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Insufficient energy']);
            return;
        }

        // Calculate rewards with active boosts
        $now = time();
        $tapBoost = ($user['boost_tap_expiry'] && strtotime($user['boost_tap_expiry']) > $now) ? $user['boost_tap_power'] : 1;
        $xpBoost = ($user['boost_xp_expiry'] && strtotime($user['boost_xp_expiry']) > $now) ? $user['boost_xp'] : 1;

        $coinsEarned = $user['coins_per_tap'] * $tapBoost * $taps;
        $xpEarned = 1 * $xpBoost * $taps;

        // Calculate new values
        $newCoins = $user['coins'] + $coinsEarned;
        $newExperience = $user['experience'] + $xpEarned;
        $newTapsCount = $user['taps_count'] + $taps;
        $newEnergy = max(0, $user['energy'] - $taps);
        $newTotalEarnings = $user['total_earnings'] + $coinsEarned;

        // Check for level up
        $newLevel = $user['level'];
        $experienceToNext = $user['level'] * 1000;

        while ($newExperience >= $experienceToNext) {
            $newLevel++;
            $newExperience -= $experienceToNext;
            $experienceToNext = $newLevel * 1000;
        }

        // Update energy and coins per tap if leveled up
        if ($newLevel > $user['level']) {
            $newMaxEnergy = 1000 + ($newLevel - 1) * 100;
            $newCoinsPerTap = floor($newLevel / 3) + 1;
            $newEnergy = $newMaxEnergy; // Full energy on level up
        } else {
            $newMaxEnergy = $user['max_energy'];
            $newCoinsPerTap = $user['coins_per_tap'];
        }

        // Update user data
        $stmt = $pdo->prepare("
            UPDATE users SET
                coins = ?,
                experience = ?,
                level = ?,
                taps_count = ?,
                energy = ?,
                max_energy = ?,
                coins_per_tap = ?,
                total_earnings = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE telegram_id = ?
        ");

        $stmt->execute([
            $newCoins,
            $newExperience,
            $newLevel,
            $newTapsCount,
            $newEnergy,
            $newMaxEnergy,
            $newCoinsPerTap,
            $newTotalEarnings,
            $telegramId
        ]);

        // Log the action
        $actionData = [
            'taps' => $taps,
            'coins_earned' => $coinsEarned,
            'xp_earned' => $xpEarned,
            'level_before' => $user['level'],
            'level_after' => $newLevel
        ];

        $stmt = $pdo->prepare("
            INSERT INTO game_actions (telegram_id, action_type, action_data, coins_before, coins_after)
            VALUES (?, 'TAP', ?, ?, ?)
        ");
        $stmt->execute([$telegramId, json_encode($actionData), $user['coins'], $newCoins]);

        // Update task progress
        updateTaskProgress($pdo, $telegramId, 'daily-tap-100', $newTapsCount);
        updateTaskProgress($pdo, $telegramId, 'daily-energy', $user['max_energy'] - $newEnergy);
        updateTaskProgress($pdo, $telegramId, 'achievement-10k', $newTotalEarnings);
        updateTaskProgress($pdo, $telegramId, 'achievement-level-5', $newLevel);

        // Commit transaction
        $pdo->commit();

        // Return updated game state
        $response = [
            'userId' => $telegramId,
            'coins' => $newCoins,
            'level' => $newLevel,
            'experience' => $newExperience,
            'experienceToNext' => $newLevel * 1000,
            'tapsCount' => $newTapsCount,
            'coinsPerTap' => $newCoinsPerTap,
            'energy' => $newEnergy,
            'maxEnergy' => $newMaxEnergy,
            'totalEarnings' => $newTotalEarnings,
            'coinsEarned' => $coinsEarned,
            'xpEarned' => $xpEarned,
            'leveledUp' => $newLevel > $user['level']
        ];

        echo json_encode($response);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Database error in handleTap: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function updateTaskProgress($pdo, $telegramId, $taskId, $progress) {
    try {
        // Check if task exists for user
        $stmt = $pdo->prepare("SELECT * FROM user_tasks WHERE telegram_id = ? AND task_id = ?");
        $stmt->execute([$telegramId, $taskId]);
        $task = $stmt->fetch();

        if ($task) {
            // Update existing task
            $stmt = $pdo->prepare("
                UPDATE user_tasks
                SET progress = ?, updated_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ? AND task_id = ?
            ");
            $stmt->execute([$progress, $telegramId, $taskId]);
        } else {
            // Create new task record
            $taskType = 'daily';
            if (strpos($taskId, 'achievement') === 0) {
                $taskType = 'achievement';
            } elseif (strpos($taskId, 'social') === 0) {
                $taskType = 'social';
            }

            $stmt = $pdo->prepare("
                INSERT INTO user_tasks (telegram_id, task_id, task_type, progress)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$telegramId, $taskId, $taskType, $progress]);
        }

        // Check if task should be completed
        $requirements = [
            'daily-tap-100' => 100,
            'daily-energy' => 1000,
            'achievement-10k' => 10000,
            'achievement-level-5' => 5
        ];

        if (isset($requirements[$taskId]) && $progress >= $requirements[$taskId]) {
            $stmt = $pdo->prepare("
                UPDATE user_tasks
                SET completed = TRUE, completed_at = CURRENT_TIMESTAMP
                WHERE telegram_id = ? AND task_id = ? AND completed = FALSE
            ");
            $stmt->execute([$telegramId, $taskId]);
        }

    } catch (PDOException $e) {
        error_log("Error updating task progress: " . $e->getMessage());
    }
}
?>
