/**
 * validate-data.mjs
 * JSON-first 架构下的数据校验：
 *   1. 校验 data/dynasties/*.json 结构（必需字段 / 多余字段 / 类型）
 *   2. 校验 public/data/coins-summary.json 与 public/data/detail/*.json 结构
 *      （public/data/ 由 data/dynasties/ 构建时生成，缺失时仅提示）
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');

const COIN_DETAIL_REQUIRED_KEYS = [
  'castingTime', 'material', 'dimensions', 'featuresGroup',
  'castingCraft', 'coreBackground', 'variantsTable', 'images',
];
const COIN_DETAIL_ALLOWED_KEYS = new Set(COIN_DETAIL_REQUIRED_KEYS);

const FEATURES_GROUP_REQUIRED_KEYS = ['common', 'obverse', 'reverse'];
const FEATURES_GROUP_ALLOWED_KEYS = new Set(FEATURES_GROUP_REQUIRED_KEYS);

const VARIANT_TABLE_ROW_REQUIRED_KEYS = ['variant', 'description', 'grade', 'priceRange', 'notes'];
const VARIANT_TABLE_ROW_ALLOWED_KEYS = new Set(VARIANT_TABLE_ROW_REQUIRED_KEYS);

const COIN_IMAGES_REQUIRED_KEYS = ['main', 'variants'];
const COIN_IMAGES_ALLOWED_KEYS = new Set(COIN_IMAGES_REQUIRED_KEYS);

const COIN_IMAGE_REQUIRED_KEYS = ['src', 'alt'];
const COIN_IMAGE_ALLOWED_KEYS = new Set([...COIN_IMAGE_REQUIRED_KEYS, 'label']);

const SUMMARY_REQUIRED_KEYS = [
  'name', 'historicalPeriod', 'ruler', 'coreFeatures', 'estimatedValue', 'rarity', 'thumbnail',
];
const SUMMARY_ALLOWED_KEYS = new Set(SUMMARY_REQUIRED_KEYS);

const COIN_REQUIRED_KEYS = ['id', 'name', 'dynasty', 'dynastyIndex', 'summary', 'detail'];
const COIN_ALLOWED_KEYS = new Set(COIN_REQUIRED_KEYS);

const DYNASTY_REQUIRED_KEYS = ['dynasty', 'dynastyIndex', 'coins'];
const DYNASTY_ALLOWED_KEYS = new Set(DYNASTY_REQUIRED_KEYS);

let errors = 0;
let warnings = 0;

function checkKeys(obj, allowedKeys, requiredKeys, p) {
  if (!obj || typeof obj !== 'object') {
    console.error(`❌ ${p}: 值为空或非对象`);
    errors++;
    return;
  }
  const keys = Object.keys(obj);
  for (const m of requiredKeys.filter((k) => !(k in obj))) {
    console.error(`❌ ${p}: 缺少字段 "${m}"`);
    errors++;
  }
  for (const e of keys.filter((k) => !allowedKeys.has(k))) {
    console.warn(`⚠️  ${p}: 多余字段 "${e}"`);
    warnings++;
  }
}

function validateDynastyJSON(data, label) {
  checkKeys(data, DYNASTY_ALLOWED_KEYS, DYNASTY_REQUIRED_KEYS, label);
  if (!Array.isArray(data.coins)) {
    console.error(`❌ ${label}.coins 不是数组`);
    errors++;
    return;
  }
  for (let i = 0; i < data.coins.length; i++) {
    const coin = data.coins[i];
    const coinPath = `${label}.coins[${i}] (${coin.name || '?'})`;
    checkKeys(coin, COIN_ALLOWED_KEYS, COIN_REQUIRED_KEYS, coinPath);

    const expectedId = `${data.dynastyIndex}-${i}`;
    if (coin.id !== expectedId) {
      console.error(`❌ ${coinPath}.id 应为 "${expectedId}"，实际 "${coin.id}"`);
      errors++;
    }
    if (coin.dynastyIndex !== data.dynastyIndex) {
      console.error(`❌ ${coinPath}.dynastyIndex 与所在朝代不一致`);
      errors++;
    }

    if (coin.summary) {
      checkKeys(coin.summary, SUMMARY_ALLOWED_KEYS, SUMMARY_REQUIRED_KEYS, `${coinPath}.summary`);
    }

    if (coin.detail) {
      const dp = `${coinPath}.detail`;
      checkKeys(coin.detail, COIN_DETAIL_ALLOWED_KEYS, COIN_DETAIL_REQUIRED_KEYS, dp);

      if (coin.detail.featuresGroup) {
        checkKeys(
          coin.detail.featuresGroup,
          FEATURES_GROUP_ALLOWED_KEYS,
          FEATURES_GROUP_REQUIRED_KEYS,
          `${dp}.featuresGroup`
        );
      }

      if (!Array.isArray(coin.detail.variantsTable)) {
        console.error(`❌ ${dp}.variantsTable 不是数组`);
        errors++;
      } else {
        for (let j = 0; j < coin.detail.variantsTable.length; j++) {
          checkKeys(
            coin.detail.variantsTable[j],
            VARIANT_TABLE_ROW_ALLOWED_KEYS,
            VARIANT_TABLE_ROW_REQUIRED_KEYS,
            `${dp}.variantsTable[${j}]`
          );
        }
      }

      if (coin.detail.images) {
        checkKeys(
          coin.detail.images,
          COIN_IMAGES_ALLOWED_KEYS,
          COIN_IMAGES_REQUIRED_KEYS,
          `${dp}.images`
        );
        if (Array.isArray(coin.detail.images.variants)) {
          for (let k = 0; k < coin.detail.images.variants.length; k++) {
            checkKeys(
              coin.detail.images.variants[k],
              COIN_IMAGE_ALLOWED_KEYS,
              COIN_IMAGE_REQUIRED_KEYS,
              `${dp}.images.variants[${k}]`
            );
          }
        }
      }
    }
  }
}

function main() {
  console.log('=== 数据校验开始（JSON-first）===\n');

  if (!fs.existsSync(DYNASTIES_DIR)) {
    console.error('❌ data/dynasties/ 不存在');
    process.exit(1);
  }

  const files = fs
    .readdirSync(DYNASTIES_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));

  console.log(`--- 校验 data/dynasties/*.json (${files.length} 个文件) ---\n`);
  for (const f of files) {
    const jsonPath = path.join(DYNASTIES_DIR, f);
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    validateDynastyJSON(data, `dynasties/${f}`);
  }

  console.log('\n--- 校验 public/data/coins-summary.json ---\n');
  const summaryPath = path.join(ROOT, 'public', 'data', 'coins-summary.json');
  if (fs.existsSync(summaryPath)) {
    const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    for (const dynasty of summaryData) {
      const dp = `summary.dynasty[${dynasty.dynastyIndex}]`;
      for (const k of ['dynasty', 'dynastyIndex', 'coins']) {
        if (!(k in dynasty)) {
          console.error(`❌ ${dp}: 缺少字段 "${k}"`);
          errors++;
        }
      }
      for (const coin of dynasty.coins || []) {
        for (const k of ['id', 'name', 'dynasty', 'dynastyIndex', 'summary']) {
          if (!(k in coin)) {
            console.error(`❌ ${dp}.coins[${coin.id}]: 缺少字段 "${k}"`);
            errors++;
          }
        }
        if (coin.summary) {
          checkKeys(
            coin.summary,
            SUMMARY_ALLOWED_KEYS,
            SUMMARY_REQUIRED_KEYS,
            `${dp}.coins[${coin.id}].summary`
          );
        }
      }
    }
  } else {
    console.warn('⚠️  public/data/coins-summary.json 未生成（运行 pnpm run parse-data 或 pnpm dev 后自动生成）');
  }

  console.log('\n--- 校验 public/data/detail/*.json ---\n');
  const detailDir = path.join(ROOT, 'public', 'data', 'detail');
  if (fs.existsSync(detailDir)) {
    const dfiles = fs
      .readdirSync(detailDir)
      .filter((f) => f.endsWith('.json'))
      .sort((a, b) => parseInt(a) - parseInt(b));
    for (const file of dfiles) {
      const detailMap = JSON.parse(fs.readFileSync(path.join(detailDir, file), 'utf-8'));
      for (const [coinId, detail] of Object.entries(detailMap)) {
        checkKeys(
          detail,
          COIN_DETAIL_ALLOWED_KEYS,
          COIN_DETAIL_REQUIRED_KEYS,
          `detail/${file} [${coinId}]`
        );
        if (detail.featuresGroup) {
          checkKeys(
            detail.featuresGroup,
            FEATURES_GROUP_ALLOWED_KEYS,
            FEATURES_GROUP_REQUIRED_KEYS,
            `detail/${file} [${coinId}].featuresGroup`
          );
        }
        if (Array.isArray(detail.variantsTable)) {
          for (let j = 0; j < detail.variantsTable.length; j++) {
            checkKeys(
              detail.variantsTable[j],
              VARIANT_TABLE_ROW_ALLOWED_KEYS,
              VARIANT_TABLE_ROW_REQUIRED_KEYS,
              `detail/${file} [${coinId}].variantsTable[${j}]`
            );
          }
        }
      }
    }
  } else {
    console.warn('⚠️  public/data/detail/ 未生成（运行 pnpm run parse-data 或 pnpm dev 后自动生成）');
  }

  console.log('\n=== 校验结果 ===');
  console.log(`错误: ${errors}`);
  console.log(`警告: ${warnings}`);

  if (errors > 0) {
    console.log('\n❌ 校验失败！请修复上述错误后重新执行。');
    process.exit(1);
  } else {
    console.log('\n✅ 校验通过！');
  }
}

main();
