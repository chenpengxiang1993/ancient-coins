/**
 * backup-coins.mjs
 * 备份 data/dynasties/ 目录到 data/backups/dynasties.{timestamp}.tar，
 * 保留最近 5 份；若 tar 不可用则降级为目录复制。
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const DYNASTIES_DIR = path.join(DATA_DIR, 'dynasties');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const MAX_BACKUPS = 5;

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

if (!fs.existsSync(DYNASTIES_DIR)) {
  console.log('data/dynasties/ 不存在，跳过备份');
  process.exit(0);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });
const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);

let bakEntry;
try {
  const tarPath = path.join(BACKUP_DIR, `dynasties.${ts}.tar`);
  execSync(`tar -cf ${JSON.stringify(tarPath)} -C ${JSON.stringify(DATA_DIR)} dynasties`, {
    stdio: 'ignore',
  });
  bakEntry = path.basename(tarPath);
} catch {
  const dirPath = path.join(BACKUP_DIR, `dynasties.${ts}`);
  copyDirSync(DYNASTIES_DIR, dirPath);
  bakEntry = path.basename(dirPath);
}

const entries = fs
  .readdirSync(BACKUP_DIR)
  .filter((n) => n.startsWith('dynasties.'))
  .sort()
  .reverse();

for (let i = MAX_BACKUPS; i < entries.length; i++) {
  const p = path.join(BACKUP_DIR, entries[i]);
  fs.rmSync(p, { recursive: true, force: true });
}

console.log(
  `✓ 备份: data/backups/${bakEntry} (保留最近 ${Math.min(entries.length, MAX_BACKUPS)} 份)`
);
