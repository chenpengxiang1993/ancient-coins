import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse variants text into array of {name, description}
function parseVariantsText(variants) {
  const entries = [];
  if (!variants) return entries;

  // Try line-by-line parsing first
  const lines = variants.split('\n');
  for (const line of lines) {
    // Match: * **name**：description or - **name**：description
    const match = line.match(/^[*\-]\s+\*\*(.+?)\*\*[：:]\s*(.+)$/);
    if (match) {
      entries.push({ name: match[1].trim(), description: match[2].trim() });
    }
    // Also match bold names without colon but with description after
    const match2 = line.match(/^[*\-]\s+\*\*(.+?)\*\*[，,]?\s*(.+)$/);
    if (!match && match2) {
      entries.push({ name: match2[1].trim(), description: match2[2].trim() });
    }
  }

  // If no bold-name entries found, treat the whole text as general context
  if (entries.length === 0 && variants.trim()) {
    entries.push({ name: '__general__', description: cleanText(variants.trim()) });
  }

  return entries;
}

// Clean text: strip bold markers, bullet prefixes, normalize punctuation
function cleanText(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^[*\-]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Parse dimensions field into denomination-keyed map
// e.g. "* 小平钱：直径约2.4厘米" → { "小平钱": "直径约2.4厘米" }
function parseDimensions(dimensions) {
  const denomMap = {};
  if (!dimensions) return denomMap;

  const lines = dimensions.split('\n');
  for (const line of lines) {
    const cleanLine = line.replace(/^[*\-]\s*/, '').trim();
    if (!cleanLine) continue;

    // Match patterns like "小平钱：..." or "折二：..." or "汉文小平直径：..."
    const denomMatch = cleanLine.match(/^(小型|中型|大型|小平钱?|折二[钱型]?|折三[钱型]?|折五[钱型]?|折十[钱型大]?|当五[钱型]?|当十[钱型大]?|当二十|当五十|当百|当千|当五百|铁钱|铁品|铜品|银质|金质|铜质|汉文小平|满文小平|汉文折十|满文折十)[：:，,]?/);
    if (denomMatch) {
      const denom = denomMatch[1];
      const rest = cleanLine.substring(denomMatch[0].length).replace(/^[：:，,]\s*/, '').trim();
      denomMap[denom] = rest;
    } else {
      // General dimension line, store under "__general__"
      if (!denomMap['__general__']) denomMap['__general__'] = '';
      denomMap['__general__'] += (denomMap['__general__'] ? '，' : '') + cleanLine;
    }
  }

  return denomMap;
}

// Normalize a variant name for matching
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

// Check if a valueTable variant matches a parsed entry name
function matchVariant(vtName, parsedName) {
  if (!vtName || !parsedName) return false;
  const a = normalize(vtName);
  const b = normalize(parsedName);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  return false;
}

// Find best matching description from parsed variants text
function findDescription(variantName, parsedEntries) {
  // Try exact match first
  for (const entry of parsedEntries) {
    if (entry.name === '__general__') continue;
    if (matchVariant(variantName, entry.name)) return { desc: entry.description, idx: parsedEntries.indexOf(entry) };
  }
  // Try splitting compound names: "铜质小平" -> look for "铜质" or "小平"
  const parts = variantName.match(/[一-鿿]{2,}/g) || [];
  if (parts.length > 1) {
    for (const part of parts) {
      for (const entry of parsedEntries) {
        if (entry.name === '__general__') continue;
        if (matchVariant(part, entry.name)) return { desc: entry.description, idx: parsedEntries.indexOf(entry) };
      }
    }
  }
  // Try the general entry
  const generalEntry = parsedEntries.find(e => e.name === '__general__');
  if (generalEntry) return { desc: generalEntry.description, idx: -1 };
  return { desc: '', idx: -1 };
}

// Find matching dimension info for a variant
function findDimensionInfo(variantName, denomMap) {
  const norm = normalize(variantName);

  // Try exact denomination key match
  for (const [denom, info] of Object.entries(denomMap)) {
    if (denom === '__general__') continue;
    if (norm === normalize(denom) || norm.includes(normalize(denom)) || normalize(denom).includes(norm)) {
      return info;
    }
  }

  // Try partial match
  for (const [denom, info] of Object.entries(denomMap)) {
    if (denom === '__general__') continue;
    const normDenom = normalize(denom);
    // Check if variant name contains the denomination or vice versa
    const parts = norm.match(/[一-鿿]{2,}/g) || [];
    for (const part of parts) {
      if (normDenom.includes(part) || part.includes(normDenom)) return info;
    }
  }

  return '';
}

// Detect denomination type from variant name
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

// Standard denomination specs
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

// Build a clean description for a variant
function buildDescription(variantName, matchedDesc, denomMap) {
  const parts = [];

  // 1. Start with matched description from variants text
  if (matchedDesc) {
    let cleanedDesc = cleanText(matchedDesc);
    // Strip trailing punctuation that would clash with joining
    cleanedDesc = cleanedDesc.replace(/[。，、；：]+$/, '');
    if (cleanedDesc) parts.push(cleanedDesc);
  }

  // 2. Add dimension info
  const dimInfo = findDimensionInfo(variantName, denomMap);
  const hasSizeInDesc = parts.some(p => /直径|cm|厘米|通高|mm/.test(p));
  const hasWeightInDesc = parts.some(p => /重约|重量|单枚重|g|克/.test(p));

  if (dimInfo) {
    const cleanedDim = cleanText(dimInfo).replace(/^[：:，,]\s*/, '').replace(/[。]+$/, '');
    // Check if dimension info is already contained in description
    if (!parts.some(p => p.includes(cleanedDim))) {
      const dimHasSize = /直径|cm|厘米|通高|mm/.test(cleanedDim);
      const dimHasWeight = /重约|重量|单枚重|g|克/.test(cleanedDim);

      if (dimHasSize && !hasSizeInDesc) parts.push(cleanedDim);
      else if (dimHasWeight && !hasWeightInDesc) parts.push(cleanedDim);
      else if (!dimHasSize && !dimHasWeight) parts.push(cleanedDim);
      else if (!hasSizeInDesc && !hasWeightInDesc) parts.push(cleanedDim);
    }
  }

  // If no dimension info found, use standard denomination specs as fallback
  const hasSize = parts.some(p => /直径|cm|厘米|通高|mm/.test(p));
  const hasWeight = parts.some(p => /重约|重量|单枚重|[0-9]g|[0-9]克/.test(p));
  const denomType = getDenominationType(variantName);

  if (!hasSize && denomType && DENOM_SPECS[denomType]) {
    const spec = DENOM_SPECS[denomType];
    parts.push(spec.size);
  }
  // Add weight from standard specs if missing for a denomination variant
  if (!hasWeight && denomType && DENOM_SPECS[denomType]) {
    parts.push(DENOM_SPECS[denomType].weight);
  }

  // 3. If still no description, try general dimension info
  if (parts.length === 0 && denomMap['__general__']) {
    parts.push(cleanText(denomMap['__general__']));
  }

  // 4. Last resort: generate description from variant name
  if (parts.length === 0) {
    const generated = generateFromName(variantName);
    if (generated) parts.push(generated);
  }

  return parts.join('，');
}

// Generate a description from the variant name itself
function generateFromName(variantName) {
  // Back-mark variants: 背"X" → 背面铸"X"字
  const backMatch = variantName.match(/^背[\""](.+?)[\""](.*)$/);
  if (backMatch) {
    const text = backMatch[1] + backMatch[2];
    return `背面铸"${text}"`;
  }

  // Back variants: 背星月 → 背面铸星纹或月纹
  if (/^背/.test(variantName) && !/背纪地|背文/.test(variantName)) {
    return `背面${variantName.substring(1)}`;
  }

  // Mint variants: X局 → X局铸行
  if (/.+局$/.test(variantName)) {
    return `${variantName}铸行`;
  }

  // Calligraphy variants: 楷书版 → 楷书面文
  if (/(楷书|篆书|行书|草书|隶书|宋体)版?$/.test(variantName)) {
    return `${variantName.replace(/版$/, '')}面文`;
  }

  // Material variants: 铜质/银质/铁品/铜品
  if (/^(铜质|银质|金质|铁品|铜品)$/.test(variantName)) {
    return `${variantName}铸造`;
  }

  // Denomination fallback: 小平/折二 etc already handled by DENOM_SPECS
  // Generic category names
  if (/特殊版别|特殊品类|特殊面文版别|特殊版别（按面文风格分）/.test(variantName)) {
    return '特殊版别，存世较少';
  }
  if (/按面值分|按材质分|按面文风格分|按背文位置分/.test(variantName)) {
    return '按类别细分的版别';
  }
  if (/常见局|少见局|稀少局/.test(variantName)) {
    return `${variantName}，铸量不等`;
  }
  if (/少见版/.test(variantName)) {
    return '较少见的版别';
  }
  if (/普通版/.test(variantName)) {
    return '普通版别，较为常见';
  }
  if (/大面值/.test(variantName)) {
    return '大面值版别';
  }
  if (/天子万年/.test(variantName)) {
    return '面文"天子万年"，宫钱类';
  }
  if (/天下太平/.test(variantName)) {
    return '面文"天下太平"，宫钱类';
  }
  if (/母钱/.test(variantName)) {
    return '母钱，铸工精整，用于翻制子钱';
  }
  if (/雕母|祖钱/.test(variantName)) {
    return '雕母（祖钱），手工雕刻，存世极罕';
  }
  if (/常见天干/.test(variantName)) {
    return '背面铸常见天干纪年';
  }
  if (/少见天干/.test(variantName)) {
    return '背面铸少见天干纪年';
  }

  return variantName;
}

// Infer rarity level from variant name + notes + description keywords
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

// Migrate a single coin detail entry
function migrateDetail(detail) {
  const parsedEntries = parseVariantsText(detail.variants);
  const valueTable = detail.valueTable || [];
  const denomMap = parseDimensions(detail.dimensions);

  const variantsTable = [];
  const usedParsedEntries = new Set();

  // Process valueTable rows
  for (const row of valueTable) {
    const variantName = row.variant || '';

    // Find matching description from variants text
    const { desc: matchedDesc, idx } = findDescription(variantName, parsedEntries);
    if (idx >= 0) usedParsedEntries.add(idx);

    // Build full description
    const fullDesc = buildDescription(variantName, matchedDesc, denomMap);

    // Build grade with rarity level
    const rarity = inferRarity(variantName, row.notes, fullDesc);
    const originalGrade = row.grade || '';
    const grade = `${rarity.level}级（${rarity.abundance}） ${originalGrade}`;

    variantsTable.push({
      variant: variantName,
      description: fullDesc,
      grade,
      priceRange: row.priceRange || '',
      notes: row.notes || '',
    });
  }

  // Add parsed variants text entries that weren't matched to any valueTable row
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

  // Deduplicate: remove entries with empty priceRange if another entry with
  // the same normalized variant name has a non-empty priceRange
  const hasPrice = new Set();
  for (const row of variantsTable) {
    if (row.priceRange && row.priceRange.trim()) {
      hasPrice.add(normalize(row.variant));
    }
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

function atomicWriteJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  fs.renameSync(tmp, filePath);
}

const coinsPath = path.join(__dirname, '..', 'data', 'coins.json');
if (!fs.existsSync(coinsPath)) {
  console.error('coins.json not found');
  process.exit(1);
}

const coinsData = JSON.parse(fs.readFileSync(coinsPath, 'utf-8'));

for (const dynasty of coinsData) {
  for (const coin of dynasty.coins) {
    if (coin.detail) {
      coin.detail = migrateDetail(coin.detail);
    }
  }
}

atomicWriteJSON(coinsPath, coinsData);

const totalMigrated = coinsData.reduce((sum, d) => sum + d.coins.filter(c => c.detail).length, 0);
console.log(`Migrated coins.json: ${totalMigrated} entries`);

console.log('Migration complete!');
