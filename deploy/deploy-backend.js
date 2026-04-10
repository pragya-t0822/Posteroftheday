import { Client } from 'basic-ftp';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, posix } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Load env
const envPath = join(__dirname, '.env');
const envVars = {};
readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    const [key, ...rest] = line.split('=');
    envVars[key.trim()] = rest.join('=').trim();
});

const BACKEND_DIR = join(ROOT, 'backend');

// Directories to SKIP
const SKIP = new Set([
    'node_modules',
    '.git',
    'tests',
    'storage/logs',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/framework/cache/data',
]);

const NEVER_OVERWRITE = new Set(['.env']);

function shouldSkip(relativePath) {
    for (const skip of SKIP) {
        if (relativePath === skip || relativePath.startsWith(skip + '/')) {
            return true;
        }
    }
    return false;
}

async function getAllFiles(dir, baseDir) {
    const files = [];
    const entries = readdirSync(dir);
    for (const entry of entries) {
        const fullPath = join(dir, entry);
        const relPath = relative(baseDir, fullPath).replace(/\\/g, '/');

        if (shouldSkip(relPath)) continue;

        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
            files.push({ type: 'dir', fullPath, relPath });
            files.push(...await getAllFiles(fullPath, baseDir));
        } else {
            if (NEVER_OVERWRITE.has(relPath)) continue;
            files.push({ type: 'file', fullPath, relPath });
        }
    }
    return files;
}

async function deploy() {
    const client = new Client();
    client.ftp.verbose = false;

    try {
        console.log('\n=== Connecting to Backend Server (FTP) ===\n');
        await client.access({
            host: envVars.BACKEND_HOST,
            port: parseInt(envVars.BACKEND_PORT),
            user: envVars.BACKEND_USER,
            password: envVars.BACKEND_PASS,
            secure: false,
        });
        console.log('Connected!\n');

        client.ftp.ipFamily = 4;
        client.availableListCommands = ["LIST"];

        const remotePath = envVars.BACKEND_PATH;

        console.log('Scanning backend files...\n');
        const entries = await getAllFiles(BACKEND_DIR, BACKEND_DIR);
        const dirs = entries.filter(e => e.type === 'dir');
        const fileEntries = entries.filter(e => e.type === 'file');

        console.log(`Found ${fileEntries.length} files in ${dirs.length} directories\n`);

        // Ensure directories exist
        console.log('Creating directories...\n');
        for (const dir of dirs) {
            const remoteDir = posix.join(remotePath, dir.relPath);
            try {
                await client.ensureDir(remoteDir);
                await client.cd(remotePath);
            } catch {
                // directory may already exist
            }
        }

        // Upload files
        console.log('Uploading files...\n');
        let uploaded = 0;
        for (const file of fileEntries) {
            const remoteDest = posix.join(remotePath, file.relPath);
            try {
                await client.uploadFrom(file.fullPath, remoteDest);
                uploaded++;
                if (uploaded % 50 === 0 || uploaded === fileEntries.length) {
                    console.log(`  Uploaded ${uploaded}/${fileEntries.length} files...`);
                }
            } catch (err) {
                console.warn(`  Failed: ${file.relPath} — ${err.message}`);
            }
        }

        console.log(`\nUploaded ${uploaded}/${fileEntries.length} files`);
        console.log('\n=== Backend Deployed Successfully! ===');
        console.log(`URL: https://api.pod.allinonebimaposter.com\n`);
        console.log('Post-deploy: SSH into server and run:');
        console.log('  cd ' + remotePath);
        console.log('  php artisan config:cache');
        console.log('  php artisan route:cache');
        console.log('  php artisan migrate --force\n');

    } catch (err) {
        console.error('Deployment failed:', err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

await deploy();
