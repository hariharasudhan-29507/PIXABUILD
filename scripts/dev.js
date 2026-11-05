const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

// Find directory paths whether run from root or frontend/
const isFrontend = __dirname.includes('frontend');
const rootDir = isFrontend 
  ? (__dirname.endsWith('scripts') ? path.resolve(__dirname, '..', '..') : path.resolve(__dirname, '..'))
  : (__dirname.endsWith('scripts') ? path.resolve(__dirname, '..') : __dirname);
const frontendDir = path.join(rootDir, 'frontend');

console.log('\n================================================================');
console.log('⚡ PIXABUILD: STARTING REAL NEURAL ENGINE & NEXT.JS FRONTEND');
console.log('   · Models: Meta AI SAM ViT-B (375MB) & Depth Anything V2 (99MB)');
console.log('   · Zero-Simulation Enforced: 100% Real Neural Inference');
console.log('================================================================\n');

const isWin = process.platform === 'win32';

function checkPort8000(callback) {
  let done = false;
  const req = http.get('http://127.0.0.1:8000/health', (res) => {
    if (done) return;
    done = true;
    callback(res.statusCode === 200);
  });
  req.on('error', () => {
    if (done) return;
    done = true;
    callback(false);
  });
  req.setTimeout(800, () => {
    if (done) return;
    done = true;
    req.destroy();
    callback(false);
  });
}

checkPort8000((alreadyRunning) => {
  let pyProcess = null;

  if (alreadyRunning) {
    console.log('✔ Python Neural Backend is already active on http://127.0.0.1:8000\n');
  } else {
    console.log('[1/2] 🧠 Launching Python Neural Backend (server.py)...');
    pyProcess = spawn('python server.py', {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });

    pyProcess.on('error', (err) => {
      console.error('❌ Failed to start Python server:', err.message);
    });
  }

  console.log('[2/2] 🌐 Launching Next.js Dev Server on http://localhost:3000...\n');
  const nextProcess = spawn('npm run dev:next', {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true,
  });

  nextProcess.on('error', (err) => {
    console.error('❌ Failed to start Next.js:', err.message);
  });

  function cleanup() {
    console.log('\n[PixaBuild] Shutting down services...');
    try {
      if (pyProcess && pyProcess.pid) {
        if (isWin) {
          spawn(`taskkill /pid ${pyProcess.pid} /f /t`, { shell: true });
        } else {
          pyProcess.kill('SIGINT');
        }
      }
      if (nextProcess && nextProcess.pid) {
        if (isWin) {
          spawn(`taskkill /pid ${nextProcess.pid} /f /t`, { shell: true });
        } else {
          nextProcess.kill('SIGINT');
        }
      }
    } catch {}
    process.exit();
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
});
