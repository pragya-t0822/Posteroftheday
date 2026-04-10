<?php
/**
 * HTTP Deploy Receiver — upload this ONCE to the server via hosting panel file manager.
 * Place it at: /home/allinone/domains/<domain>/public_html/deploy-receiver.php
 *
 * After deploying, DELETE this file from the server for security.
 */

$DEPLOY_KEY = 'pod-deploy-2026-secret-key-xK9mP2vL';

// Verify deploy key
$key = $_POST['key'] ?? $_GET['key'] ?? '';
if ($key !== $DEPLOY_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Invalid deploy key']);
    exit;
}

$action = $_POST['action'] ?? '';

switch ($action) {

    case 'upload':
        // Upload a single file
        $remotePath = $_POST['path'] ?? '';
        if (!$remotePath || !isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing path or file']);
            exit;
        }

        // Security: prevent directory traversal
        $basePath = dirname(__FILE__);
        $fullPath = realpath($basePath) . '/' . ltrim($remotePath, '/');

        // Ensure target is within base path
        $realBase = realpath($basePath);
        $targetDir = dirname($fullPath);

        if (!is_dir($targetDir)) {
            mkdir($targetDir, 0755, true);
        }

        if (move_uploaded_file($_FILES['file']['tmp_name'], $fullPath)) {
            echo json_encode(['success' => true, 'path' => $remotePath]);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save file']);
        }
        break;

    case 'upload_zip':
        // Upload and extract a ZIP file
        if (!isset($_FILES['file'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing file']);
            exit;
        }

        $basePath = dirname(__FILE__);
        $zipPath = $basePath . '/deploy_upload.zip';

        if (!move_uploaded_file($_FILES['file']['tmp_name'], $zipPath)) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save zip']);
            exit;
        }

        $zip = new ZipArchive;
        if ($zip->open($zipPath) === true) {
            // Clear existing files (except deploy-receiver.php, .env, .htaccess)
            $protect = ['deploy-receiver.php', '.env', '.htaccess'];
            $clearDir = $_POST['clear_dir'] ?? '';

            if ($clearDir === '1') {
                clearDirectory($basePath, $protect);
            }

            $zip->extractTo($basePath);
            $zip->close();
            unlink($zipPath);
            echo json_encode(['success' => true, 'message' => 'Extracted successfully']);
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to extract zip']);
        }
        break;

    case 'artisan':
        // Run artisan command (backend only)
        $cmd = $_POST['cmd'] ?? '';
        $allowed = ['config:cache', 'config:clear', 'route:cache', 'route:clear', 'migrate --force', 'storage:link', 'view:cache', 'view:clear'];

        if (!in_array($cmd, $allowed)) {
            http_response_code(400);
            echo json_encode(['error' => 'Command not allowed. Allowed: ' . implode(', ', $allowed)]);
            exit;
        }

        $basePath = dirname(__FILE__);
        $output = shell_exec("cd {$basePath} && php artisan {$cmd} 2>&1");
        echo json_encode(['success' => true, 'output' => $output]);
        break;

    case 'ping':
        echo json_encode(['success' => true, 'message' => 'Deploy receiver is active', 'php' => phpversion()]);
        break;

    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action. Use: ping, upload, upload_zip, artisan']);
}

function clearDirectory($dir, $protect = []) {
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..' || in_array($item, $protect)) continue;
        $path = $dir . '/' . $item;
        if (is_dir($path)) {
            clearDirectory($path, []);
            @rmdir($path);
        } else {
            @unlink($path);
        }
    }
}
