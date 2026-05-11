import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'data', 'coins.json');
const OUT_DIR = path.join(ROOT, 'data');

const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

const summaryList = data.map((dynasty) => ({
  dynasty: dynasty.dynasty,
  dynastyIndex: dynasty.dynastyIndex,
  coins: dynasty.coins.map((coin) => ({
    id: coin.id,
    name: coin.name,
    dynasty: coin.dynasty,
    dynastyIndex: coin.dynastyIndex,
    summary: coin.summary,
  })),
}));

fs.writeFileSync(
  path.join(OUT_DIR, 'coins-summary.json'),
  JSON.stringify(summaryList, null, 2),
  'utf-8'
);

for (const dynasty of data) {
  const detailMap = {};
  for (const coin of dynasty.coins) {
    if (coin.detail) {
      detailMap[coin.id] = coin.detail;
    }
  }
  const filePath = path.join(OUT_DIR, 'detail', `${dynasty.dynastyIndex}.json`);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(detailMap), 'utf-8');
}

const totalDetails = data.reduce((sum, d) => sum + d.coins.length, 0);
const summarySize = (fs.statSync(path.join(OUT_DIR, 'coins-summary.json')).size / 1024).toFixed(1);
const detailTotalSize = data.reduce((sum, d) => {
  const p = path.join(OUT_DIR, 'detail', `${d.dynastyIndex}.json`);
  return sum + fs.statSync(p).size;
}, 0);
const originalSize = (fs.statSync(INPUT).size / 1024).toFixed(1);

console.log(`✓ coins-summary.json: ${summarySize} KB (${totalDetails} 枚摘要)`);
console.log(`✓ detail/: ${data.length} 个文件, 共 ${(detailTotalSize / 1024).toFixed(1)} KB`);
console.log(`  原始 coins.json: ${originalSize} KB`);
console.log(`  首屏加载减少: ${((1 - parseFloat(summarySize) / parseFloat(originalSize)) * 100).toFixed(0)}%`);
