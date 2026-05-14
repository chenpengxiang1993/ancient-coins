import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const TARGET_DIR = path.join(ROOT, 'docs', 'target');
const OUTPUT_DIR = path.join(ROOT, 'data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'coins.json');

const DYNASTY_FILES = [
  { file: 'a-先秦钱币.md', dynasty: '先秦钱币', dynastyIndex: 0 },
  { file: 'b-秦钱币.md', dynasty: '秦钱币', dynastyIndex: 1 },
  { file: 'c-汉代钱币.md', dynasty: '汉代钱币', dynastyIndex: 2 },
  { file: 'd-新莽钱币.md', dynasty: '新莽钱币', dynastyIndex: 3 },
  { file: 'e-三国钱币.md', dynasty: '三国钱币', dynastyIndex: 4 },
  { file: 'f-两晋十六国钱币.md', dynasty: '两晋十六国钱币', dynastyIndex: 5 },
  { file: 'g-南朝钱币.md', dynasty: '南朝钱币', dynastyIndex: 6 },
  { file: 'h-北朝钱币.md', dynasty: '北朝钱币', dynastyIndex: 7 },
  { file: 'i-隋朝钱币.md', dynasty: '隋朝钱币', dynastyIndex: 8 },
  { file: 'j-唐朝钱币.md', dynasty: '唐朝钱币', dynastyIndex: 9 },
  { file: 'k-五代十国钱币.md', dynasty: '五代十国钱币', dynastyIndex: 10 },
  { file: 'l-北宋钱币.md', dynasty: '北宋钱币', dynastyIndex: 11 },
  { file: 'm-南宋钱币.md', dynasty: '南宋钱币', dynastyIndex: 12 },
  { file: 'n-辽朝钱币.md', dynasty: '辽朝钱币', dynastyIndex: 13 },
  { file: 'o-金朝钱币.md', dynasty: '金朝钱币', dynastyIndex: 14 },
  { file: 'p-西夏钱币.md', dynasty: '西夏钱币', dynastyIndex: 15 },
  { file: 'q-元朝钱币.md', dynasty: '元朝钱币', dynastyIndex: 16 },
  { file: 'r-明朝钱币.md', dynasty: '明朝钱币', dynastyIndex: 17 },
  { file: 's-南明钱币.md', dynasty: '南明钱币', dynastyIndex: 18 },
  { file: 't-明末农民起义钱币.md', dynasty: '明末农民起义钱币', dynastyIndex: 19 },
  { file: 'u-清朝钱币.md', dynasty: '清朝钱币', dynastyIndex: 20 },
  { file: 'v-三藩钱币.md', dynasty: '三藩钱币', dynastyIndex: 21 },
  { file: 'w-太平天国钱币.md', dynasty: '太平天国钱币', dynastyIndex: 22 },
  { file: 'x-晚清起义钱币.md', dynasty: '晚清起义钱币', dynastyIndex: 23 },
  { file: 'y-花钱_压胜钱.md', dynasty: '花钱_压胜钱', dynastyIndex: 24 },
  { file: 'z-外国钱币.md', dynasty: '外国钱币', dynastyIndex: 25 },
];

const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'coins');

function sanitizeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '');
}

function getCoinImageBasePath(dynasty, coinName) {
  return `/images/coins/${sanitizeFileName(dynasty)}/${sanitizeFileName(coinName)}`;
}

function extractVariantNames(variantsText) {
  if (!variantsText) return [];
  const names = [];
  const regex = /\*\*(.+?)\*\*/g;
  let match;
  while ((match = regex.exec(variantsText)) !== null) {
    const name = match[1].trim();
    if (!names.includes(name)) {
      names.push(name);
    }
  }
  return names;
}

function buildCoinImages(dynasty, coinName, variantsText) {
  const basePath = getCoinImageBasePath(dynasty, coinName);
  const coinDir = path.join(IMAGES_DIR, sanitizeFileName(dynasty), sanitizeFileName(coinName));

  const mainExists = fs.existsSync(path.join(coinDir, 'main.jpg'));
  const main = mainExists ? `${basePath}/main.jpg` : '';

  const variants = [];

  if (fs.existsSync(coinDir)) {
    const files = fs.readdirSync(coinDir).sort();
    for (const file of files) {
      if (file.startsWith('variant_') && file.endsWith('.jpg')) {
        const match = file.match(/^variant_(\d+)\.jpg$/);
        if (match) {
          const idx = parseInt(match[1], 10);
          variants.push({
            src: `${basePath}/${file}`,
            alt: `${coinName} - 版别${idx}`,
            label: `版别${idx}`,
          });
        }
      }
    }
  }

  return { main, variants };
}

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

        if (trimmed === '' && currentField && currentValue.length > 0) {
          continue;
        }
      }

      if (currentField && currentValue.length > 0) {
        detail[currentField] = currentValue.join('\n').trim();
      }

      details.push({ name: coinName, detail });
    }
  }

  return details;
}

function parseFile(filePath, dynasty, dynastyIndex) {
  const content = fs.readFileSync(filePath, 'utf-8');

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
    const detail = detailMap.get(summary.name) || null;
    const images = buildCoinImages(dynasty, summary.name, detail?.variants || '');
    if (detail) {
      detail.images = images;
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

  return { dynasty, dynastyIndex, coins };
}

function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const allData = [];
  let totalCoins = 0;

  for (const { file, dynasty, dynastyIndex } of DYNASTY_FILES) {
    const filePath = path.join(TARGET_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`文件不存在: ${file}`);
      continue;
    }
    const data = parseFile(filePath, dynasty, dynastyIndex);
    allData.push(data);
    totalCoins += data.coins.length;
    console.log(`✓ ${dynasty}: ${data.coins.length} 枚`);
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allData, null, 2), 'utf-8');
  console.log(`\n总计: ${allData.length} 个朝代, ${totalCoins} 枚钱币`);
  console.log(`输出: ${OUTPUT_FILE}`);

  let totalImageDirs = 0;
  for (const dynastyData of allData) {
    for (const coin of dynastyData.coins) {
      const coinDir = path.join(IMAGES_DIR, sanitizeFileName(dynastyData.dynasty), sanitizeFileName(coin.name));
      fs.mkdirSync(coinDir, { recursive: true });
      totalImageDirs++;
    }
  }
  console.log(`✓ 图片目录已生成: ${IMAGES_DIR} (${totalImageDirs} 个钱币目录)`);
}

main();
