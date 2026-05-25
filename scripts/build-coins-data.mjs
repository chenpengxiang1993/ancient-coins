/**
 * build-coins-data.mjs
 * 合并原 parse-coins-data.mjs + migrate-variants.mjs 的完整流程：
 *   docs/target/*.md → data/coins.json（含 variantsTable + _sourceHash）
 *
 * 每个朝代 JSON 文件头写入对应 MD 文件的 SHA-256 哈希，
 * validate-data.mjs 可通过比对哈希发现"MD 已修改但未重新构建"的情况。
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT, 'docs', 'target');
const OUTPUT_DIR = path.join(ROOT, 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'coins.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'coins');

// ─── 朝代文件列表 ────────────────────────────────────────────────────────────

const DYNASTY_FILES = [
  { file: 'a-先秦钱币.md', dynasty: '先秦钱币', prefix: 'a', dynastyIndex: 0 },
  { file: 'b-秦钱币.md', dynasty: '秦钱币', prefix: 'b', dynastyIndex: 1 },
  { file: 'c-汉代钱币.md', dynasty: '汉代钱币', prefix: 'c', dynastyIndex: 2 },
  { file: 'd-新莽钱币.md', dynasty: '新莽钱币', prefix: 'd', dynastyIndex: 3 },
  { file: 'e-三国钱币.md', dynasty: '三国钱币', prefix: 'e', dynastyIndex: 4 },
  { file: 'f-两晋十六国钱币.md', dynasty: '两晋十六国钱币', prefix: 'f', dynastyIndex: 5 },
  { file: 'g-南朝钱币.md', dynasty: '南朝钱币', prefix: 'g', dynastyIndex: 6 },
  { file: 'h-北朝钱币.md', dynasty: '北朝钱币', prefix: 'h', dynastyIndex: 7 },
  { file: 'i-隋朝钱币.md', dynasty: '隋朝钱币', prefix: 'i', dynastyIndex: 8 },
  { file: 'j-唐朝钱币.md', dynasty: '唐朝钱币', prefix: 'j', dynastyIndex: 9 },
  { file: 'k-五代十国钱币.md', dynasty: '五代十国钱币', prefix: 'k', dynastyIndex: 10 },
  { file: 'l-辽朝钱币.md', dynasty: '辽朝钱币', prefix: 'l', dynastyIndex: 11 },
  { file: 'm-北宋钱币.md', dynasty: '北宋钱币', prefix: 'm', dynastyIndex: 12 },
  { file: 'n-西夏钱币.md', dynasty: '西夏钱币', prefix: 'n', dynastyIndex: 13 },
  { file: 'o-金朝钱币.md', dynasty: '金朝钱币', prefix: 'o', dynastyIndex: 14 },
  { file: 'p-南宋钱币.md', dynasty: '南宋钱币', prefix: 'p', dynastyIndex: 15 },
  { file: 'q-元朝钱币.md', dynasty: '元朝钱币', prefix: 'q', dynastyIndex: 16 },
  { file: 'r-明朝钱币.md', dynasty: '明朝钱币', prefix: 'r', dynastyIndex: 17 },
  { file: 's-明末农民起义钱币.md', dynasty: '明末农民起义钱币', prefix: 's', dynastyIndex: 18 },
  { file: 't-南明钱币.md', dynasty: '南明钱币', prefix: 't', dynastyIndex: 19 },
  { file: 'u-清朝钱币.md', dynasty: '清朝钱币', prefix: 'u', dynastyIndex: 20 },
  { file: 'v-三藩钱币.md', dynasty: '三藩钱币', prefix: 'v', dynastyIndex: 21 },
  { file: 'w-太平天国钱币.md', dynasty: '太平天国钱币', prefix: 'w', dynastyIndex: 22 },
  { file: 'x-晚清起义钱币.md', dynasty: '晚清起义钱币', prefix: 'x', dynastyIndex: 23 },
  { file: 'y-花钱_压胜钱.md', dynasty: '花钱_压胜钱', prefix: 'y', dynastyIndex: 24 },
  { file: 'z-外国钱币.md', dynasty: '外国钱币', prefix: 'z', dynastyIndex: 25 },
];

// ─── 工具函数 ─────────────────────────────────────────────────────────────────

function atomicWriteJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmp, filePath);
}

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function sanitizeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '');
}

// ─── 图片 ─────────────────────────────────────────────────────────────────────

function getCoinImageBasePath(dynasty, coinName, prefix) {
  return `/images/coins/${prefix}-${sanitizeFileName(dynasty)}/${sanitizeFileName(coinName)}`;
}

function extractVariantNames(variantsText) {
  if (!variantsText) return [];
  const names = [];
  const regex = /\*\*(.+?)\*\*/g;
  let match;
  while ((match = regex.exec(variantsText)) !== null) {
    const name = match[1].trim();
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

function buildCoinImages(dynasty, coinName, variantsText, prefix) {
  const basePath = getCoinImageBasePath(dynasty, coinName, prefix);
  const coinDir = path.join(
    IMAGES_DIR,
    `${prefix}-${sanitizeFileName(dynasty)}`,
    sanitizeFileName(coinName)
  );

  const mainExists = fs.existsSync(path.join(coinDir, 'main.jpg'));
  const main = mainExists ? `${basePath}/main.jpg` : '';

  const variantNames = extractVariantNames(variantsText);
  const variants = [];

  if (fs.existsSync(coinDir)) {
    const files = fs.readdirSync(coinDir).sort();
    for (const file of files) {
      if (file.startsWith('variant_') && file.endsWith('.jpg')) {
        const m = file.match(/^variant_(\d+)\.jpg$/);
        if (m) {
          const idx = parseInt(m[1], 10);
          const variantName = variantNames[idx - 1] || `版别${idx}`;
          variants.push({
            src: `${basePath}/${file}`,
            alt: `${coinName} - ${variantName}`,
            label: variantName,
          });
        }
      }
    }
  }

  return { main, variants };
}

// ─── Markdown 解析 ────────────────────────────────────────────────────────────

function parseSummaryTable(content) {
  const coins = [];
  const lines = content.split('\n');
  let inTable = false;
  let headers = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const cells = trimmed.split('|').slice(1, -1).map(c => c.replace(/\*\*/g, '').trim());
      if (!inTable) {
        headers = cells;
        inTable = true;
        continue;
      }
      if (cells.every(c => /^[-:\s]+$/.test(c))) continue;
      if (headers && cells.length >= 6) {
        coins.push({
          name: cells[0],
          historicalPeriod: cells[1],
          ruler: cells[2],
          coreFeatures: cells[3],
          estimatedValue: cells[4],
          rarity: cells[5],
        });
      }
    } else if (inTable && !trimmed.startsWith('|')) {
      inTable = false;
    }
  }
  return coins;
}

/**
 * 解析新版三段式面背特征结构（B方案）：
 *   * **面背特征**：
 *     * 通用特征项...（钱币特征/common）
 *     * ***面特征***
 *       * 正面特征项...
 *     * ***背特征***
 *       * 背面特征项...
 *
 * 输出：detail.featuresGroup = { common, obverse, reverse }
 * 兼容旧版（无面特征/背特征子标题的平铺格式）：所有内容归入 common
 */
function parseFeaturesGroup(detail) {
  const raw = detail.obverseFeatures || '';
  if (!raw) {
    detail.featuresGroup = { common: '', obverse: '', reverse: '' };
    delete detail.obverseFeatures;
    delete detail.reverseFeatures;
    return;
  }

  const lines = raw.split('\n');
  const commonLines = [];
  const obverseLines = [];
  const reverseLines = [];
  // 'common' | 'obverse' | 'reverse'
  let section = 'common';

  for (const line of lines) {
    const trimmed = line.trim();
    // 匹配 ***面特征*** 或 **面特征** 子标题（支持 "  * ***面特征***" 等多种写法）
    if (/(?:^\*?\s*)?\*{2,3}面特征\*{2,3}/.test(trimmed)) {
      section = 'obverse';
      continue;
    }
    if (/(?:^\*?\s*)?\*{2,3}背特征\*{2,3}/.test(trimmed)) {
      section = 'reverse';
      continue;
    }

    if (section === 'obverse') {
      obverseLines.push(trimmed);
    } else if (section === 'reverse') {
      reverseLines.push(trimmed);
    } else {
      commonLines.push(trimmed);
    }
  }

  detail.featuresGroup = {
    common: commonLines.join('\n').trim(),
    obverse: obverseLines.join('\n').trim(),
    reverse: reverseLines.join('\n').trim(),
  };
  delete detail.obverseFeatures;
  delete detail.reverseFeatures;
}

function parseCoinDetails(content) {
  const details = [];
  const sections = content.split(/^## /m).slice(1);

  for (const section of sections) {
    const titleMatch = section.match(/^[\d.]+\s+(.+)$/m);
    if (!titleMatch) continue;
    const coinName = titleMatch[1].trim();

    const subsections = section.split(/^### /m).slice(1);
    for (const sub of subsections) {
      const subNameMatch = sub.match(/^(.+)$/m);
      if (!subNameMatch) continue;

      const detail = {
        castingTime: '',
        material: '',
        dimensions: '',
        obverseFeatures: '',
        reverseFeatures: '',
        castingCraft: '',
        coreBackground: '',
        variants: '',
        valueReference: '',
        valueTable: [],
      };

      const fields = [
        { key: 'castingTime', label: '铸造时间' },
        { key: 'material', label: '材质成分' },
        { key: 'dimensions', label: '尺寸重量' },
        { key: 'obverseFeatures', label: '面背特征' },
        { key: 'castingCraft', label: '铸造工艺' },
        { key: 'coreBackground', label: '核心背景' },
        { key: 'variants', label: '版别体系' },
        { key: 'valueReference', label: '价值参考' },
      ];

      let currentField = null;
      let currentValue = [];
      const lines = sub.split('\n');
      let tableStarted = false;
      let tableHeaders = null;

      for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('> ')) continue;

        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
          const cells = trimmed.split('|').slice(1, -1).map(c => c.replace(/\*\*/g, '').trim());
          if (cells.every(c => /^[-:\s]*$/.test(c))) continue;

          if (!tableStarted) {
            tableStarted = true;
            tableHeaders = cells;
            continue;
          }

          if (currentField === 'valueReference' && tableHeaders && cells.length >= 4) {
            detail.valueTable.push({
              variant: cells[0],
              grade: cells[1],
              priceRange: cells[2],
              notes: cells[3] || '',
            });
          }
          continue;
        } else if (tableStarted) {
          tableStarted = false;
        }

        const fieldMatch = trimmed.match(/^[-*] \*\*(.+?)\*\*[：:]?\s*(.*)/);
        if (fieldMatch) {
          const label = fieldMatch[1];
          const value = fieldMatch[2];
          // 跳过 ***面特征***/***背特征*** 等三重星号子标题，作为普通内容收集
          if (/^\*面特征$|^\*背特征$/.test(label)) {
            if (currentField) {
              currentValue.push(trimmed);
              continue;
            }
          }
          const field = fields.find(f => f.label === label);
          if (field) {
            if (currentField && currentValue.length > 0) {
              detail[currentField] = currentValue.join('\n').trim();
            }
            currentField = field.key;
            currentValue = value ? [value] : [];
            continue;
          }
        }

        if ((trimmed.startsWith('- ') || trimmed.startsWith('* ')) && currentField) {
          currentValue.push(trimmed);
          continue;
        }

        if (line !== trimmed && currentField) {
          currentValue.push(trimmed);
          continue;
        }

        if (trimmed === '' && currentField && currentValue.length > 0) continue;
      }

      if (currentField && currentValue.length > 0) {
        detail[currentField] = currentValue.join('\n').trim();
      }

      parseFeaturesGroup(detail);
      details.push({ name: coinName, detail });
    }
  }

  return details;
}

// ─── variants 迁移（原 migrate-variants.mjs）────────────────────────────────

function cleanText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^[*\-]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseVariantsText(variants) {
  const entries = [];
  if (!variants) return entries;
  const lines = variants.split('\n');
  for (const line of lines) {
    const match = line.match(/^[*\-]\s+\*\*(.+?)\*\*[：:]\s*(.+)$/);
    if (match) {
      entries.push({ name: match[1].trim(), description: match[2].trim() });
      continue;
    }
    const match2 = line.match(/^[*\-]\s+\*\*(.+?)\*\*[，,]?\s*(.+)$/);
    if (match2) {
      entries.push({ name: match2[1].trim(), description: match2[2].trim() });
    }
  }
  if (entries.length === 0 && variants.trim()) {
    entries.push({ name: '__general__', description: cleanText(variants.trim()) });
  }
  return entries;
}

function parseDimensions(dimensions) {
  const denomMap = {};
  if (!dimensions) return denomMap;
  const lines = dimensions.split('\n');
  for (const line of lines) {
    const cleanLine = line.replace(/^[*\-]\s*/, '').trim();
    if (!cleanLine) continue;
    const denomMatch = cleanLine.match(
      /^(小型|中型|大型|小平钱?|折二[钱型]?|折三[钱型]?|折五[钱型]?|折十[钱型大]?|当五[钱型]?|当十[钱型大]?|当二十|当五十|当百|当千|当五百|铁钱|铁品|铜品|银质|金质|铜质|汉文小平|满文小平|汉文折十|满文折十)[：:，,]?/
    );
    if (denomMatch) {
      const denom = denomMatch[1];
      const rest = cleanLine.substring(denomMatch[0].length).replace(/^[：:，,]\s*/, '').trim();
      denomMap[denom] = rest;
    } else {
      if (!denomMap['__general__']) denomMap['__general__'] = '';
      denomMap['__general__'] += (denomMap['__general__'] ? '，' : '') + cleanLine;
    }
  }
  return denomMap;
}

function normalize(name) {
  return name
    .replace(/版$/, '')
    .replace(/型$/, '')
    .replace(/钱$/, '')
    .replace(/（.*?）/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[""「」]/g, '')
    .trim();
}

function matchVariant(vtName, parsedName) {
  if (!vtName || !parsedName) return false;
  const a = normalize(vtName);
  const b = normalize(parsedName);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

function findDescription(variantName, parsedEntries) {
  for (const entry of parsedEntries) {
    if (entry.name === '__general__') continue;
    if (matchVariant(variantName, entry.name))
      return { desc: entry.description, idx: parsedEntries.indexOf(entry) };
  }
  const parts = variantName.match(/[一-鿿]{2,}/g) || [];
  if (parts.length > 1) {
    for (const part of parts) {
      for (const entry of parsedEntries) {
        if (entry.name === '__general__') continue;
        if (matchVariant(part, entry.name))
          return { desc: entry.description, idx: parsedEntries.indexOf(entry) };
      }
    }
  }
  const generalEntry = parsedEntries.find(e => e.name === '__general__');
  if (generalEntry) return { desc: generalEntry.description, idx: -1 };
  return { desc: '', idx: -1 };
}

function findDimensionInfo(variantName, denomMap) {
  const norm = normalize(variantName);
  for (const [denom, info] of Object.entries(denomMap)) {
    if (denom === '__general__') continue;
    if (norm === normalize(denom) || norm.includes(normalize(denom)) || normalize(denom).includes(norm))
      return info;
  }
  for (const [denom, info] of Object.entries(denomMap)) {
    if (denom === '__general__') continue;
    const normDenom = normalize(denom);
    const parts = norm.match(/[一-鿿]{2,}/g) || [];
    for (const part of parts) {
      if (normDenom.includes(part) || part.includes(normDenom)) return info;
    }
  }
  return '';
}

function getDenominationType(variantName) {
  if (/当五百/.test(variantName)) return '当五百';
  if (/当五十/.test(variantName)) return '当五十';
  if (/当二十/.test(variantName)) return '当二十';
  if (/折十|当十/.test(variantName)) return '折十';
  if (/折五|当五/.test(variantName)) return '折五';
  if (/折三/.test(variantName)) return '折三';
  if (/折二/.test(variantName)) return '折二';
  if (/小平/.test(variantName)) return '小平';
  if (/当百/.test(variantName)) return '当百';
  if (/当千/.test(variantName)) return '当千';
  return null;
}

const DENOM_SPECS = {
  '小平': { size: '直径约2.3—2.5cm', weight: '重约3—4g' },
  '折二': { size: '直径约2.7—3.0cm', weight: '重约5—7g' },
  '折三': { size: '直径约3.0—3.3cm', weight: '重约8—10g' },
  '折五': { size: '直径约3.3—3.5cm', weight: '重约10—15g' },
  '折十': { size: '直径约3.8—4.5cm', weight: '重约15—25g' },
  '当五': { size: '直径约3.3—3.5cm', weight: '重约10—15g' },
  '当十': { size: '直径约3.8—4.5cm', weight: '重约15—25g' },
  '当二十': { size: '直径约4.5—5.0cm', weight: '重约20—35g' },
  '当五十': { size: '直径约5.0—5.5cm', weight: '重约30—50g' },
  '当百': { size: '直径约5.5—7.0cm', weight: '重约40—80g' },
  '当千': { size: '直径约6.0—8.0cm', weight: '重约50—100g' },
  '当五百': { size: '直径约5.8—7.5cm', weight: '重约45—90g' },
};

function buildDescription(variantName, matchedDesc, denomMap) {
  const parts = [];
  if (matchedDesc) {
    let cleanedDesc = cleanText(matchedDesc).replace(/[。，、；：]+$/, '');
    if (cleanedDesc) parts.push(cleanedDesc);
  }

  const dimInfo = findDimensionInfo(variantName, denomMap);
  const hasSizeInDesc = parts.some(p => /直径|cm|厘米|通高|mm/.test(p));
  const hasWeightInDesc = parts.some(p => /重约|重量|单枚重|g|克/.test(p));

  if (dimInfo) {
    const cleanedDim = cleanText(dimInfo).replace(/^[：:，,]\s*/, '').replace(/[。]+$/, '');
    if (!parts.some(p => p.includes(cleanedDim))) {
      const dimHasSize = /直径|cm|厘米|通高|mm/.test(cleanedDim);
      const dimHasWeight = /重约|重量|单枚重|g|克/.test(cleanedDim);
      if (dimHasSize && !hasSizeInDesc) parts.push(cleanedDim);
      else if (dimHasWeight && !hasWeightInDesc) parts.push(cleanedDim);
      else if (!dimHasSize && !dimHasWeight) parts.push(cleanedDim);
      else if (!hasSizeInDesc && !hasWeightInDesc) parts.push(cleanedDim);
    }
  }

  const hasSize = parts.some(p => /直径|cm|厘米|通高|mm/.test(p));
  const hasWeight = parts.some(p => /重约|重量|单枚重|[0-9]g|[0-9]克/.test(p));
  const denomType = getDenominationType(variantName);

  if (!hasSize && denomType && DENOM_SPECS[denomType]) parts.push(DENOM_SPECS[denomType].size);
  if (!hasWeight && denomType && DENOM_SPECS[denomType]) parts.push(DENOM_SPECS[denomType].weight);

  if (parts.length === 0 && denomMap['__general__']) parts.push(cleanText(denomMap['__general__']));
  if (parts.length === 0) {
    const generated = generateFromName(variantName);
    if (generated) parts.push(generated);
  }

  return parts.join('，');
}

function generateFromName(variantName) {
  const backMatch = variantName.match(/^背[\""](.+?)[\""](.*)$/);
  if (backMatch) return `背面铸"${backMatch[1] + backMatch[2]}"`;
  if (/^背/.test(variantName) && !/背纪地|背文/.test(variantName)) return `背面${variantName.substring(1)}`;
  if (/.+局$/.test(variantName)) return `${variantName}铸行`;
  if (/(楷书|篆书|行书|草书|隶书|宋体)版?$/.test(variantName)) return `${variantName.replace(/版$/, '')}面文`;
  if (/^(铜质|银质|金质|铁品|铜品)$/.test(variantName)) return `${variantName}铸造`;
  if (/特殊版别|特殊品类|特殊面文版别|特殊版别（按面文风格分）/.test(variantName)) return '特殊版别，存世较少';
  if (/按面值分|按材质分|按面文风格分|按背文位置分/.test(variantName)) return '按类别细分的版别';
  if (/常见局|少见局|稀少局/.test(variantName)) return `${variantName}，铸量不等`;
  if (/少见版/.test(variantName)) return '较少见的版别';
  if (/普通版/.test(variantName)) return '普通版别，较为常见';
  if (/大面值/.test(variantName)) return '大面值版别';
  if (/天子万年/.test(variantName)) return '面文"天子万年"，宫钱类';
  if (/天下太平/.test(variantName)) return '面文"天下太平"，宫钱类';
  if (/母钱/.test(variantName)) return '母钱，铸工精整，用于翻制子钱';
  if (/雕母|祖钱/.test(variantName)) return '雕母（祖钱），手工雕刻，存世极罕';
  if (/常见天干/.test(variantName)) return '背面铸常见天干纪年';
  if (/少见天干/.test(variantName)) return '背面铸少见天干纪年';
  return variantName;
}

function inferRarity(variant, notes, description) {
  const text = `${variant} ${notes} ${description}`;
  if (/仅见|孤品/.test(text)) return { level: '一', abundance: '孤品' };
  if (/极为罕见|极为珍稀|极为难得|极为珍贵/.test(text)) return { level: '二', abundance: '极罕' };
  if (/极罕/.test(text)) return { level: '二', abundance: '极罕' };
  if (/极稀/.test(text)) return { level: '三', abundance: '极稀' };
  if (/很稀/.test(text)) return { level: '四', abundance: '很稀' };
  if (/较为罕见/.test(text)) return { level: '四', abundance: '罕见' };
  if (/罕见|大珍/.test(text)) return { level: '四', abundance: '罕见' };
  if (/稀见|珍稀|珍贵/.test(text)) return { level: '五', abundance: '稀' };
  if (/较少见/.test(text)) return { level: '七', abundance: '较少' };
  if (/少见/.test(text)) return { level: '六', abundance: '少' };
  if (/最常见|最为常见/.test(text)) return { level: '十', abundance: '多泛' };
  if (/较常见/.test(text)) return { level: '八', abundance: '较多' };
  if (/常见/.test(text)) return { level: '九', abundance: '多' };
  return { level: '八', abundance: '较多' };
}

function migrateDetail(detail) {
  const parsedEntries = parseVariantsText(detail.variants);
  const valueTable = detail.valueTable || [];
  const denomMap = parseDimensions(detail.dimensions);

  const variantsTable = [];
  const usedParsedEntries = new Set();

  for (const row of valueTable) {
    const variantName = row.variant || '';
    const { desc: matchedDesc, idx } = findDescription(variantName, parsedEntries);
    if (idx >= 0) usedParsedEntries.add(idx);
    const fullDesc = buildDescription(variantName, matchedDesc, denomMap);
    const rarity = inferRarity(variantName, row.notes, fullDesc);
    const grade = `${rarity.level}级（${rarity.abundance}） ${row.grade || ''}`;
    variantsTable.push({
      variant: variantName,
      description: fullDesc,
      grade,
      priceRange: row.priceRange || '',
      notes: row.notes || '',
    });
  }

  for (let i = 0; i < parsedEntries.length; i++) {
    if (usedParsedEntries.has(i)) continue;
    const entry = parsedEntries[i];
    if (entry.name === '__general__') continue;
    const fullDesc = buildDescription(entry.name, entry.description, denomMap);
    const rarity = inferRarity(entry.name, '', fullDesc);
    variantsTable.push({
      variant: entry.name,
      description: fullDesc,
      grade: `${rarity.level}级（${rarity.abundance}）`,
      priceRange: '',
      notes: '',
    });
  }

  const hasPrice = new Set();
  for (const row of variantsTable) {
    if (row.priceRange && row.priceRange.trim()) hasPrice.add(normalize(row.variant));
  }
  const deduped = variantsTable.filter(row => {
    if (!row.priceRange || !row.priceRange.trim()) {
      if (hasPrice.has(normalize(row.variant))) return false;
    }
    return true;
  });

  const newDetail = { ...detail };
  delete newDetail.valueReference;
  delete newDetail.valueTable;
  delete newDetail.variants;
  newDetail.variantsTable = deduped;
  return newDetail;
}

// ─── 核心：解析单个 MD 文件 ──────────────────────────────────────────────────

function parseFile(filePath, dynasty, dynastyIndex, prefix) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sourceHash = sha256File(filePath);

  const parts = content.split(/^# 2\./m);
  const summaryPart = parts[0] || '';
  const detailPart = parts[1] || '';

  const summaries = parseSummaryTable(summaryPart);
  const detailEntries = parseCoinDetails('# 2.' + detailPart);

  const detailMap = new Map();
  for (const d of detailEntries) {
    detailMap.set(d.name, d.detail);
  }

  const coins = summaries.map((summary, idx) => {
    const rawDetail = detailMap.get(summary.name) || null;
    const images = buildCoinImages(dynasty, summary.name, rawDetail?.variants || '', prefix);

    let detail = null;
    if (rawDetail) {
      rawDetail.images = images;
      // 在 parse 完成后立即执行 migrate（不再需要单独步骤）
      detail = migrateDetail(rawDetail);
    }

    return {
      id: `${dynastyIndex}-${idx}`,
      name: summary.name,
      dynasty,
      dynastyIndex,
      summary: {
        ...summary,
        thumbnail: images.main,
      },
      detail,
    };
  });

  return {
    dynasty,
    dynastyIndex,
    _source: `docs/target/${path.basename(filePath)}`,
    _sourceHash: sourceHash,
    _generatedAt: new Date().toISOString(),
    coins,
  };
}

// ─── 主函数 ───────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allData = [];
  let totalCoins = 0;

  for (const { file, dynasty, dynastyIndex, prefix } of DYNASTY_FILES) {
    const filePath = path.join(TARGET_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️  文件不存在: ${file}`);
      continue;
    }
    const data = parseFile(filePath, dynasty, dynastyIndex, prefix);
    allData.push(data);
    totalCoins += data.coins.length;
    console.log(`✓ ${dynasty}: ${data.coins.length} 枚  [hash: ${data._sourceHash.slice(0, 8)}…]`);
  }

  atomicWriteJSON(OUTPUT_FILE, allData);
  console.log(`\n总计: ${allData.length} 个朝代, ${totalCoins} 枚钱币`);
  console.log(`输出: ${OUTPUT_FILE}`);

  // 确保图片目录存在
  let totalImageDirs = 0;
  for (const { prefix } of DYNASTY_FILES) {
    const dynastyData = allData.find(
      d => d.dynastyIndex === DYNASTY_FILES.find(f => f.prefix === prefix).dynastyIndex
    );
    if (!dynastyData) continue;
    for (const coin of dynastyData.coins) {
      const coinDir = path.join(
        IMAGES_DIR,
        `${prefix}-${sanitizeFileName(dynastyData.dynasty)}`,
        sanitizeFileName(coin.name)
      );
      fs.mkdirSync(coinDir, { recursive: true });
      totalImageDirs++;
    }
  }
  console.log(`✓ 图片目录已生成: ${IMAGES_DIR} (${totalImageDirs} 个钱币目录)`);
}

main();
