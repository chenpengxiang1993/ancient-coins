import fs from 'fs';

const cache = JSON.parse(fs.readFileSync('data/image-fetch-cache.json', 'utf-8'));

const nmEntries = [];
for (const [k, v] of Object.entries(cache)) {
  if (k.startsWith('nm:') || k.startsWith('nm-pc:')) {
    nmEntries.push({ key: k, name: v.name, url: v.detailUrl || v.url });
  }
}

const uniqueNames = [...new Set(nmEntries.map(e => e.name))];
console.log(`国家博物馆缓存条目: ${nmEntries.length}`);
console.log(`唯一名称: ${uniqueNames.length}`);
console.log('\n所有名称:');
uniqueNames.sort().forEach(n => console.log(`  ${n}`));
