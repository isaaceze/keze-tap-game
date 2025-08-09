-- Keze Tap Game MySQL Database Schema
-- Database: bisskhgv_keze_coins_db
-- Import this file in phpMyAdmin if you need to manually create tables

-- Set character set for emoji support
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Create users table
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `telegram_id` bigint UNIQUE NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) DEFAULT NULL,
  `last_name` varchar(255) DEFAULT NULL,
  `coins` bigint DEFAULT 0,
  `ton_coins` bigint DEFAULT 0,
  `level` int DEFAULT 1,
  `experience` int DEFAULT 0,
  `taps_count` int DEFAULT 0,
  `energy` int DEFAULT 1000,
  `last_energy_update` datetime DEFAULT CURRENT_TIMESTAMP,
  `referral_code` varchar(50) UNIQUE DEFAULT NULL,
  `referred_by` bigint DEFAULT NULL,
  `daily_streak` int DEFAULT 0,
  `last_login_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `total_earnings` bigint DEFAULT 0,
  `spins_won` int DEFAULT 0,
  `treasures_found` int DEFAULT 0,
  `coins_flipped` int DEFAULT 0,
  `total_staked` bigint DEFAULT 0,
  `banned` boolean DEFAULT FALSE,
  `last_action_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes for better performance
  INDEX `idx_telegram_id` (`telegram_id`),
  INDEX `idx_total_earnings` (`total_earnings`),
  INDEX `idx_last_action` (`last_action_time`),
  INDEX `idx_referral_code` (`referral_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create game_actions table for monitoring and anti-cheat
DROP TABLE IF EXISTS `game_actions`;
CREATE TABLE `game_actions` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` bigint NOT NULL,
  `action` varchar(50) NOT NULL,
  `amount` int NOT NULL,
  `result` text DEFAULT NULL,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `verified` boolean DEFAULT TRUE,

  -- Indexes for monitoring queries
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_timestamp` (`timestamp`),
  INDEX `idx_action` (`action`),
  INDEX `idx_user_action` (`user_id`, `action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create tasks table (optional - for future expansion)
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` int AUTO_INCREMENT PRIMARY KEY,
  `user_id` bigint NOT NULL,
  `task_id` varchar(100) NOT NULL,
  `completed` boolean DEFAULT FALSE,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,

  -- Ensure user can only complete each task once
  UNIQUE KEY `unique_user_task` (`user_id`, `task_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_task_id` (`task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some sample data for testing (optional)
-- INSERT INTO `users` (`telegram_id`, `username`, `first_name`, `coins`, `level`, `referral_code`)
-- VALUES
-- (123456789, 'testuser', 'Test User', 1000, 2, '123456789'),
-- (987654321, 'player2', 'Player Two', 500, 1, '987654321');

SET FOREIGN_KEY_CHECKS = 1;

-- Show tables to verify creation
SHOW TABLES;

-- Display table structures
DESCRIBE users;
DESCRIBE game_actions;
DESCRIBE tasks;
