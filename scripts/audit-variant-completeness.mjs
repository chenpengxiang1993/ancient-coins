#!/usr/bin/env node
/**
 * audit-variant-completeness.mjs
 * 只读审计：版别体系完整性检查（穷尽收录驱动）。
 * 读取 scripts/variant-standard.json（权威版别清单），对照每枚钱币 variantsTable：
 *   - 缺失：清单关键词未出现在任一版别名中（硬指标，须补齐）
 *   - 待复核：版别名匹配不到任何清单关键词（人工确认重复/冗余/清单遗漏）
 * 注意：本脚本只读，不修改任何数据文件。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');
const STANDARD_PATH = path.join(__dirname, 'variant-standard.json');

const STANDARD = JSON.parse(fs.readFileSync(STANDARD_PATH, 'utf-8'));

// 归一化：去引号、去括号注、去 版/型/种/钱/币 等后缀、去品相词
function normalize(name) {
  return (name || '')
    .replace(/[「」"'“”]/g, '')
    .replace(/[（(].*?[)）]/g, '')
    .replace(/(版|型|种|钱|币)$/g, '')
    .replace(/[（(]?(美品|普品|上佳|极美)[)）]?$/g, '')
    .trim();
}

// 双向子串匹配：清单关键词与版别名归一化后任一方向包含即算覆盖
function coveredBy(rowVariant, keyword) {
  const v = normalize(rowVariant);
  const k = normalize(keyword);
  if (!v || !k) return false;
  return v.includes(k) || k.includes(v);
}

function main() {
  console.log('=== 版别体系完整性审计（只读）===\n');
  let totalCoins = 0, totalMissing = 0, totalReview = 0;
  const files = fs
    .readdirSync(DYNASTIES_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DYNASTIES_DIR, f), 'utf-8'));
    const idx = String(data.dynastyIndex);
    const std = STANDARD[idx] || {};
    const lines = [];
    let dynMissing = 0, dynReview = 0, dynUncovered = 0;

    for (const c of data.coins) {
      totalCoins++;
      const rows = c.detail?.variantsTable || [];
      const names = rows.map((r) => r.variant);
      const checklist = std[c.name];

      if (!checklist) {
        if (names.length > 0) {
          dynUncovered++;
          if (lines.length < 12) lines.push(`  ${c.id} ${c.name} | ⚠️ 清单未覆盖（${names.length}行版别，请在 variant-standard.json 登记）`);
        }
        continue;
      }
      for (const k of checklist) {
        if (!names.some((n) => coveredBy(n, k))) {
          dynMissing++;
          if (lines.length < 12) lines.push(`  ${c.id} ${c.name} | ❌ 缺失 [${k}]`);
        }
      }
      for (const n of names) {
        if (!checklist.some((k) => coveredBy(n, k))) {
          dynReview++;
          if (lines.length < 12) lines.push(`  ${c.id} ${c.name} | 👁 待复核 [${n}]`);
        }
      }
    }

    totalMissing += dynMissing;
    totalReview += dynReview;
    console.log(`【${data.dynasty}】${data.coins.length}枚`);
    if (dynMissing || dynReview || dynUncovered) {
      lines.forEach((l) => console.log(l));
      if (lines.length >= 12) console.log(`  ... 共 ${dynMissing} 缺失 / ${dynReview} 待复核 / ${dynUncovered} 清单未覆盖`);
    } else {
      console.log(`  ✅ 版别清单覆盖完整`);
    }
    console.log('');
  }

  console.log('=== 汇总 ===');
  console.log(`钱币总数：${totalCoins}`);
  console.log(`缺失版别：${totalMissing}`);
  console.log(`待复核项：${totalReview}`);
  if (totalMissing > 0) process.exit(1);
}

main();
