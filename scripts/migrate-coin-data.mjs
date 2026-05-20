/**
 * Data migration script for coins.json:
 * 1. Split obverseFeatures into obverseFeatures + reverseFeatures
 * 2. Standardize rarity grade formatting
 * 3. Remove duplicate variant+grade rows
 *
 * Usage: node scripts/migrate-coin-data.mjs
 */

import { readFileSync, writeFileSync } from 'fs';

const FILE_PATH = './data/coins.json';

// Canonical rarity grade term mapping (华光普十级制)
const GRADE_TERMS = {
  '一级': '大珍',
  '二级': '珍',
  '三级': '罕贵',
  '四级': '罕',
  '五级': '稀贵',
  '六级': '稀',
  '七级': '甚少',
  '八级': '较多',
  '九级': '多',
  '十级': '多泛',
};

// Non-standard terms that should be mapped to canonical terms
const TERM_ALIASES = {
  '极罕': '珍',       // 二级
  '罕见': '罕',       // 四级
  '较少': '甚少',     // 七级
  '少': '较多',       // 八级
  '较多': '多',       // 九级 (when used for 九级)
  '多泛': '多泛',     // 十级
  '大珍': '大珍',     // 一级
  '珍': '珍',         // 二级
  '罕贵': '罕见',     // 三级
  '稀贵': '稀贵',     // 五级
  '稀': '稀',         // 六级
  '甚少': '甚少',     // 七级
  '较多': '较多',     // 八级
  '多': '多',         // 九级
};

/**
 * Split obverseFeatures text into obverse-only and reverse parts.
 * Only splits when there are clear "背面：" or "背文：" header lines.
 * Returns { obverseFeatures, reverseFeatures }
 */
function splitFeatures(text) {
  if (!text) return { obverseFeatures: '', reverseFeatures: '' };

  const lines = text.split('\n');
  const obverseLines = [];
  const reverseLines = [];
  let inReverseSection = false;

  // Check if any line has a clear 背面/背文 header (bullet + keyword + colon)
  const hasReverseHeader = lines.some(line => {
    const stripped = line.trim();
    return /^[-*]\s*(背面|背文)[：:]/.test(stripped);
  });

  if (!hasReverseHeader) {
    // No clear reverse header — don't split, leave reverseFeatures empty
    return { obverseFeatures: text, reverseFeatures: '' };
  }

  // Obverse-related topic keywords that indicate end of reverse section
  const obverseTopicRe = /^(正面|面文|面文格式|钱文|文字|书法|青铜|质地|铜质|材质|表面|打磨|工艺|铸造工艺|穿[廓郭]?|外廓|内廓|边廓|无文字|整体)/;

  for (const line of lines) {
    // Strip bullet prefix to get the topic keyword
    const topicMatch = line.match(/^[-*\s]+/);
    const topicContent = topicMatch ? line.substring(topicMatch[0].length) : line;

    // Detect lines that start a reverse description header
    const isReverseHeader = /^(背面|背文)[：:]/.test(topicContent);

    if (isReverseHeader) {
      inReverseSection = true;
      reverseLines.push(line);
    } else if (inReverseSection && obverseTopicRe.test(topicContent)) {
      // New obverse topic found — end reverse section
      inReverseSection = false;
      obverseLines.push(line);
    } else if (inReverseSection) {
      // Still in reverse section — continuation
      reverseLines.push(line);
    } else {
      obverseLines.push(line);
    }
  }

  return {
    obverseFeatures: obverseLines.join('\n').trim(),
    reverseFeatures: reverseLines.join('\n').trim(),
  };
}

/**
 * Standardize rarity format in summary.rarity field.
 * Input examples: "八级 少", "七级（甚少）", "十级 多泛"
 * Output format: "X级（术语）"
 */
function standardizeRarity(rarity) {
  if (!rarity) return rarity;

  // Handle range grades like "七级至九级" - keep as-is
  if (rarity.includes('至')) return rarity;

  // Match patterns like "八级 少", "七级（甚少）", "十级 多泛"
  const match = rarity.match(/^(十级|九级|八级|七级|六级|五级|四级|三级|二级|一级)[\s（(](.+?)[）)]?$/);
  if (match) {
    const [, level, term] = match;
    const canonicalTerm = GRADE_TERMS[level] || term;
    return `${level}（${canonicalTerm}）`;
  }

  // Match pattern without parentheses: "八级 少" or "七级 甚少"
  const matchNoParens = rarity.match(/^(十级|九级|八级|七级|六级|五级|四级|三级|二级|一级)\s+(.+)$/);
  if (matchNoParens) {
    const [, level, term] = matchNoParens;
    const canonicalTerm = GRADE_TERMS[level] || term;
    return `${level}（${canonicalTerm}）`;
  }

  // Just a level number like "八级"
  const levelOnly = rarity.match(/^(十级|九级|八级|七级|六级|五级|四级|三级|二级|一级)$/);
  if (levelOnly) {
    const level = levelOnly[1];
    return `${level}（${GRADE_TERMS[level]}）`;
  }

  return rarity;
}

/**
 * Standardize grade format in variantsTable.grade field.
 * Input examples: "八级（较多） 普品", "七级（较少） 美品", "二级（极罕） 美品"
 * Output format: "X级（术语） 品级"
 */
function standardizeGrade(grade) {
  if (!grade) return grade;

  // Match "X级（term） 品级" pattern
  const match = grade.match(/^(十级|九级|八级|七级|六级|五级|四级|三级|二级|一级)[（(](.+?)[）)]\s*(.+)$/);
  if (match) {
    const [, level, term, quality] = match;
    const canonicalTerm = GRADE_TERMS[level] || term;
    return `${level}（${canonicalTerm}） ${quality}`;
  }

  // Match "X级 品级" without term
  const matchNoTerm = grade.match(/^(十级|九级|八级|七级|六级|五级|四级|三级|二级|一级)\s+(.+)$/);
  if (matchNoTerm) {
    const [, level, rest] = matchNoTerm;
    // Check if rest starts with a quality term
    const qualityMatch = rest.match(/^(普品|美品|极美品|美品以上)\s*(.*)$/);
    if (qualityMatch) {
      return `${level}（${GRADE_TERMS[level]}） ${qualityMatch[1]}`;
    }
    // rest might be a term + quality without parens
    return `${level}（${GRADE_TERMS[level]}） ${rest}`;
  }

  return grade;
}

/**
 * Remove duplicate variant+grade rows, keeping the one with richer notes.
 */
function deduplicateVariants(variantsTable) {
  if (!variantsTable || variantsTable.length === 0) return variantsTable;

  const seen = new Map();
  const result = [];

  for (const row of variantsTable) {
    const key = `${row.variant}|||${row.grade}`;
    if (seen.has(key)) {
      // Keep the one with longer/richer notes
      const existingIdx = seen.get(key);
      const existing = result[existingIdx];
      if ((row.notes || '').length > (existing.notes || '').length) {
        result[existingIdx] = row;
      }
      // Also merge descriptions if the new one is richer
      if ((row.description || '').length > (existing.description || '').length) {
        result[existingIdx].description = row.description;
      }
    } else {
      seen.set(key, result.length);
      result.push({ ...row });
    }
  }

  return result;
}

// Main
console.log('Reading coins.json...');
const data = JSON.parse(readFileSync(FILE_PATH, 'utf-8'));

let totalCoins = 0;
let totalSplits = 0;
let totalRarityFixes = 0;
let totalGradeFixes = 0;
let totalDedupRemoved = 0;

for (const dynasty of data) {
  for (const coin of dynasty.coins) {
    totalCoins++;

    // 1. Split obverseFeatures
    const detail = coin.detail;
    if (detail && detail.obverseFeatures) {
      const { obverseFeatures, reverseFeatures } = splitFeatures(detail.obverseFeatures);
      const oldLen = detail.obverseFeatures.length;
      const newObvLen = obverseFeatures.length;
      const newRevLen = reverseFeatures.length;

      if (newObvLen + newRevLen !== oldLen) {
        // Account for trimmed whitespace differences
        const diff = Math.abs(oldLen - newObvLen - newRevLen);
        if (diff > 5) {
          console.warn(`  WARNING: Content length mismatch for ${coin.name}: ${oldLen} → ${newObvLen}+${newRevLen}=${newObvLen + newRevLen}`);
        }
      }

      detail.obverseFeatures = obverseFeatures;
      detail.reverseFeatures = reverseFeatures;
      if (reverseFeatures) totalSplits++;
    } else if (detail) {
      detail.reverseFeatures = '';
    }

    // 2. Standardize rarity in summary
    const oldRarity = coin.summary.rarity;
    const newRarity = standardizeRarity(oldRarity);
    if (oldRarity !== newRarity) {
      totalRarityFixes++;
      coin.summary.rarity = newRarity;
    }

    // 3. Standardize grade in variantsTable & deduplicate
    if (detail && detail.variantsTable) {
      const oldGradeStrings = detail.variantsTable.map(v => v.grade).join('|');
      for (const row of detail.variantsTable) {
        const oldGrade = row.grade;
        const newGrade = standardizeGrade(oldGrade);
        if (oldGrade !== newGrade) {
          totalGradeFixes++;
          row.grade = newGrade;
        }
      }

      const oldLen = detail.variantsTable.length;
      detail.variantsTable = deduplicateVariants(detail.variantsTable);
      const removed = oldLen - detail.variantsTable.length;
      totalDedupRemoved += removed;
    }
  }
}

console.log(`\nProcessed ${totalCoins} coins:`);
console.log(`  - Split obverseFeatures: ${totalSplits} coins had reverse content extracted`);
console.log(`  - Rarity format fixes: ${totalRarityFixes}`);
console.log(`  - Grade format fixes: ${totalGradeFixes}`);
console.log(`  - Duplicate variants removed: ${totalDedupRemoved}`);

// Write back
console.log('\nWriting coins.json...');
writeFileSync(FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
console.log('Done!');
