/**
 * split-coins-data.mjs
 * 从 data/dynasties/*.json 读取，生成前端消费的：
 *   - public/data/coins-summary.json（所有朝代摘要列表）
 *   - public/data/detail/{dynastyIndex}.json（按朝代拆分的详情）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');
const SUMMARY_OUT = path.join(ROOT, 'public', 'data');
const DETAIL_OUT = path.join(ROOT, 'public', 'data', 'detail');

function atomicWriteJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);
}

function loadDynasties() {
  const files = fs
    .readdirSync(DYNASTIES_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
  return files.map((f) => JSON.parse(fs.readFileSync(path.join(DYNASTIES_DIR, f), 'utf-8')));
}

const data = loadDynasties();

fs.mkdirSync(SUMMARY_OUT, { recursive: true });
fs.mkdirSync(DETAIL_OUT, { recursive: true });

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

const summaryPath = path.join(SUMMARY_OUT, 'coins-summary.json');
atomicWriteJSON(summaryPath, summaryList);

let detailTotalSize = 0;
for (const dynasty of data) {
  const detailMap = {};
  for (const coin of dynasty.coins) {
    if (coin.detail) detailMap[coin.id] = coin.detail;
  }
  const filePath = path.join(DETAIL_OUT, `${dynasty.dynastyIndex}.json`);
  atomicWriteJSON(filePath, detailMap);
  detailTotalSize += fs.statSync(filePath).size;
}

const totalDetails = data.reduce((sum, d) => sum + d.coins.length, 0);
const summarySize = (fs.statSync(summaryPath).size / 1024).toFixed(1);
const sourceSize = data.reduce(
  (sum, _, i) => sum + fs.statSync(path.join(DYNASTIES_DIR, `${i}.json`)).size,
  0
);

console.log(`✓ coins-summary.json → public/data/ (${summarySize} KB, ${totalDetails} 枚摘要)`);
console.log(
  `✓ detail/ → public/data/detail/ (${data.length} 个文件, 共 ${(detailTotalSize / 1024).toFixed(1)} KB)`
);
console.log(`  源 dynasties/: ${(sourceSize / 1024).toFixed(1)} KB`);
console.log(
  `  首屏加载减少: ${((1 - parseFloat(summarySize) / (sourceSize / 1024)) * 100).toFixed(0)}%`
);
