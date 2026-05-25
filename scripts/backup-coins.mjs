import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COINS_JSON = path.join(ROOT, 'data', 'coins.json');

if (fs.existsSync(COINS_JSON)) {
  const ts = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const bakPath = path.join(ROOT, 'data', `coins.json.bak.${ts}`);
  fs.copyFileSync(COINS_JSON, bakPath);

  const bakFiles = fs.readdirSync(path.join(ROOT, 'data'))
    .filter(f => f.startsWith('coins.json.bak.'))
    .sort()
    .reverse();

  const MAX_BACKUPS = 5;
  for (let i = MAX_BACKUPS; i < bakFiles.length; i++) {
    fs.unlinkSync(path.join(ROOT, 'data', bakFiles[i]));
  }

  console.log(`✓ 备份: ${bakPath} (保留最近 ${Math.min(bakFiles.length, MAX_BACKUPS)} 份)`);
} else {
  console.log('coins.json 不存在，跳过备份');
}
