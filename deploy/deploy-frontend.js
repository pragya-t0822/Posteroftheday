import { Client } from 'basic-ftp';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, posix } from 'path';
import { execSync } from 'child_process';
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

const FRONTEND_DIR = join(ROOT, 'frontend');
const DIST_DIR = join(FRONTEND_DIR, 'dist');

async function build() {
    console.log('\n=== Building Frontend ===\n');
    try {
        execSync('npm run build', { cwd: FRONTEND_DIR, stdio: 'inherit' });
        console.log('\nBuild successful!\n');
    } catch {
        console.error('Build failed!');
        process.exit(1);
    }
}

async function deploy() {
    const client = new Client();
    client.ftp.verbose = false;

    try {
        console.log('=== Connecting to Frontend Server (FTP) ===\n');
        await client.access({
            host: envVars.FRONTEND_HOST,
            port: parseInt(envVars.FRONTEND_PORT),
            user: envVars.FRONTEND_USER,
            password: envVars.FRONTEND_PASS,
            secure: false,
        });
        console.log('Connected!\n');

        // Use active mode since passive mode times out on this server
        client.ftp.ipFamily = 4;
        client.availableListCommands = ["LIST"];

        const remotePath = envVars.FRONTEND_PATH;

        // Clear existing files on server
        console.log('Clearing old files on server...\n');
        try {
            const list = await client.list(remotePath);
            for (const item of list) {
                if (item.name === '.' || item.name === '..') continue;
                const itemPath = posix.join(remotePath, item.name);
                try {
                    if (item.isDirectory) {
                        await client.removeDir(itemPath);
                    } else {
                        await client.remove(itemPath);
                    }
                    console.log(`  Removed: ${item.name}`);
                } catch (e) {
                    console.warn(`  Could not remove ${item.name}: ${e.message}`);
                }
            }
        } catch (e) {
            console.warn(`  Could not clear: ${e.message}`);
        }

        // Upload dist contents
        console.log('\nUploading new build...\n');
        await client.uploadFromDir(DIST_DIR, remotePath);

        console.log('\n=== Frontend Deployed Successfully! ===');
        console.log(`URL: https://admin.pod.allinonebimaposter.com\n`);

    } catch (err) {
        console.error('Deployment failed:', err.message);
        process.exit(1);
    } finally {
        client.close();
    }
}

// Run
const skipBuild = process.argv.includes('--skip-build');

if (!skipBuild) {
    await build();
}

await deploy();
