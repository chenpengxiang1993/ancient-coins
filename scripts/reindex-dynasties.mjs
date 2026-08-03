/**
 * reindex-dynasties.mjs  （一次性迁移脚本，已获用户授权执行）
 * 将 26 个朝代文件重排为 20 个文件：
 *   - 重编号 coin.id（{新dynastyIndex}-{文件内位置}）与 dynastyIndex
 *   - 合并：汉=汉代+新莽；明=明朝+明末农民起义+南明；清=清朝+三藩+太平天国+晚清起义
 *   - 合并文件内币种保留原 dynasty 名称（供前端子分组展示）
 *   - 生成 old→new id 映射表（供 rarity.ts 五十大珍 id 更新）
 *
 * 迁移前自动备份到 data/backups/migration-20260803/。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');
const BACKUP_DIR = path.join(ROOT, 'data', 'backups', 'migration-20260803');

// 新文件索引 → 来源文件索引（保持顺序）
const MAPPING = [
  [0],          // 0 先秦钱币
  [1],          // 1 秦钱币
  [2, 3],       // 2 汉代钱币 = 汉代 + 新莽
  [4],          // 3 三国钱币
  [5],          // 4 两晋十六国钱币
  [6],          // 5 南朝钱币
  [7],          // 6 北朝钱币
  [8],          // 7 隋朝钱币
  [9],          // 8 唐朝钱币
  [10],         // 9 五代十国钱币
  [12],         // 10 北宋钱币
  [15],         // 11 南宋钱币
  [11],         // 12 辽朝钱币
  [14],         // 13 金朝钱币
  [13],         // 14 西夏钱币
  [16],         // 15 元朝钱币
  [17, 18, 19], // 16 明朝钱币 = 明朝 + 明末农民起义 + 南明
  [20, 21, 22, 23], // 17 清朝钱币 = 清朝 + 三藩 + 太平天国 + 晚清起义
  [24],         // 18 花钱_压胜钱
  [25],         // 19 外国钱币
];

function loadDynasty(idx) {
  const p = path.join(DYNASTIES_DIR, `${idx}.json`);
  if (!fs.existsSync(p)) {
    throw new Error(`缺少源文件: ${idx}.json`);
  }
  return JSON.parse(fs.readFileSync(p, 'utf-8'));
}

function atomicWriteJSON(filePath, data) {
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, filePath);
}

// 1. 备份
fs.mkdirSync(BACKUP_DIR, { recursive: true });
for (const idx of MAPPING.flat()) {
  fs.copyFileSync(
    path.join(DYNASTIES_DIR, `${idx}.json`),
    path.join(BACKUP_DIR, `${idx}.json`)
  );
}
console.log(`✓ 已备份 26 个源文件 → ${path.relative(ROOT, BACKUP_DIR)}/`);

// 2. 迁移（先把所有源文件读入内存，再统一写盘，避免写文件覆盖尚未读取的源）
const idMap = {}; // oldId → newId
const stats = [];

// 2a. 预加载全部源文件
const allSources = {};
for (const idx of MAPPING.flat()) {
  allSources[idx] = loadDynasty(idx);
}

// 2b. 在内存中构建全部输出
const outputs = [];
for (let targetIdx = 0; targetIdx < MAPPING.length; targetIdx++) {
  const sourceIndexes = MAPPING[targetIdx];
  const sources = sourceIndexes.map((idx) => allSources[idx]);
  const targetDynastyName = sources[0].dynasty;

  const coins = [];
  for (const src of sources) {
    for (const coin of src.coins) {
      const newId = `${targetIdx}-${coins.length}`;
      idMap[coin.id] = newId;
      coins.push({
        ...coin,
        id: newId,
        dynastyIndex: targetIdx,
        // dynasty 字段保留原子朝代名称（如「新莽钱币」）
      });
    }
  }

  outputs[targetIdx] = {
    dynasty: targetDynastyName,
    dynastyIndex: targetIdx,
    coins,
  };
  stats.push(`${targetIdx} ${targetDynastyName} ← [${sourceIndexes.join(',')}] 共 ${coins.length} 枚`);
}

// 2c. 统一写盘
for (let targetIdx = 0; targetIdx < outputs.length; targetIdx++) {
  atomicWriteJSON(path.join(DYNASTIES_DIR, `${targetIdx}.json`), outputs[targetIdx]);
}

// 3. 清理：删除不在新 0..19 范围内的残留文件（旧 20..25 中被合并的 20/21/22/23 等）
for (const f of fs.readdirSync(DYNASTIES_DIR)) {
  if (!/^\d+\.json$/.test(f)) continue;
  const idx = parseInt(f, 10);
  if (idx >= MAPPING.length) {
    const p = path.join(DYNASTIES_DIR, f);
    fs.rmSync(p);
    console.log(`  - 删除被合并的空余文件 ${f}`);
  }
}

// 4. 输出映射表
const mapOut = path.join(BACKUP_DIR, 'id-map.json');
atomicWriteJSON(mapOut, idMap);

console.log('\n=== 迁移结果 ===');
for (const s of stats) console.log(`  ${s}`);
const total = stats.reduce((sum, s) => sum + parseInt(s.match(/共 (\d+) 枚/)[1], 10), 0);
console.log(`  总计 ${total} 枚`);
console.log(`\n✓ 迁移完成：${MAPPING.length} 个文件；old→new id 映射 → ${path.relative(ROOT, mapOut)}`);
