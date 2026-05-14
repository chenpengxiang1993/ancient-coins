import fs from 'fs';
import path from 'path';

const coinsData = JSON.parse(fs.readFileSync('data/coins.json', 'utf-8'));
const cache = JSON.parse(fs.readFileSync('data/image-fetch-cache.json', 'utf-8'));
const IMAGES_DIR = path.join('public', 'images', 'coins');

function sanitizeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '_').replace(/\s+/g, '_');
}

const nmPcNames = Object.entries(cache)
  .filter(([k]) => k.startsWith('nm-pc:'))
  .map(([k, v]) => v.name);

const missingCoins = [];
for (const dynasty of coinsData) {
  for (const coin of dynasty.coins) {
    const coinDir = path.join(IMAGES_DIR, sanitizeFileName(dynasty.dynasty), sanitizeFileName(coin.name));
    const mainPath = path.join(coinDir, 'main.jpg');
    if (!fs.existsSync(mainPath) || fs.statSync(mainPath).size <= 1000) {
      missingCoins.push({ name: coin.name, dynasty: dynasty.dynasty });
    }
  }
}

console.log('缺失主图的钱币:', missingCoins.length);
console.log('\n国家博物馆PC端可能匹配的条目:');

function normalize(s) {
  return s
    .replace(/[\u201c\u201d\u3000\s]/g, '')
    .replace(/铜钱$/, '')
    .replace(/青铜$/, '')
    .replace(/金钱$/, '')
    .replace(/银钱$/, '')
    .replace(/铁钱$/, '')
    .replace(/铜元$/, '')
    .replace(/银元$/, '')
    .replace(/银币$/, '');
}

let matchedCount = 0;
for (const coin of missingCoins) {
  const normCoin = normalize(coin.name);
  const matches = nmPcNames.filter(nm => {
    const normNm = normalize(nm);
    return normNm.includes(normCoin) || normCoin.includes(normNm);
  });
  if (matches.length > 0) {
    matchedCount++;
    console.log(`  ${coin.name} (${coin.dynasty}) => ${matches.join(', ')}`);
  }
}

console.log(`\n可能匹配数: ${matchedCount}/${missingCoins.length}`);
