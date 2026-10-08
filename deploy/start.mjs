import { spawn } from 'node:child_process';
const children = new Set();
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => { for (const child of children) child.kill('SIGKILL'); process.exit(code); }, 5000);
  if (!children.size) process.exit(code);
}
function run(args, env = process.env) {
  const child = spawn(process.execPath, args, { stdio: 'inherit', env });
  children.add(child);
  child.on('error', () => stop(1));
  child.on('exit', code => {
    children.delete(child);
    if (!stopping) stop(code || 1);
    else if (!children.size) process.exit(code || 0);
  });
}
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => stop(0));
const migration = spawn(process.execPath, ['node_modules/prisma/build/index.js', 'migrate', 'deploy', '--schema', 'apps/api/prisma/schema.prisma'], { stdio: 'inherit' });
const migrated = await new Promise((resolve, reject) => { migration.on('exit', resolve); migration.on('error', reject); });
if (migrated !== 0) process.exit(1);
run(['apps/api/dist/src/index.js'], { ...process.env, PORT: '4000' });
run(['apps/web/node_modules/next/dist/bin/next', 'start', 'apps/web', '-p', process.env.PORT || '3000', '-H', '0.0.0.0']);
