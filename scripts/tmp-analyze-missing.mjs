import fs from 'fs';
import path from 'path';

const coinsData = JSON.parse(fs.readFileSync('data/coins.json', 'utf-8'));
const cache = JSON.parse(fs.readFileSync('data/image-fetch-cache.json', 'utf-8'));
const sanitize = n => n.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '');
const IMAGES_DIR = 'public/images/coins';

const missing = [];
for (const dynasty of coinsData) {
  for (const coin of dynasty.coins) {
    const mainPath = path.join(IMAGES_DIR, sanitize(dynasty.dynasty), sanitize(coin.name), 'main.jpg');
    if (!fs.existsSync(mainPath) || fs.statSync(mainPath).size <= 1000) {
      missing.push({ name: coin.name, dynasty: dynasty.dynasty });
    }
  }
}

const nmNames = new Map();
for (const [k, v] of Object.entries(cache)) {
  if (k.startsWith('nm:') || k.startsWith('nm-pc:')) {
    nmNames.set(k, v.name);
  }
}

function norm(s) {
  return s.replace(/[\s\u3000]/g, '')
    .replace(/铜钱$/, '')
    .replace(/青铜$/, '')
    .replace(/金钱$/, '')
    .replace(/铁钱$/, '')
    .replace(/铅钱$/, '');
}

const uniqueNmNames = [...new Set(nmNames.values())];

let matched = 0;
const matchResults = [];
for (const c of missing) {
  const cn = norm(c.name);
  let bestMatch = null;
  let bestLen = 0;
  for (const nm of uniqueNmNames) {
    const nn = norm(nm);
    if (nn.includes(cn) || cn.includes(nn)) {
      if (cn.length >= 2 && nn.length >= 2) {
        const len = Math.min(cn.length, nn.length);
        if (len > bestLen) {
          bestLen = len;
          bestMatch = nm;
        }
      }
    }
  }
  if (bestMatch) {
    matched++;
    matchResults.push(`${c.name}(${c.dynasty}) => ${bestMatch}`);
  }
}

console.log(`缺失: ${missing.length}, 可匹配: ${matched}`);
console.log('\n匹配列表:');
matchResults.forEach(r => console.log(`  ${r}`));

console.log('\n缺失钱币列表:');
missing.forEach(c => console.log(`  ${c.name} (${c.dynasty})`));
