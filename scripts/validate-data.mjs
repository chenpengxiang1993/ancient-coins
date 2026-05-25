import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── MD 哈希校验 ──────────────────────────────────────────────────────────────

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

function checkSourceHashes(data) {
  let hashErrors = 0;
  for (const dynasty of data) {
    if (!dynasty._source || !dynasty._sourceHash) continue;
    const mdPath = path.join(ROOT, dynasty._source);
    if (!fs.existsSync(mdPath)) {
      console.warn(`⚠️  源文件不存在: ${dynasty._source}`);
      continue;
    }
    const currentHash = sha256File(mdPath);
    if (currentHash !== dynasty._sourceHash) {
      console.error(
        `❌ 数据不同步：${dynasty._source} 已修改但未重新构建！\n` +
        `   期望 hash: ${dynasty._sourceHash.slice(0, 16)}…\n` +
        `   当前 hash: ${currentHash.slice(0, 16)}…\n` +
        `   → 请运行 pnpm run parse-data`
      );
      hashErrors++;
    }
  }
  return hashErrors;
}

const COIN_DETAIL_REQUIRED_KEYS = [
  'castingTime',
  'material',
  'dimensions',
  'obverseFeatures',
  'reverseFeatures',
  'castingCraft',
  'coreBackground',
  'variantsTable',
  'images',
];

const COIN_DETAIL_ALLOWED_KEYS = new Set([
  ...COIN_DETAIL_REQUIRED_KEYS,
]);

const VARIANT_TABLE_ROW_REQUIRED_KEYS = ['variant', 'description', 'grade', 'priceRange', 'notes'];
const VARIANT_TABLE_ROW_ALLOWED_KEYS = new Set(VARIANT_TABLE_ROW_REQUIRED_KEYS);

const COIN_IMAGES_REQUIRED_KEYS = ['main', 'variants'];
const COIN_IMAGES_ALLOWED_KEYS = new Set(COIN_IMAGES_REQUIRED_KEYS);

const COIN_IMAGE_REQUIRED_KEYS = ['src', 'alt'];
const COIN_IMAGE_ALLOWED_KEYS = new Set([...COIN_IMAGE_REQUIRED_KEYS, 'label']);

const SUMMARY_REQUIRED_KEYS = ['name', 'historicalPeriod', 'ruler', 'coreFeatures', 'estimatedValue', 'rarity', 'thumbnail'];
const SUMMARY_ALLOWED_KEYS = new Set(SUMMARY_REQUIRED_KEYS);

const COIN_REQUIRED_KEYS = ['id', 'name', 'dynasty', 'dynastyIndex', 'summary', 'detail'];
const COIN_ALLOWED_KEYS = new Set(COIN_REQUIRED_KEYS);

const DYNASTY_REQUIRED_KEYS = ['dynasty', 'dynastyIndex', 'coins'];
const DYNASTY_ALLOWED_KEYS = new Set([...DYNASTY_REQUIRED_KEYS, '_source', '_sourceHash', '_generatedAt']);

const SUMMARY_JSON_DYNASTY_KEYS = ['dynasty', 'dynastyIndex', 'coins'];
const SUMMARY_JSON_COIN_KEYS = ['id', 'name', 'dynasty', 'dynastyIndex', 'summary'];

let errors = 0;
let warnings = 0;

function checkKeys(obj, allowedKeys, requiredKeys, path) {
  if (!obj || typeof obj !== 'object') {
    console.error(`❌ ${path}: 值为空或非对象`);
    errors++;
    return;
  }
  const keys = Object.keys(obj);
  const missing = requiredKeys.filter(k => !(k in obj));
  const extra = keys.filter(k => !allowedKeys.has(k));
  for (const m of missing) {
    console.error(`❌ ${path}: 缺少字段 "${m}"`);
    errors++;
  }
  for (const e of extra) {
    console.warn(`⚠️  ${path}: 多余字段 "${e}"`);
    warnings++;
  }
}

function main() {
  console.log('=== 数据校验开始 ===\n');

  const coinsJsonPath = path.join(ROOT, 'data', 'coins.json');
  if (!fs.existsSync(coinsJsonPath)) {
    console.error('❌ coins.json 不存在');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(coinsJsonPath, 'utf-8'));

  if (!Array.isArray(data)) {
    console.error('❌ coins.json 顶层不是数组');
    process.exit(1);
  }

  console.log(`--- 校验 coins.json (${data.length} 个朝代) ---\n`);

  const hashErrors = checkSourceHashes(data);
  if (hashErrors > 0) {
    console.error(`\n❌ 发现 ${hashErrors} 个源文件哈希不匹配，请运行 npm run parse-data 重新构建\n`);
    errors += hashErrors;
  }

  for (const dynasty of data) {
    const dynastyPath = `dynasty[${dynasty.dynastyIndex}]`;
    checkKeys(dynasty, DYNASTY_ALLOWED_KEYS, DYNASTY_REQUIRED_KEYS, dynastyPath);

    if (!Array.isArray(dynasty.coins)) {
      console.error(`❌ ${dynastyPath}.coins 不是数组`);
      errors++;
      continue;
    }

    for (let i = 0; i < dynasty.coins.length; i++) {
      const coin = dynasty.coins[i];
      const coinPath = `${dynastyPath}.coins[${i}] (${coin.name || '?'})`;
      checkKeys(coin, COIN_ALLOWED_KEYS, COIN_REQUIRED_KEYS, coinPath);

      if (coin.summary) {
        checkKeys(coin.summary, SUMMARY_ALLOWED_KEYS, SUMMARY_REQUIRED_KEYS, `${coinPath}.summary`);
      }

      if (coin.detail) {
        const detailPath = `${coinPath}.detail`;
        checkKeys(coin.detail, COIN_DETAIL_ALLOWED_KEYS, COIN_DETAIL_REQUIRED_KEYS, detailPath);

        if (!Array.isArray(coin.detail.variantsTable)) {
          console.error(`❌ ${detailPath}.variantsTable 不是数组`);
          errors++;
        } else {
          for (let j = 0; j < coin.detail.variantsTable.length; j++) {
            const row = coin.detail.variantsTable[j];
            checkKeys(row, VARIANT_TABLE_ROW_ALLOWED_KEYS, VARIANT_TABLE_ROW_REQUIRED_KEYS, `${detailPath}.variantsTable[${j}]`);
          }
        }

        if (coin.detail.images) {
          checkKeys(coin.detail.images, COIN_IMAGES_ALLOWED_KEYS, COIN_IMAGES_REQUIRED_KEYS, `${detailPath}.images`);
          if (Array.isArray(coin.detail.images.variants)) {
            for (let k = 0; k < coin.detail.images.variants.length; k++) {
              checkKeys(coin.detail.images.variants[k], COIN_IMAGE_ALLOWED_KEYS, COIN_IMAGE_REQUIRED_KEYS, `${detailPath}.images.variants[${k}]`);
            }
          }
        }
      }
    }
  }

  console.log('\n--- 校验 coins-summary.json ---\n');
  const summaryPath = path.join(ROOT, 'public', 'data', 'coins-summary.json');
  if (fs.existsSync(summaryPath)) {
    const summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    for (const dynasty of summaryData) {
      const dp = `summary.dynasty[${dynasty.dynastyIndex}]`;
      const dynastyKeys = Object.keys(dynasty);
      for (const k of SUMMARY_JSON_DYNASTY_KEYS) {
        if (!dynastyKeys.includes(k)) {
          console.error(`❌ ${dp}: 缺少字段 "${k}"`);
          errors++;
        }
      }
      for (const coin of dynasty.coins || []) {
        const coinKeys = Object.keys(coin);
        for (const k of SUMMARY_JSON_COIN_KEYS) {
          if (!coinKeys.includes(k)) {
            console.error(`❌ ${dp}.coins[${coin.id}]: 缺少字段 "${k}"`);
            errors++;
          }
        }
        if (coin.summary) {
          checkKeys(coin.summary, SUMMARY_ALLOWED_KEYS, SUMMARY_REQUIRED_KEYS, `${dp}.coins[${coin.id}].summary`);
        }
      }
    }
  }

  console.log('\n--- 校验 detail JSON 文件 ---\n');
  const detailDir = path.join(ROOT, 'public', 'data', 'detail');
  if (fs.existsSync(detailDir)) {
    const files = fs.readdirSync(detailDir).filter(f => f.endsWith('.json')).sort((a, b) => {
      const na = parseInt(a), nb = parseInt(b);
      return na - nb;
    });
    for (const file of files) {
      const detailMap = JSON.parse(fs.readFileSync(path.join(detailDir, file), 'utf-8'));
      for (const [coinId, detail] of Object.entries(detailMap)) {
        checkKeys(detail, COIN_DETAIL_ALLOWED_KEYS, COIN_DETAIL_REQUIRED_KEYS, `detail/${file} [${coinId}]`);
        if (detail.variantsTable && Array.isArray(detail.variantsTable)) {
          for (let j = 0; j < detail.variantsTable.length; j++) {
            checkKeys(detail.variantsTable[j], VARIANT_TABLE_ROW_ALLOWED_KEYS, VARIANT_TABLE_ROW_REQUIRED_KEYS, `detail/${file} [${coinId}].variantsTable[${j}]`);
          }
        }
      }
    }
  }

  console.log('\n=== 校验结果 ===');
  console.log(`错误: ${errors}`);
  console.log(`警告: ${warnings}`);

  if (errors > 0) {
    console.log('\n❌ 校验失败！请修复上述错误后重新执行。');
    process.exit(1);
  } else {
    console.log('\n✅ 校验通过！所有字段完全匹配。');
  }
}

main();
