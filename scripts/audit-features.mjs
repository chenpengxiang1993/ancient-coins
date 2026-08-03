#!/usr/bin/env node
/**
 * audit-features.mjs
 * 只读审计：旋读/直读描述覆盖率 + 版别表密度 + 字段空值检查。
 * 输出每朝代：
 *   - 缺失旋读/直读/对读描述的钱币（合理豁免：无文/先秦特殊形制，见 EXEMPT）
 *   - 版别表平均行数（深度细分目标：>= 5 行）
 *   - 空字段提示
 *
 * 注意：本脚本只读，不修改任何数据文件。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');

// 合理豁免：无钱文、两字钱、先秦特殊形制等本就不适用「旋读/直读」环形读法
// 这些币种将以符合形制的读法描述（布币直读、刀币横读等），不要求「旋读/直读」字样
const EXEMPT_HINTS = ['贝', '布', '刀', '蚁鼻', '圜钱', '半两', '白金', '花钱', '银币', '银钱', '铜币', '金版', '鱼币', '桥梁', '钱牌', '热西丁'];

function hasReadingDirection(text) {
  return /旋读|直读|对读|横读|环读|上下读|从左至右|从右至左/.test(text);
}

function main() {
  console.log('=== 钱币特征审计：旋读/直读 + 版别密度 + 空值（只读）===\n');
  let totalMissingReading = 0;
  let totalExempt = 0;
  let totalEmptyVariants = 0;
  let totalCoins = 0;

  const files = fs
    .readdirSync(DYNASTIES_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DYNASTIES_DIR, f), 'utf-8'));
    const coins = data.coins;
    totalCoins += coins.length;

    const missingReading = [];
    const exempt = [];
    let variantRows = 0;
    let emptyVariants = 0;

    for (const c of coins) {
      const det = c.detail;
      const rows = det?.variantsTable?.length || 0;
      variantRows += rows;
      if (rows === 0) {
        emptyVariants++;
        totalEmptyVariants++;
      }

      const fg = det?.featuresGroup || {};
      const blob = [fg.common, fg.obverse, fg.reverse, det?.coreBackground]
        .filter(Boolean)
        .join(' ');

      const name = c.name;
      const isExempt = EXEMPT_HINTS.some((h) => name.includes(h));
      if (!hasReadingDirection(blob)) {
        if (isExempt) {
          exempt.push(name);
          totalExempt++;
        } else {
          missingReading.push(name);
          totalMissingReading++;
        }
      }
    }

    const avg = coins.length ? (variantRows / coins.length).toFixed(1) : '0';
    console.log(`【${data.dynasty}】${coins.length}枚`);
    if (missingReading.length) {
      console.log(`  ❌ 缺旋读/直读描述 ${missingReading.length} 枚：${missingReading.join('、')}`);
    }
    if (exempt.length) {
      console.log(`  ➖ 合理豁免（特殊形制）${exempt.length} 枚：${exempt.join('、')}`);
    }
    if (emptyVariants) {
      console.log(`  ⚠️  版别表为空 ${emptyVariants} 枚`);
    }
    console.log(`  版别密度：平均 ${avg} 行/币`);
    console.log('');
  }

  console.log('=== 汇总 ===');
  console.log(`钱币总数：${totalCoins}`);
  console.log(`缺旋读/直读描述：${totalMissingReading}`);
  console.log(`合理豁免（特殊形制）：${totalExempt}`);
  console.log(`版别表为空：${totalEmptyVariants}`);
}

main();
