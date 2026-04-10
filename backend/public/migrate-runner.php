<?php
/**
 * DELETE THIS FILE AFTER USE!
 * https://api.pod.allinonebimaposter.com/migrate-runner.php?key=pod2026migrate
 */
if (($_GET['key'] ?? '') !== 'pod2026migrate') {
    http_response_code(403);
    die('Unauthorized');
}

header('Content-Type: application/json');
$results = [];

try {
    require __DIR__ . '/../vendor/autoload.php';
    $app = require_once __DIR__ . '/../bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    $results['step1_bootstrap'] = 'OK';
} catch (Throwable $e) {
    die(json_encode(['bootstrap_failed' => $e->getMessage()]));
}

// Clear ALL caches first so .env changes take effect
try {
    Artisan::call('config:clear');
    Artisan::call('cache:clear');
    Artisan::call('route:clear');
    $results['step2_cache_cleared'] = 'OK';
} catch (Throwable $e) {
    $results['step2_cache_error'] = $e->getMessage();
}

// Check DB
try {
    DB::connection()->getPdo();
    $results['step3_db'] = 'Connected to: ' . DB::connection()->getDatabaseName();
} catch (Throwable $e) {
    die(json_encode(['db_failed' => $e->getMessage()]));
}

// Check tables
try {
    $tables = collect(DB::select('SHOW TABLES'))->map(fn($t) => array_values((array) $t)[0])->toArray();
    $results['step4_tables'] = $tables;

    $required = ['users', 'roles', 'permissions', 'role_permission', 'personal_access_tokens'];
    $missing = array_diff($required, $tables);
    $results['step4_missing_tables'] = array_values($missing);
} catch (Throwable $e) {
    $results['step4_error'] = $e->getMessage();
}

// Run migrations
try {
    $output = new Symfony\Component\Console\Output\BufferedOutput();
    Artisan::call('migrate', ['--force' => true], $output);
    $results['step5_migrate'] = trim($output->fetch());
} catch (Throwable $e) {
    $results['step5_migrate_error'] = $e->getMessage();
}

// Simulate actual login flow
try {
    $user = App\Models\User::with('role')->first();
    if ($user) {
        $results['step6_user_found'] = $user->email;
        $results['step6_role'] = $user->role ? $user->role->slug : 'NO ROLE';

        // Try creating a token (this is where 500 usually happens)
        $token = $user->createToken('test_token')->plainTextToken;
        $results['step6_token_created'] = 'OK (token works)';

        // Clean up test token
        $user->tokens()->where('name', 'test_token')->delete();

        // Try loading permissions
        $user->load('role.permissions');
        $perms = $user->role ? $user->role->permissions->pluck('slug') : [];
        $results['step6_permissions'] = $perms;
    } else {
        $results['step6_no_users'] = 'No users in database!';
    }
} catch (Throwable $e) {
    $results['step6_login_error'] = $e->getMessage();
    $results['step6_login_error_file'] = $e->getFile() . ':' . $e->getLine();
}

// Show last log lines
try {
    $logFile = storage_path('logs/laravel.log');
    if (file_exists($logFile)) {
        $content = file_get_contents($logFile);
        $lines = explode("\n", $content);
        $results['step7_last_logs'] = array_values(array_filter(array_slice($lines, -20)));
    }
} catch (Throwable $e) {
    $results['step7_log_error'] = $e->getMessage();
}

$results['php_version'] = PHP_VERSION;

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);