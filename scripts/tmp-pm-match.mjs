import fs from 'fs';
import path from 'path';
import https from 'https';

const ROOT = path.resolve(import.meta.url.replace('file://', ''), '..', '..');
const COINS_FILE = path.join(ROOT, 'data', 'coins.json');
const CACHE_FILE = path.join(ROOT, 'data', 'image-fetch-cache.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'coins');

const sanitize = n => n.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '');
const coinsData = JSON.parse(fs.readFileSync(COINS_FILE, 'utf-8'));
const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));

const pmEntries = new Map();
for (const [k, v] of Object.entries(cache)) {
  if (k.startsWith('pm:')) {
    if (!pmEntries.has(v.name)) {
      pmEntries.set(v.name, { key: k, ...v });
    }
  }
}

const pmNames = [...pmEntries.keys()];

const missing = [];
for (const dynasty of coinsData) {
  for (const coin of dynasty.coins) {
    const mainPath = path.join(IMAGES_DIR, sanitize(dynasty.dynasty), sanitize(coin.name), 'main.jpg');
    if (!fs.existsSync(mainPath) || fs.statSync(mainPath).size <= 1000) {
      missing.push({ name: coin.name, dynasty: dynasty.dynasty });
    }
  }
}

function norm(s) {
  return s.replace(/[\s\u3000]/g, '')
    .replace(/[（）()【】\[\]]/g, '')
    .replace(/铜钱$/g, '').replace(/青铜$/g, '').replace(/金钱$/g, '')
    .replace(/铁钱$/g, '').replace(/铅钱$/g, '').replace(/铜币$/g, '')
    .replace(/银币$/g, '').replace(/银元$/g, '').replace(/铜元$/g, '')
    .replace(/背.*$/g, '').replace(/-[^-]*$/g, '').trim();
}

let matched = 0;
const results = [];
for (const c of missing) {
  const cn = norm(c.name);
  let bestMatch = null;
  let bestScore = 0;

  for (const pm of pmNames) {
    const pn = norm(pm);
    if (cn === pn && cn.length >= 2) {
      if (1.0 > bestScore) { bestScore = 1.0; bestMatch = pm; }
      continue;
    }
    if ((pn.includes(cn) || cn.includes(pn)) && cn.length >= 2 && pn.length >= 2) {
      const longerLen = Math.max(pn.length, cn.length);
      const shorterLen = Math.min(pn.length, cn.length);
      const score = 0.5 + 0.4 * (shorterLen / longerLen);
      if (score > bestScore) { bestScore = score; bestMatch = pm; }
    }
  }

  if (bestMatch && bestScore >= 0.5) {
    matched++;
    const entry = pmEntries.get(bestMatch);
    results.push({ name: c.name, dynasty: c.dynasty, match: bestMatch, score: bestScore, imageUrl: entry?.imageUrl });
  }
}

console.log(`缺失: ${missing.length}, 故宫博物院可匹配: ${matched}`);
results.forEach(r => console.log(`  ${r.name}(${r.dynasty}) => ${r.match} [${r.score.toFixed(2)}]`));
