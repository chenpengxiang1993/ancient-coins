#!/usr/bin/env node
/**
 * 跨字段逻辑一致性校验脚本（只读）
 * 检查所有钱币数据中的逻辑矛盾和不一致问题
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const DATA_DIR = 'data/dynasties';
const DYNASTY_COUNT = 26;

// 马定祥十级制等级映射
const RARITY_LEVELS = {
  '一级': 1, '二级': 2, '三级': 3, '四级': 4, '五级': 5,
  '六级': 6, '七级': 7, '八级': 8, '九级': 9, '十级': 10,
};

const RARITY_LABELS = {
  1: '大珍', 2: '珍', 3: '罕贵', 4: '罕', 5: '稀贵',
  6: '稀', 7: '甚少', 8: '少', 9: '较多', 10: '多泛',
};

function parseRarity(rarityStr) {
  if (!rarityStr) return { level: null, label: null, isRange: false };
  // 匹配范围值格式如"五级（稀贵）至七级（甚少）"
  const rangeMatch = rarityStr.match(/(十级|一[级]|二[级]|三[级]|四[级]|五[级]|六[级]|七[级]|八[级]|九[级])[^至]*至(十级|一[级]|二[级]|三[级]|四[级]|五[级]|六[级]|七[级]|八[级]|九[级])/);
  if (rangeMatch) {
    const lowLevel = RARITY_LEVELS[rangeMatch[1]];
    const highLevel = RARITY_LEVELS[rangeMatch[2]];
    return { level: lowLevel, label: RARITY_LABELS[lowLevel], isRange: true, highLevel };
  }
  const match = rarityStr.match(/(十级|一[级]|二[级]|三[级]|四[级]|五[级]|六[级]|七[级]|八[级]|九[级])/);
  if (!match) return { level: null, label: null, isRange: false };
  const level = RARITY_LEVELS[match[1]];
  const label = RARITY_LABELS[level];
  return { level, label, isRange: false };
}

function parsePriceRange(priceStr) {
  if (!priceStr) return { min: null, max: null, isPerGram: false };
  // 优先匹配括号内的整版估价，如"每克800—1,500元（单枚约12,000—30,000元）"
  const bracketContent = priceStr.match(/（([^）]+)）/);
  if (bracketContent) {
    const innerMatch = bracketContent[1].match(/([\d,]+)\s*[—-]\s*([\d,]+)/);
    if (innerMatch) {
      return {
        min: parseInt(innerMatch[1].replace(/,/g, ''), 10),
        max: parseInt(innerMatch[2].replace(/,/g, ''), 10),
        isPerGram: priceStr.includes('每克'),
      };
    }
  }
  const match = priceStr.match(/([\d,]+)\s*[—-]\s*([\d,]+)/);
  if (!match) return { min: null, max: null, isPerGram: false };
  return {
    min: parseInt(match[1].replace(/,/g, ''), 10),
    max: parseInt(match[2].replace(/,/g, ''), 10),
    isPerGram: priceStr.includes('每克'),
  };
}

function parseWeight(dimensionsStr) {
  if (!dimensionsStr) return null;
  const match = dimensionsStr.match(/重量[：:]?\s*([\d.]+)\s*[—-]\s*([\d.]+)\s*g/);
  if (!match) {
    const match2 = dimensionsStr.match(/([\d.]+)\s*[—-]\s*([\d.]+)\s*g/);
    if (!match2) return null;
    return { min: parseFloat(match2[1]), max: parseFloat(match2[2]) };
  }
  return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
}

function parseDimensions(dimensionsStr) {
  if (!dimensionsStr) return {};
  const result = {};
  const patterns = [
    { key: 'diameter', regex: /直径[：:]?\s*([\d.]+)\s*[—-]\s*([\d.]+)\s*cm/ },
    { key: 'height', regex: /通高[：:]?\s*([\d.]+)\s*[—-]\s*([\d.]+)\s*cm/ },
    { key: 'length', regex: /长度[：:]?\s*([\d.]+)\s*[—-]\s*([\d.]+)\s*cm/ },
    { key: 'width', regex: /宽度[：:]?\s*([\d.]+)\s*[—-]\s*([\d.]+)\s*cm/ },
  ];
  for (const p of patterns) {
    const m = dimensionsStr.match(p.regex);
    if (m) result[p.key] = { min: parseFloat(m[1]), max: parseFloat(m[2]) };
  }
  return result;
}

function parseMaterialCopper(materialStr) {
  if (!materialStr) return null;
  const match = materialStr.match(/铜含量约(\d+)%\s*[—-]\s*(\d+)%/);
  if (!match) return null;
  return { min: parseInt(match[1]), max: parseInt(match[2]) };
}

const issues = [];
const stats = { total: 0, checked: 0, issues: 0, byCategory: {} };

function addIssue(coinId, coinName, dynasty, category, severity, message) {
  issues.push({ coinId, coinName, dynasty, category, severity, message });
  stats.issues++;
  stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
}

function checkCoin(coin, dynasty) {
  stats.checked++;
  const { id, name, summary, detail } = coin;

  // 1. 稀有度与市场价值关联性评估
  const summaryRarity = parseRarity(summary.rarity);
  const summaryPrice = parsePriceRange(summary.estimatedValue);

  if (summaryRarity.level && summaryPrice.min !== null) {
    // 稀有度低（等级高=常见）但价格极高 -> 可能矛盾
    if (summaryRarity.level >= 9 && summaryPrice.min > 5000) {
      addIssue(id, name, dynasty, '稀有度与价值', 'warning',
        `summary稀有度${summaryRarity.level}级（${RARITY_LABELS[summaryRarity.level]}）但最低估值${summaryPrice.min}元偏高，请核实`);
    }
    // 稀有度高（等级低=稀有）但价格极低 -> 可能矛盾
    if (summaryRarity.level <= 3 && summaryPrice.max < 10000) {
      addIssue(id, name, dynasty, '稀有度与价值', 'warning',
        `summary稀有度${summaryRarity.level}级（${RARITY_LABELS[summaryRarity.level]}）但最高估值${summaryPrice.max}元偏低，请核实`);
    }
  }

  // 2. 版别价格与summary价格范围的一致性
  if (detail.variantsTable && detail.variantsTable.length > 0) {
    const variantPrices = detail.variantsTable
      .map(v => parsePriceRange(v.priceRange))
      .filter(p => p.min !== null);

    if (variantPrices.length > 0) {
      const variantMin = Math.min(...variantPrices.map(p => p.min));
      const variantMax = Math.max(...variantPrices.map(p => p.max));

      if (summaryPrice.min !== null) {
        // summary价格范围应大致覆盖版别价格范围
        if (variantMin < summaryPrice.min * 0.5) {
          addIssue(id, name, dynasty, '价格范围', 'info',
            `版别最低价${variantMin}元显著低于summary最低价${summaryPrice.min}元，建议扩大summary范围或调整版别价格`);
        }
        if (variantMax > summaryPrice.max * 1.5) {
          addIssue(id, name, dynasty, '价格范围', 'info',
            `版别最高价${variantMax}元显著高于summary最高价${summaryPrice.max}元，建议扩大summary范围或调整版别价格`);
        }
      }
    }

    // 3. 版别等级一致性检查
    for (const v of detail.variantsTable) {
      const vGrade = parseRarity(v.grade);
      if (vGrade.level) {
        // 检查版别等级与版别价格的一致性
        const vPrice = parsePriceRange(v.priceRange);
        if (vPrice.min !== null && !vPrice.isPerGram) {
          if (vGrade.level >= 9 && vPrice.min > 10000) {
            addIssue(id, name, dynasty, '版别等级与价格', 'warning',
              `版别"${v.variant}"等级${vGrade.level}级（较多/多）但最低价${vPrice.min}元偏高`);
          }
          if (vGrade.level <= 2 && vPrice.max < 50000) {
            addIssue(id, name, dynasty, '版别等级与价格', 'warning',
              `版别"${v.variant}"等级${vGrade.level}级（大珍/珍）但最高价${vPrice.max}元偏低`);
          }
        }
      }
    }
  }

  // 4. 材质与重量匹配性
  const weight = parseWeight(detail.dimensions);
  const copper = parseMaterialCopper(detail.material);
  const dims = parseDimensions(detail.dimensions);

  if (weight && dims.diameter) {
    // 圆形方孔钱：直径与重量的合理性
    // 经验公式：圆形方孔钱面积 ≈ π * (d/2)^2，单位面积重量应在合理范围
    const avgDiameter = (dims.diameter.min + dims.diameter.max) / 2;
    const avgWeight = (weight.min + weight.max) / 2;
    const thickness = avgWeight / (Math.PI * (avgDiameter / 2) ** 2 * 8.9); // 铜密度8.9g/cm³
    if (thickness > 0.5) {
      addIssue(id, name, dynasty, '尺寸与重量', 'warning',
        `推断厚度${(thickness * 10).toFixed(1)}mm偏厚（直径${avgDiameter}cm/重${avgWeight}g），请核实尺寸与重量数据`);
    }
  }

  // 5. 重复版别名称检查
  if (detail.variantsTable && detail.variantsTable.length > 0) {
    const variantNames = detail.variantsTable.map(v => v.variant);
    const duplicates = variantNames.filter((name, i) => variantNames.indexOf(name) !== i);
    const uniqueDuplicates = [...new Set(duplicates)];
    for (const dup of uniqueDuplicates) {
      const count = variantNames.filter(n => n === dup).length;
      addIssue(id, name, dynasty, '版别重复', 'info',
        `版别名称"${dup}"出现${count}次（不同品相等级允许同名版别）`);
    }
  }

  // 6. 空字段检查
  const emptyChecks = [
    { field: 'summary.thumbnail', value: summary.thumbnail, required: false },
    { field: 'detail.images.main', value: detail.images?.main, required: false },
  ];
  for (const check of emptyChecks) {
    if (!check.value) {
      addIssue(id, name, dynasty, '缺失图片', 'info',
        `${check.field}为空`);
    }
  }

  // 7. 版别缺少价格信息
  if (detail.variantsTable) {
    for (const v of detail.variantsTable) {
      if (!v.priceRange) {
        addIssue(id, name, dynasty, '版别缺价', 'info',
          `版别"${v.variant}"缺少价格区间`);
      }
      if (!v.notes) {
        addIssue(id, name, dynasty, '版别缺备注', 'info',
          `版别"${v.variant}"缺少备注`);
      }
    }
  }

  // 8. featuresGroup内容检查
  if (detail.featuresGroup) {
    const { common, obverse, reverse } = detail.featuresGroup;
    if (!common || common.length < 10) {
      addIssue(id, name, dynasty, '特征描述', 'warning',
        `通用特征描述过短（${common?.length || 0}字），建议补充`);
    }
    if (!obverse || obverse.length < 5) {
      addIssue(id, name, dynasty, '特征描述', 'warning',
        `正面特征描述过短（${obverse?.length || 0}字），建议补充`);
    }
    if (!reverse || reverse.length < 5) {
      addIssue(id, name, dynasty, '特征描述', 'warning',
        `背面特征描述过短（${reverse?.length || 0}字），建议补充`);
    }
  }

  // 9. 铸造工艺描述与特征的一致性
  if (detail.castingCraft && detail.featuresGroup?.common) {
    const craftMethods = ['范铸', '锤鍱', '机制', '翻砂'];
    const featureMentions = craftMethods.filter(m => detail.featuresGroup.common.includes(m));
    const craftMentions = craftMethods.filter(m => detail.castingCraft.includes(m));
    if (featureMentions.length > 0 && craftMentions.length === 0) {
      addIssue(id, name, dynasty, '工艺一致性', 'info',
        `特征描述提及铸造方式${featureMentions.join('、')}，但铸造工艺字段未提及`);
    }
  }

  // 10. 稀有度等级标签一致性
  if (summaryRarity.level && !summaryRarity.isRange) {
    const expectedLabel = RARITY_LABELS[summaryRarity.level];
    if (expectedLabel && !summary.rarity.includes(expectedLabel) && !summary.rarity.includes(expectedLabel.replace('泛', ''))) {
      addIssue(id, name, dynasty, '等级标签', 'warning',
        `稀有度${summaryRarity.level}级应对应"${expectedLabel}"，实际为"${summary.rarity}"`);
    }
  }
}

// 主程序
for (let i = 0; i < DYNASTY_COUNT; i++) {
  const filePath = join(DATA_DIR, `${i}.json`);
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    stats.total += data.coins.length;

    for (const coin of data.coins) {
      checkCoin(coin, data.dynasty);
    }
  } catch (e) {
    console.error(`Error reading ${filePath}: ${e.message}`);
  }
}

// 输出报告
console.log('='.repeat(80));
console.log('跨字段逻辑一致性校验报告');
console.log('='.repeat(80));
console.log(`\n总钱币数：${stats.total}`);
console.log(`已校验数：${stats.checked}`);
console.log(`发现问题：${stats.issues}`);
console.log('\n问题分类统计：');
for (const [cat, count] of Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${cat}: ${count}`);
}

console.log('\n' + '='.repeat(80));
console.log('详细问题清单');
console.log('='.repeat(80));

// 按朝代分组
const byDynasty = {};
for (const issue of issues) {
  if (!byDynasty[issue.dynasty]) byDynasty[issue.dynasty] = [];
  byDynasty[issue.dynasty].push(issue);
}

for (const [dynasty, dynastyIssues] of Object.entries(byDynasty)) {
  console.log(`\n【${dynasty}】(${dynastyIssues.length}个问题)`);

  // 按钱币分组
  const byCoin = {};
  for (const issue of dynastyIssues) {
    const key = `${issue.coinId} ${issue.coinName}`;
    if (!byCoin[key]) byCoin[key] = [];
    byCoin[key].push(issue);
  }

  for (const [coinKey, coinIssues] of Object.entries(byCoin)) {
    console.log(`\n  ${coinKey}:`);
    for (const issue of coinIssues) {
      const severityTag = issue.severity === 'warning' ? '[⚠️]' : '[ℹ️]';
      console.log(`    ${severityTag} [${issue.category}] ${issue.message}`);
    }
  }
}
