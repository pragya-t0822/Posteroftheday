import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const target = args[0]; // 'frontend', 'backend', or 'all'
const extraArgs = args.slice(1).join(' ');

function run(script) {
    execSync(`node ${join(__dirname, script)} ${extraArgs}`, {
        stdio: 'inherit',
        cwd: __dirname,
    });
}

console.log('=========================================');
console.log('   Poster of the Day — Deploy Tool');
console.log('=========================================\n');

switch (target) {
    case 'frontend':
        run('deploy-frontend.js');
        break;
    case 'backend':
        run('deploy-backend.js');
        break;
    case 'all':
        run('deploy-frontend.js');
        run('deploy-backend.js');
        break;
    default:
        console.log('Usage:');
        console.log('  node deploy/deploy.js frontend           Build & deploy frontend');
        console.log('  node deploy/deploy.js frontend --skip-build   Deploy without rebuilding');
        console.log('  node deploy/deploy.js backend            Deploy backend');
        console.log('  node deploy/deploy.js all                Deploy everything');
        process.exit(1);
}
