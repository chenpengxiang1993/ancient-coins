/**
 * generate-public-data.mjs
 * 从 data/dynasties/*.json 读取，生成前端消费的：
 *   - public/data/coins-summary.json（首屏摘要）
 *   - public/data/detail/{dynastyIndex}.json（按朝代拆分详情）
 * 同时供 CLI（pnpm run parse-data）与 Vite 插件（vite.config.ts）调用。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pinyin } from 'pinyin-pro';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');
const SUMMARY_OUT = path.join(ROOT, 'public', 'data');
const DETAIL_OUT = path.join(ROOT, 'public', 'data', 'detail');

function atomicWriteJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);
}

/**
 * 汉字文本 → 全拼 + 首字母缩写（无声调，忽略非汉字字符），
 * 构建期写入 coins-summary.json 供拼音搜索，前端零运行时依赖。
 */
function buildPinyin(text) {
  const syllables = pinyin(text, { toneType: 'none', type: 'array', nonZh: 'removed' });
  return {
    full: syllables.join(''),
    abbr: syllables.map((s) => s[0]).join(''),
  };
}

export function generatePublicData() {
  if (!fs.existsSync(DYNASTIES_DIR)) {
    throw new Error(`数据源不存在: ${DYNASTIES_DIR}`);
  }

  const files = fs
    .readdirSync(DYNASTIES_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));

  const data = files.map((f) =>
    JSON.parse(fs.readFileSync(path.join(DYNASTIES_DIR, f), 'utf-8'))
  );

  fs.mkdirSync(SUMMARY_OUT, { recursive: true });
  fs.mkdirSync(DETAIL_OUT, { recursive: true });

  const summaryList = data.map((dynasty) => ({
    dynasty: dynasty.dynasty,
    dynastyIndex: dynasty.dynastyIndex,
    coins: dynasty.coins.map((coin) => {
      const namePinyin = buildPinyin(coin.name);
      const rulerPinyin = buildPinyin(coin.summary.ruler);
      return {
        id: coin.id,
        name: coin.name,
        dynasty: coin.dynasty,
        dynastyIndex: coin.dynastyIndex,
        summary: coin.summary,
        pinyin: {
          name: namePinyin.full,
          nameAbbr: namePinyin.abbr,
          ruler: rulerPinyin.full,
          rulerAbbr: rulerPinyin.abbr,
        },
      };
    }),
  }));

  atomicWriteJSON(path.join(SUMMARY_OUT, 'coins-summary.json'), summaryList);

  let detailSize = 0;
  for (const dynasty of data) {
    const detailMap = {};
    for (const coin of dynasty.coins) {
      if (coin.detail) detailMap[coin.id] = coin.detail;
    }
    const filePath = path.join(DETAIL_OUT, `${dynasty.dynastyIndex}.json`);
    atomicWriteJSON(filePath, detailMap);
    detailSize += fs.statSync(filePath).size;
  }

  const summarySize = fs.statSync(path.join(SUMMARY_OUT, 'coins-summary.json')).size;
  console.log(
    `✓ 生成 public/data/（summary ${(summarySize / 1024).toFixed(1)} KB + detail ${data.length} 个文件, 共 ${(detailSize / 1024).toFixed(1)} KB）`
  );
  return {
    dynastyCount: data.length,
    summarySizeKB: summarySize / 1024,
    detailSizeKB: detailSize / 1024,
  };
}

// CLI 直跑（供 pnpm run parse-data）
if (import.meta.url === `file://${process.argv[1]}`) {
  generatePublicData();
}
