<?php
/**
 * Created: 2025-08-08 11:05:00 UTC
 * Purpose: Test endpoint to verify database connection and table creation
 */

// Enable error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

try {
    echo json_encode(['status' => 'Starting database test...']);

    // Try to include config
    require_once 'config.php';

    echo json_encode(['status' => 'Config loaded successfully']);

    // Test database connection
    if (isset($pdo)) {
        echo json_encode(['status' => 'PDO connection exists']);

        // Test simple query
        $stmt = $pdo->query("SELECT 1 as test");
        $result = $stmt->fetch();

        echo json_encode([
            'status' => 'Database test successful',
            'test_query' => $result,
            'connection' => 'working'
        ]);

        // Check if tables exist
        $tables = [];
        $stmt = $pdo->query("SHOW TABLES");
        while ($row = $stmt->fetch()) {
            $tables[] = $row[0];
        }

        echo json_encode([
            'status' => 'Tables check complete',
            'existing_tables' => $tables
        ]);

    } else {
        echo json_encode(['error' => 'PDO connection not established']);
    }

} catch (Exception $e) {
    echo json_encode([
        'error' => 'Database test failed',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
?>
