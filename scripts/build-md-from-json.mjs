/**
 * build-md-from-json.mjs
 * data/dynasties/*.json → docs/target/{prefix}-{dynasty}.md
 *
 * MD 文件为只读视图：
 *   - 头部含 @source 路径与 @source-hash（源 JSON 的 SHA-256）
 *   - 全部内容由本脚本生成，禁止手工编辑
 *   - validate-data.mjs 会在内存中重新生成并比对，发现篡改即报错
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');
const TARGET_DIR = path.join(ROOT, 'docs', 'target');

const PREFIXES = 'abcdefghijklmnopqrstuvwxyz';

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function atomicWrite(filePath, content) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf-8');
  fs.renameSync(tmp, filePath);
}

// ─── 内容片段��染 ─────────────────────────────────────────────────────────────

function renderSummaryTable(coins) {
  const lines = [
    '| 钱币名称 | 历史时期 | 主要铸造朝代/统治者 | 核心特征 | 估值范围（人民币） | 稀有度等级 |',
    '| --- | --- | --- | --- | --- | --- |',
  ];
  for (const coin of coins) {
    const s = coin.summary;
    lines.push(
      `| ${s.name} | ${s.historicalPeriod} | ${s.ruler} | ${s.coreFeatures} | ${s.estimatedValue} | ${s.rarity} |`
    );
  }
  return lines.join('\n');
}

function renderMultiline(text) {
  if (!text) return '_无_';
  return text.trim();
}

function renderFeaturesGroup(fg) {
  if (!fg) return '_无_';
  const parts = [];
  if (fg.common) parts.push(`**通用特征**\n\n${fg.common.trim()}`);
  if (fg.obverse) parts.push(`**面（正面）特征**\n\n${fg.obverse.trim()}`);
  if (fg.reverse) parts.push(`**背（反面）特征**\n\n${fg.reverse.trim()}`);
  return parts.length ? parts.join('\n\n') : '_无_';
}

function renderVariantsTable(rows) {
  if (!rows || rows.length === 0) return '_无_';
  const lines = [
    '| 版别 | 描述 | 等级 | 价格区间 | 备注 |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const row of rows) {
    const cells = [row.variant, row.description, row.grade, row.priceRange, row.notes].map(
      (c) => (c == null ? '' : String(c).replace(/\|/g, '\\|').replace(/\n/g, '<br>'))
    );
    lines.push(`| ${cells.join(' | ')} |`);
  }
  return lines.join('\n');
}

function renderImages(images) {
  if (!images) return '_无_';
  const parts = [];
  parts.push(`- 主图：${images.main || '_未提供_'}`);
  if (images.variants && images.variants.length > 0) {
    parts.push('- 版别图：');
    for (const v of images.variants) {
      parts.push(`  - \`${v.src}\` — ${v.label}`);
    }
  } else {
    parts.push('- 版别图：_无_');
  }
  return parts.join('\n');
}

function renderCoinDetail(coin, index) {
  const d = coin.detail;
  const lines = [];
  lines.push(`## 2.${index + 1} ${coin.name}`);
  lines.push('');
  if (!d) {
    lines.push('_暂无详细信息_');
    return lines.join('\n');
  }
  lines.push('### 基础信息');
  lines.push('');
  lines.push(`- **铸造时间**：${renderMultiline(d.castingTime)}`);
  lines.push(`- **材质成分**：${renderMultiline(d.material)}`);
  lines.push(`- **尺寸重量**：\n\n${renderMultiline(d.dimensions)}`);
  lines.push('');
  lines.push('### 面背特征');
  lines.push('');
  lines.push(renderFeaturesGroup(d.featuresGroup));
  lines.push('');
  lines.push('### 铸造工艺');
  lines.push('');
  lines.push(renderMultiline(d.castingCraft));
  lines.push('');
  lines.push('### 核心背景');
  lines.push('');
  lines.push(renderMultiline(d.coreBackground));
  lines.push('');
  lines.push('### 版别与价值');
  lines.push('');
  lines.push(renderVariantsTable(d.variantsTable));
  lines.push('');
  lines.push('### 图片资源');
  lines.push('');
  lines.push(renderImages(d.images));
  return lines.join('\n');
}

// ─── 顶层渲染 ────────────────────────────────────────────────────────────────

function renderDynastyMD(dynastyData, sourcePath, sourceHash) {
  const { dynasty, coins } = dynastyData;
  const lines = [];
  lines.push('<!--');
  lines.push(`  @source        ${sourcePath}`);
  lines.push(`  @source-hash   ${sourceHash}`);
  lines.push(`  @generated-by  scripts/build-md-from-json.mjs`);
  lines.push('  @warning       本文件由程序生成，请勿手工编辑；如需修改请改源 JSON 后运行 pnpm run parse-data');
  lines.push('-->');
  lines.push('');
  lines.push(`# ${dynasty}`);
  lines.push('');
  lines.push('# 1. 钱币一览');
  lines.push('');
  lines.push(renderSummaryTable(coins));
  lines.push('');
  lines.push('# 2. 钱币详情');
  lines.push('');
  for (let i = 0; i < coins.length; i++) {
    lines.push(renderCoinDetail(coins[i], i));
    lines.push('');
  }
  return lines.join('\n');
}

export function buildMDFromDynasty(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);
  const sourceHash = sha256(raw);
  const sourcePath = `data/dynasties/${path.basename(filePath)}`;
  return {
    data,
    sourceHash,
    sourcePath,
    content: renderDynastyMD(data, sourcePath, sourceHash),
  };
}

function main() {
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }

  let written = 0;
  for (let i = 0; i < 26; i++) {
    const jsonPath = path.join(DYNASTIES_DIR, `${i}.json`);
    if (!fs.existsSync(jsonPath)) continue;
    const { data, content } = buildMDFromDynasty(jsonPath);
    const prefix = PREFIXES[data.dynastyIndex];
    const mdName = `${prefix}-${data.dynasty}.md`;
    const mdPath = path.join(TARGET_DIR, mdName);
    atomicWrite(mdPath, content);
    console.log(`✓ [${String(i).padStart(2, '0')}] ${data.dynasty} → docs/target/${mdName}`);
    written++;
  }
  console.log(`\n✅ 完成：生成 ${written} 个 MD 文件`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
