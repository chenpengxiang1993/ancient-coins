import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'coins');
const WEBP_QUALITY = 80;
const THUMB_QUALITY = 70;
const THUMB_SIZE = 150;

const result = execSync(`find "${IMAGES_DIR}" -name "*.jpg" -type f`, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
const jpgFiles = result.trim().split('\n').filter(Boolean);

let converted = 0;
let skipped = 0;
let thumbsGenerated = 0;
let failed = 0;
let totalOriginal = 0;
let totalWebP = 0;

for (const jpg of jpgFiles) {
  const webp = jpg.replace(/\.jpg$/, '.webp');

  // Generate WebP if not exists or source is newer
  if (!existsSync(webp) || statSync(jpg).mtimeMs > statSync(webp).mtimeMs) {
    try {
      execSync(`cwebp -q ${WEBP_QUALITY} -m 6 "${jpg}" -o "${webp}"`, { stdio: 'pipe' });
      converted++;
      totalOriginal += statSync(jpg).size;
      totalWebP += statSync(webp).size;
    } catch {
      console.error(`✗ WebP 转换失败: ${path.relative(ROOT, jpg)}`);
      failed++;
      continue;
    }
  } else {
    skipped++;
  }

  // Generate thumbnail (only for main.jpg and variant_N.jpg)
  const isMainOrVariant = /\/(main|variant_\d+)\.jpg$/.test(jpg);
  if (isMainOrVariant) {
    const thumb = jpg
      .replace('/main.jpg', '/thumb.webp')
      .replace('/variant_', '/thumb_variant_')
      .replace(/\.jpg$/, '.webp');

    if (!existsSync(thumb) || statSync(jpg).mtimeMs > statSync(thumb).mtimeMs) {
      try {
        execSync(`cwebp -q ${THUMB_QUALITY} -m 4 -resize ${THUMB_SIZE} ${THUMB_SIZE} "${jpg}" -o "${thumb}"`, { stdio: 'pipe' });
        thumbsGenerated++;
      } catch {
        // thumbnail failure is non-critical
      }
    }
  }
}

console.log(`✓ WebP 转换完成: ${converted} 张转换, ${skipped} 张跳过, ${thumbsGenerated} 张缩略图, ${failed} 张失败`);
if (totalOriginal > 0) {
  const savedPct = ((1 - totalWebP / totalOriginal) * 100).toFixed(0);
  console.log(`  体积变化: ${(totalOriginal / 1024 / 1024).toFixed(1)} MB → ${(totalWebP / 1024 / 1024).toFixed(1)} MB (减少 ${savedPct}%)`);
}
