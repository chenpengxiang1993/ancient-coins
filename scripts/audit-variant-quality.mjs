#!/usr/bin/env node
/**
 * audit-variant-quality.mjs
 * 只读审计：版别描述质量检查（描述详细度）。
 *
 * 判定"弱描述"的两条硬标准：
 *   A. 过短（正文 < 20 字）
 *   B. 泛语主导：剔除存世语（较少见/罕见/品相上佳/字口清晰等）后，
 *      剩余有效描述 < 15 字，说明只有品相/存世泛语、无版别特征信息。
 *
 * 注意：本脚本只读，不修改任何数据文件。
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');

// 存世语/品相泛语（不构成版别学习信息）
const GENERIC_WORDS = [
  '较少见', '较为少见', '较为常见', '罕见', '少见', '较常见', '最为常见',
  '品相上佳', '品相较好', '品相精美', '品相极佳', '品相尚可',
  '铸工较精', '铸工尚可', '铸工精整', '铸工较粗', '铸工粗率', '铸工较好', '铸工极精',
  '字口清晰', '字口深峻', '字口浅平', '地章平整', '包浆自然', '包浆醇厚',
  '较为罕见', '极为罕见', '较常见', '少见者',
];

function stripGeneric(desc) {
  let body = desc;
  for (const g of GENERIC_WORDS) body = body.split(g).join('');
  return body;
}

function describeQuality(desc) {
  if (!desc || !desc.trim()) return { weak: true, reason: '空描述' };
  const body = stripGeneric(desc).trim();
  if (desc.length < 20 && body.length < 12) {
    return { weak: true, reason: `过短且无细节(${desc.length}字)` };
  }
  if (body.length < 12) {
    return { weak: true, reason: `泛语主导(有效${body.length}字): ${desc.slice(0, 50)}` };
  }
  return { weak: false };
}

function main() {
  console.log('=== 版别描述质量审计（只读）===\n');
  let totalWeak = 0;
  let totalDesc = 0;

  const files = fs
    .readdirSync(DYNASTIES_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DYNASTIES_DIR, f), 'utf-8'));
    const coins = data.coins;
    let dynWeak = 0;
    const lines = [];

    for (const c of coins) {
      const rows = c.detail?.variantsTable || [];
      for (const v of rows) {
        totalDesc++;
        const q = describeQuality(v.description || '');
        if (q.weak) {
          dynWeak++;
          totalWeak++;
          if (lines.length < 8) {
            lines.push(`  ${c.id} ${c.name} | [${v.variant}] ${q.reason}`);
          }
        }
      }
    }

    console.log(`【${data.dynasty}】${coins.length}枚`);
    if (dynWeak) {
      console.log(`  ⚠️  弱描述 ${dynWeak} 处`);
      lines.forEach((l) => console.log(l));
      if (dynWeak > 8) console.log(`  ... 共 ${dynWeak} 处`);
    } else {
      console.log(`  ✅ 描述质量达标`);
    }
    console.log('');
  }

  console.log('=== 汇总 ===');
  console.log(`描述总数：${totalDesc}`);
  console.log(`弱描述：${totalWeak}`);
}

main();
