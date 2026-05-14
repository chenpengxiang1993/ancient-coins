import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(import.meta.url.replace('file://', ''), '..', '..');
const CACHE_FILE = path.join(ROOT, 'data', 'image-fetch-cache.json');
const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));

const sources = {};
for (const [k, v] of Object.entries(cache)) {
  const prefix = k.split(':')[0] + ':';
  if (!sources[prefix]) sources[prefix] = 0;
  sources[prefix]++;
}
console.log('缓存来源统计:');
for (const [k, v] of Object.entries(sources)) {
  console.log(`  ${k}: ${v} 条`);
}

const shmEntries = new Map();
for (const [k, v] of Object.entries(cache)) {
  if (k.startsWith('shm:')) {
    if (!shmEntries.has(v.name)) {
      shmEntries.set(v.name, { key: k, ...v });
    }
  }
}
console.log(`\n上海博物馆唯一名称: ${shmEntries.size}`);
const shmNames = [...shmEntries.keys()].sort();
shmNames.forEach(n => console.log(`  ${n}`));
