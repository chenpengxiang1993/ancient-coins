/**
 * sync-images.mjs
 * 扫描 public/images/coins/{prefix}-{dynasty}/{coinName}/ 目录，
 * 将 main.jpg + variant_N.jpg 写回各 data/dynasties/*.json 的 detail.images 字段。
 *
 * - main.jpg → images.main
 * - variant_N.jpg → images.variants[N-1]（按文件名排序，与 variantsTable 顺序对齐）
 * - summary.thumbnail 同步为 images.main
 * - 若钱币目录不存在则自动创建（保持后续放图友好）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'coins');

const PREFIXES = 'abcdefghijklmnopqrstuvwxyz';

function sanitizeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '');
}

function atomicWriteJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmp, filePath);
}

function scanCoinImages(prefix, dynasty, coinName, variantsTable) {
  const basePath = `/images/coins/${prefix}-${sanitizeFileName(dynasty)}/${sanitizeFileName(coinName)}`;
  const coinDir = path.join(
    IMAGES_DIR,
    `${prefix}-${sanitizeFileName(dynasty)}`,
    sanitizeFileName(coinName)
  );

  fs.mkdirSync(coinDir, { recursive: true });

  const mainExists = fs.existsSync(path.join(coinDir, 'main.jpg'));
  const main = mainExists ? `${basePath}/main.jpg` : '';

  const variants = [];
  const files = fs.readdirSync(coinDir).sort();
  for (const file of files) {
    const m = file.match(/^variant_(\d+)\.jpg$/);
    if (!m) continue;
    const idx = parseInt(m[1], 10);
    const row = variantsTable && variantsTable[idx - 1];
    const label = row?.variant || `版别${idx}`;
    variants.push({
      src: `${basePath}/${file}`,
      alt: `${coinName} - ${label}`,
      label,
    });
  }

  return { main, variants };
}

function main() {
  if (!fs.existsSync(DYNASTIES_DIR)) {
    console.error(`❌ ${DYNASTIES_DIR} 不存在`);
    process.exit(1);
  }

  let updatedCoins = 0;
  let totalCoins = 0;

  for (let i = 0; i < 26; i++) {
    const filePath = path.join(DYNASTIES_DIR, `${i}.json`);
    if (!fs.existsSync(filePath)) continue;

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const prefix = PREFIXES[data.dynastyIndex];

    for (const coin of data.coins) {
      totalCoins++;
      if (!coin.detail) continue;
      const images = scanCoinImages(
        prefix,
        data.dynasty,
        coin.name,
        coin.detail.variantsTable
      );
      const prev = coin.detail.images || {};
      const changed =
        prev.main !== images.main ||
        JSON.stringify(prev.variants || []) !== JSON.stringify(images.variants);

      coin.detail.images = images;
      coin.summary.thumbnail = images.main;
      if (changed) updatedCoins++;
    }

    atomicWriteJSON(filePath, data);
    console.log(`✓ [${String(i).padStart(2, '0')}] ${data.dynasty} (${data.coins.length} 枚)`);
  }

  console.log(`\n✅ 完成：扫描 ${totalCoins} 枚钱币，更新 ${updatedCoins} 枚的图片字段`);
}

main();
