#!/usr/bin/env node
/**
 * audit-variant-completeness.mjs
 * 只读审计：版别体系完整性检查（穷尽收录驱动）。
 * 读取 scripts/variant-standard.json（权威版别清单），对照每枚钱币 variantsTable：
 *   - 缺失：清单关键词未出现在任一版别名中（硬指标，须补齐）
 *   - 待复核：版别名匹配不到任何清单关键词（人工确认重复/冗余/清单遗漏）
 * 注意：本脚本只读，不修改任何数据文件。
 * 用法：
 *   node scripts/audit-variant-completeness.mjs              # 控制台审计（每卷截断 12 行）
 *   node scripts/audit-variant-completeness.mjs --export <path>
 *                                                             # 额外导出全量 markdown 甄别清单（无截断）
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
  let v = normalize(rowVariant);
  if (!v) v = String(rowVariant || '').trim(); // 归一化后为空则回退原始名（如整行为「美品版」）
  let k = normalize(keyword);
  if (!k) k = String(keyword || '').trim(); // 关键词归一化后为空（如「美品」）同样回退原始值
  if (!v || !k) return false;
  return v.includes(k) || k.includes(v);
}

// --export <path>：全量导出 markdown 甄别清单（与控制台输出共用同一匹配结果）
const exportIdx = process.argv.indexOf('--export');
const EXPORT_PATH = exportIdx !== -1 ? process.argv[exportIdx + 1] : null;
if (exportIdx !== -1 && !EXPORT_PATH) {
  console.error('用法：audit-variant-completeness.mjs --export <输出路径.md>');
  process.exit(2);
}

function main() {
  console.log('=== 版别体系完整性审计（只读）===\n');
  let totalCoins = 0, totalMissing = 0, totalReview = 0, totalUncovered = 0;
  const files = fs
    .readdirSync(DYNASTIES_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));

  // 结构化结果：每卷 { dynasty, coinCount, coins: [{ id, name, missing, review, uncovered, rowCount }] }
  const report = [];

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DYNASTIES_DIR, f), 'utf-8'));
    const idx = String(data.dynastyIndex);
    const std = STANDARD[idx] || {};
    const lines = [];
    let dynMissing = 0, dynReview = 0, dynUncovered = 0;
    const dynCoins = [];

    for (const c of data.coins) {
      totalCoins++;
      const rows = c.detail?.variantsTable || [];
      const names = rows.map((r) => r.variant);
      const checklist = std[c.name];
      const entry = { id: c.id, name: c.name, missing: [], review: [], uncovered: false, rowCount: names.length };

      if (!checklist) {
        if (names.length > 0) {
          dynUncovered++;
          entry.uncovered = true;
          if (lines.length < 12) lines.push(`  ${c.id} ${c.name} | ⚠️ 清单未覆盖（${names.length}行版别，请在 variant-standard.json 登记）`);
        }
        dynCoins.push(entry);
        continue;
      }
      for (const k of checklist) {
        if (!names.some((n) => coveredBy(n, k))) {
          dynMissing++;
          entry.missing.push(k);
          if (lines.length < 12) lines.push(`  ${c.id} ${c.name} | ❌ 缺失 [${k}]`);
        }
      }
      for (const n of names) {
        if (!checklist.some((k) => coveredBy(n, k))) {
          dynReview++;
          entry.review.push(n);
          if (lines.length < 12) lines.push(`  ${c.id} ${c.name} | 👁 待复核 [${n}]`);
        }
      }
      dynCoins.push(entry);
    }

    totalMissing += dynMissing;
    totalReview += dynReview;
    totalUncovered += dynUncovered;
    report.push({ dynasty: data.dynasty, coinCount: data.coins.length, missing: dynMissing, review: dynReview, uncovered: dynUncovered, coins: dynCoins });
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
  console.log(`清单未覆盖：${totalUncovered}`);
  if (EXPORT_PATH) exportMarkdown(EXPORT_PATH, report, { totalCoins, totalMissing, totalReview, totalUncovered });
  if (totalMissing > 0) process.exit(1);
}

function exportMarkdown(outPath, report, totals) {
  const today = new Date().toISOString().slice(0, 10);
  const out = [];
  out.push(`# 版别体系人工甄别清单`);
  out.push('');
  out.push(`> 生成：${today}（\`node scripts/audit-variant-completeness.mjs --export\`，只读导出）`);
  out.push(`> 基线：data/dynasties/0—20.json（${totals.totalCoins} 枚）× scripts/variant-standard.json`);
  out.push(`> 20 卷（历代铁钱）清单已按 docs/铁钱 文档重建，本卷覆盖完整。`);
  out.push('');
  out.push(`**动作约定**：`);
  out.push('');
  out.push('| 标记 | 含义 | 建议动作 |');
  out.push('|---|---|---|');
  out.push(`| ❌ 缺失 | 权威清单中的版别未见于 variantsTable | 核对四部泉谱后补录版别行，或修订清单条目 |`);
  out.push(`| 👁 待复核 | 数据行匹配不到任何清单关键词 | 确认是否冗余/可合并，或将其纳入清单 |`);
  out.push(`| ⚠️ 清单未覆盖 | 该币尚无清单登记（但有版别行） | 按 docs/泉谱文档在 variant-standard.json 登记 |`);
  out.push('');
  out.push(`## 各卷概览`);
  out.push('');
  out.push(`| 卷 | 钱币 | 缺失 | 待复核 | 未覆盖 |`);
  out.push(`|---|---|---|---|---|`);
  for (const d of report) {
    const flag = d.missing || d.review || d.uncovered ? '' : ' ✅';
    out.push(`| 【${d.dynasty}】 | ${d.coinCount} | ${d.missing || 0} | ${d.review || 0} | ${d.uncovered || 0} |${flag}`);
  }
  out.push(`| **合计** | **${totals.totalCoins}** | **${totals.totalMissing}** | **${totals.totalReview}** | **${totals.totalUncovered}** |`);
  out.push('');

  for (const d of report) {
    const issueCoins = d.coins.filter((c) => c.uncovered || c.missing.length || c.review.length);
    if (!issueCoins.length) continue;
    out.push(`## 【${d.dynasty}】（${d.coinCount} 枚｜缺失 ${d.missing}｜待复核 ${d.review}｜未覆盖 ${d.uncovered}）`);
    out.push('');
    for (const c of issueCoins) {
      out.push(`### ${c.id} ${c.name}`);
      if (c.uncovered) out.push(`- ⚠️ 清单未覆盖：共 ${c.rowCount} 行版别，请在 variant-standard.json 登记`);
      for (const k of c.missing) out.push(`- ❌ 缺失：${k}`);
      for (const n of c.review) out.push(`- 👁 待复核：${n}`);
      out.push('');
    }
  }

  const abs = path.isAbsolute(outPath) ? outPath : path.join(ROOT, outPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, out.join('\n') + '\n', 'utf-8');
  console.log(`已导出甄别清单：${path.relative(ROOT, abs)}（${out.length} 行）`);
}

main();
