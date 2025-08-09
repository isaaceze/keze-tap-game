<?php
/**
 * Created: 2025-08-08 10:35:00 UTC
 * Purpose: Referral API endpoint for Keze Tap Game
 * Features: Handle referral codes, friend invitations, and referral bonuses
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            handleReferral($pdo);
            break;

        case 'GET':
            // Get referral statistics
            $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
            $pathParts = explode('/', trim($path, '/'));

            if (isset($pathParts[2]) && is_numeric($pathParts[2])) {
                getReferralStats($pdo, (int)$pathParts[2]);
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
    error_log("Referral API error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}

function handleReferral($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['referredTelegramId']) || !isset($input['referralCode'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Referred Telegram ID and referral code required']);
        return;
    }

    $referredTelegramId = $input['referredTelegramId'];
    $referralCode = sanitizeInput($input['referralCode']);

    if (!validateTelegramId($referredTelegramId)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid Telegram ID']);
        return;
    }

    try {
        // Start transaction
        $pdo->beginTransaction();

        // Find the referrer by referral code
        $stmt = $pdo->prepare("SELECT telegram_id FROM users WHERE referral_code = ?");
        $stmt->execute([$referralCode]);
        $referrer = $stmt->fetch();

        if (!$referrer) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Invalid referral code']);
            return;
        }

        $referrerTelegramId = $referrer['telegram_id'];

        // Check if user is trying to refer themselves
        if ($referrerTelegramId == $referredTelegramId) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Cannot refer yourself']);
            return;
        }

        // Check if referral already exists
        $stmt = $pdo->prepare("
            SELECT id FROM referrals
            WHERE referrer_telegram_id = ? AND referred_telegram_id = ?
        ");
        $stmt->execute([$referrerTelegramId, $referredTelegramId]);
        $existingReferral = $stmt->fetch();

        if ($existingReferral) {
            $pdo->rollBack();
            http_response_code(400);
            echo json_encode(['error' => 'Referral already exists']);
            return;
        }

        // Check if referred user exists
        $stmt = $pdo->prepare("SELECT telegram_id FROM users WHERE telegram_id = ?");
        $stmt->execute([$referredTelegramId]);
        $referredUser = $stmt->fetch();

        if (!$referredUser) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['error' => 'Referred user not found']);
            return;
        }

        // Create referral record
        $stmt = $pdo->prepare("
            INSERT INTO referrals (referrer_telegram_id, referred_telegram_id, referral_code)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$referrerTelegramId, $referredTelegramId, $referralCode]);

        // Give bonus to referrer (1000 coins)
        $referrerBonus = 1000;
        $stmt = $pdo->prepare("
            UPDATE users
            SET coins = coins + ?, total_earnings = total_earnings + ?
            WHERE telegram_id = ?
        ");
        $stmt->execute([$referrerBonus, $referrerBonus, $referrerTelegramId]);

        // Give bonus to referred user (500 coins)
        $referredBonus = 500;
        $stmt = $pdo->prepare("
            UPDATE users
            SET coins = coins + ?, total_earnings = total_earnings + ?
            WHERE telegram_id = ?
        ");
        $stmt->execute([$referredBonus, $referredBonus, $referredTelegramId]);

        // Log actions
        $referrerActionData = [
            'referral_bonus' => $referrerBonus,
            'referred_user' => $referredTelegramId
        ];

        $stmt = $pdo->prepare("
            INSERT INTO game_actions (telegram_id, action_type, action_data)
            VALUES (?, 'REFERRAL_BONUS', ?)
        ");
        $stmt->execute([$referrerTelegramId, json_encode($referrerActionData)]);

        $referredActionData = [
            'signup_bonus' => $referredBonus,
            'referrer' => $referrerTelegramId
        ];

        $stmt = $pdo->prepare("
            INSERT INTO game_actions (telegram_id, action_type, action_data)
            VALUES (?, 'SIGNUP_BONUS', ?)
        ");
        $stmt->execute([$referredTelegramId, json_encode($referredActionData)]);

        // Commit transaction
        $pdo->commit();

        echo json_encode([
            'success' => true,
            'referrerBonus' => $referrerBonus,
            'referredBonus' => $referredBonus,
            'message' => 'Referral successful'
        ]);

    } catch (PDOException $e) {
        $pdo->rollBack();
        error_log("Database error in handleReferral: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}

function getReferralStats($pdo, $telegramId) {
    try {
        // Get user's referrals with earnings
        $stmt = $pdo->prepare("
            SELECT
                r.id,
                r.referred_telegram_id,
                r.created_at,
                u.username,
                u.first_name,
                u.last_name,
                u.total_earnings,
                u.level
            FROM referrals r
            JOIN users u ON r.referred_telegram_id = u.telegram_id
            WHERE r.referrer_telegram_id = ?
            ORDER BY r.created_at DESC
        ");
        $stmt->execute([$telegramId]);
        $referrals = $stmt->fetchAll();

        // Calculate total referral earnings (10% of referred users' earnings)
        $totalReferralEarnings = 0;
        $formattedReferrals = [];

        foreach ($referrals as $referral) {
            $referralEarnings = floor($referral['total_earnings'] * 0.1); // 10% commission
            $totalReferralEarnings += $referralEarnings;

            $formattedReferrals[] = [
                'id' => $referral['id'],
                'username' => $referral['username'] ?: ($referral['first_name'] ?: 'User' . substr($referral['referred_telegram_id'], -4)),
                'earnings' => $referralEarnings,
                'level' => $referral['level'],
                'joinedAt' => $referral['created_at']
            ];
        }

        // Get user's referral code
        $stmt = $pdo->prepare("SELECT referral_code FROM users WHERE telegram_id = ?");
        $stmt->execute([$telegramId]);
        $user = $stmt->fetch();

        $response = [
            'referralCode' => $user['referral_code'],
            'totalReferrals' => count($referrals),
            'totalReferralEarnings' => $totalReferralEarnings,
            'referrals' => $formattedReferrals
        ];

        echo json_encode($response);

    } catch (PDOException $e) {
        error_log("Database error in getReferralStats: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(['error' => 'Database error']);
    }
}
?>
