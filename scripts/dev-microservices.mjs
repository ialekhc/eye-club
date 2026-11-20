import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const envFile = new URL('../.env', import.meta.url);
if (existsSync(envFile)) process.loadEnvFile(envFile);
const apiDir = fileURLToPath(new URL('../server/', import.meta.url));

const MICROSERVICES = [
  { role: 'identity-tenant-service', port: '4001' },
  { role: 'catalog-tryon-service', port: '4002' },
  { role: 'commerce-order-service', port: '4003' },
  { role: 'clinical-store-service', port: '4004' },
  { role: 'pos-lab-service', port: '4005' },
  { role: 'api-gateway', port: '4000' },
];

const children = new Map();
let startedCluster = false;

function startMicroserviceCluster() {
  if (startedCluster) return;
  startedCluster = true;

  const gatewayEnv = {
    ...process.env,
    IDENTITY_SERVICE_URL: process.env.IDENTITY_SERVICE_URL || 'http://127.0.0.1:4001',
    CATALOG_SERVICE_URL: process.env.CATALOG_SERVICE_URL || 'http://127.0.0.1:4002',
    COMMERCE_SERVICE_URL: process.env.COMMERCE_SERVICE_URL || 'http://127.0.0.1:4003',
    CLINICAL_SERVICE_URL: process.env.CLINICAL_SERVICE_URL || 'http://127.0.0.1:4004',
    POS_SERVICE_URL: process.env.POS_SERVICE_URL || 'http://127.0.0.1:4005',
  };

  for (const svc of MICROSERVICES) {
    const proc = spawn(process.execPath, ['--watch', `${root}server/dist/main.js`], {
      cwd: apiDir,
      env: {
        ...gatewayEnv,
        MICROSERVICE_ROLE: svc.role,
        PORT: svc.port,
      },
      stdio: 'inherit',
    });
    children.set(svc.role, proc);
  }
}

const compiler = spawn('npm', ['run', 'build', '--', '--watch', '--preserveWatchOutput'], {
  cwd: apiDir,
  env: process.env,
  stdio: ['inherit', 'pipe', 'inherit'],
});

compiler.stdout.on('data', (data) => {
  process.stdout.write(data);
  if (!startedCluster && data.toString().includes('Found 0 errors')) {
    startMicroserviceCluster();
  }
});

function stopAll() {
  compiler.kill('SIGTERM');
  for (const proc of children.values()) {
    proc.kill('SIGTERM');
  }
}

process.on('SIGINT', stopAll);
process.on('SIGTERM', stopAll);
compiler.on('exit', (code) => {
  stopAll();
  process.exitCode = code ?? 1;
});
