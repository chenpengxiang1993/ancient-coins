# 版别体系穷尽收录 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将全库 20 朝代 506 枚钱币的 `variantsTable` 穷尽收录权威文献记载版别，每条描述准确详尽、可辨识、便于学习。

**Architecture:** 清单驱动审计驱动数据完善。`scripts/audit-variant-completeness.mjs`（只读审计引擎）读取 `scripts/variant-standard.json`（权威版别清单数据）→ 输出每币缺失/待复核项 → 逐朝代逐枚 Edit 扩充 `variantsTable` 至审计归零。数据源 `data/dynasties/{0..19}.json` 是唯一可编辑数据源。

**Tech Stack:** Node.js（ESM .mjs）、JSON 数据文件、`pnpm run validate` 校验管线。

## Global Constraints

- **执行顺序**：朝代严格按 dynastyIndex 0→19；每朝代内按 coins 索引顺序逐枚处理（AGENTS.md §2）。
- **禁止脚本改数据**：禁用 sed/awk/jq/Node 批量改写，禁用 Edit `replace_all`；只能 Read + Edit 逐条目修改（AGENTS.md §4.2）。
- **每朝代验证**：完成后必须 `pnpm run validate`（schema+一致性）且 `node scripts/audit-variant-completeness.mjs` 归零。
- **权威来源**：《中国钱币大辞典》《中国古钱谱》《中国古钱目录》《历代古钱图说》。
- **禁止编造**：仅收录权威文献明确记载的版别；存世极罕币保留少量行，穷尽≠凑数；不确定或有争议的版别不加。
- **价格标注**：马定祥十级制品级 + 市场参考价区间，价格统一体现「仅供参考」。
- **描述学习导向**：每条 description 含①面文+书体+旋读/直读、②鉴别特征（与普通版对比）、③尺寸重量、④背景/存世。
- **不增删钱币**：本轮只改 `variantsTable` 内容，506 枚钱币数量不变。
- **commit 约定**：Conventional Commits + 朝代范围（如 `feat(唐): ...`、`docs: ...`）；每朝代独立 commit。
- **前端分组**：同名 `variant` 相邻行自动分组渲染（多品级用同名行，如「容弱版」美品/普品两行）。

---

## Task 1: P0 — 版别完整性审计引擎 + 唐朝清单种子

**Files:**
- Create: `scripts/audit-variant-completeness.mjs`
- Create: `scripts/variant-standard.json`

**Interfaces:**
- Produces: 只读审计引擎，读取 `variant-standard.json`（`{ "<dynastyIndex>": { "<coinName>": ["<keyword>", ...] } }`），输出每币缺失项 + 待复核项；退出码 0/1。
- 后续任务直接运行 `node scripts/audit-variant-completeness.mjs` 验证归零。

- [ ] **Step 1: 创建清单数据文件 `scripts/variant-standard.json`（唐朝种子）**

```json
{
  "8": {
    "开元通宝": ["早期版", "容弱", "尨字", "大字", "小字", "正样", "阔缘", "窄缘", "背上月", "背下月", "背左月", "背右月", "背斜月", "背星", "背月孕星", "合背", "鎏金", "背周"],
    "乾封泉宝": ["光背", "大字", "阔缘"],
    "乾元重宝": ["小平", "折十", "背上月", "背下月", "背左月", "背右月", "背星", "背云", "背瑞雀", "大字", "阔缘", "私铸减重"],
    "重轮乾元重宝": ["光背", "背上月", "背下月", "背星"],
    "大历元宝": ["大字", "小字"],
    "建中通宝": ["光背"],
    "会昌开元": ["昌", "京", "洛", "益", "蓝", "襄", "荆", "越", "宣", "洪", "潭", "兖", "润", "鄂", "平", "兴", "梁", "广", "梓", "福", "桂", "丹", "永", "并"],
    "咸通玄宝": ["光背"],
    "得壹元宝": ["光背", "背上月", "背下月"],
    "顺天元宝": ["光背", "背上月", "背下月"],
    "西域铸币": ["突骑施", "回鹘", "高昌"]
  }
}
```

- [ ] **Step 2: 创建审计引擎 `scripts/audit-variant-completeness.mjs`**

```js
#!/usr/bin/env node
/**
 * audit-variant-completeness.mjs
 * 只读审计：版别体系完整性检查（穷尽收录驱动）。
 * 读取 scripts/variant-standard.json（权威版别清单），对照每枚钱币 variantsTable：
 *   - 缺失：清单关键词未出现在任一版别名中（硬指标，须补齐）
 *   - 待复核：版别名匹配不到任何清单关键词（人工确认重复/冗余/清单遗漏）
 * 注意：本脚本只读，不修改任何数据文件。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DYNASTIES_DIR = path.join(ROOT, 'data', 'dynasties');
const STANDARD_PATH = path.join(__dirname, 'variant-standard.json');

const STANDARD = JSON.parse(fs.readFileSync(STANDARD_PATH, 'utf-8'));

// 归一化：去引号、去括号注、去 版/型/种 等后缀、去品相词
function normalize(name) {
  return (name || '')
    .replace(/[「」"'“”]/g, '')
    .replace(/[（(].*?[)）]/g, '')
    .replace(/(版|型|种|钱|币)$/g, '')
    .replace(/[（(]?(美品|普品|上佳|极美)[)）]?$/g, '')
    .trim();
}

// 双向子串匹配：清单关键词与版别名归一化后任一方向包含即算覆盖
function coveredBy(rowVariant, keyword) {
  const v = normalize(rowVariant);
  const k = normalize(keyword);
  if (!v || !k) return false;
  return v.includes(k) || k.includes(v);
}

function main() {
  console.log('=== 版别体系完整性审计（只读）===\n');
  let totalCoins = 0, totalMissing = 0, totalReview = 0;
  const files = fs
    .readdirSync(DYNASTIES_DIR)
    .filter((f) => /^\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));

  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(DYNASTIES_DIR, f), 'utf-8'));
    const idx = String(data.dynastyIndex);
    const std = STANDARD[idx] || {};
    const lines = [];
    let dynMissing = 0, dynReview = 0;

    for (const c of data.coins) {
      totalCoins++;
      const rows = c.detail?.variantsTable || [];
      const names = rows.map((r) => r.variant);
      const checklist = std[c.name];

      if (!checklist) {
        if (names.length > 0) {
          lines.push(`  ${c.id} ${c.name} | ⚠️ 清单未覆盖（${names.length}行版别，请在 variant-standard.json 登记）`);
        }
        continue;
      }
      for (const k of checklist) {
        if (!names.some((n) => coveredBy(n, k))) {
          dynMissing++;
          if (lines.length < 12) lines.push(`  ${c.id} ${c.name} | ❌ 缺失 [${k}]`);
        }
      }
      for (const n of names) {
        if (!checklist.some((k) => coveredBy(n, k))) {
          dynReview++;
          if (lines.length < 12) lines.push(`  ${c.id} ${c.name} | 👁 待复核 [${n}]`);
        }
      }
    }

    totalMissing += dynMissing;
    totalReview += dynReview;
    console.log(`【${data.dynasty}】${data.coins.length}枚`);
    if (dynMissing || dynReview) {
      lines.forEach((l) => console.log(l));
      if (lines.length >= 12) console.log(`  ... 共 ${dynMissing} 缺失 / ${dynReview} 待复核`);
    } else {
      console.log(`  ✅ 版别清单覆盖完整`);
    }
    console.log('');
  }

  console.log('=== 汇总 ===');
  console.log(`钱币总数：${totalCoins}`);
  console.log(`缺失版别：${totalMissing}`);
  console.log(`待复核项：${totalReview}`);
  if (totalMissing > 0) process.exit(1);
}

main();
```

- [ ] **Step 3: 运行审计，确认对唐朝数据输出预期缺口**

Run: `node scripts/audit-variant-completeness.mjs`
Expected: 唐朝 section 报出缺口（如 会昌开元 缺失 蓝/襄/荆/潭/兖/鄂/平/兴/梁/广/梓/福/桂/丹/永/并，开元通宝 缺失 容弱/尨字/背周/背上月/背下月 等），退出码 1；其他朝代显示「清单未覆盖」提示。

- [ ] **Step 4: 验证脚本不影响既有审计**

Run: `node scripts/audit-variant-quality.mjs 2>&1 | tail -3 && node scripts/audit-features.mjs 2>&1 | tail -4`
Expected: 弱描述 0；缺旋读/直读 0。

- [ ] **Step 5: 提交**

```bash
git add scripts/audit-variant-completeness.mjs scripts/variant-standard.json
git commit -m "feat: 新增版别完整性审计引擎（清单驱动）+ 唐朝版别清单种子"
```

---

## 标准朝代任务协议（Task 2–21 共用）

每个朝代是一个任务，内部按以下协议执行。**协议步骤**：

- [ ] **A. 梳理该朝代权威版别清单**：为该朝代每枚钱币在 `scripts/variant-standard.json` 登记期望版别关键词（依据权威来源）。高版别币（如 8 唐开元/会昌、16 明洪武/崇祯、17 清顺治/康熙/乾隆/咸丰）按「形制→书体→背文→特殊品」穷尽登记。
- [ ] **B. 逐枚 Read + Edit 扩充 `variantsTable`**（该朝代 JSON 文件）：
  - 版别行顺序：形制 → 书体 → 背文（含纪局/纪值/纪地）→ 特殊品（鎏金/合背/铁钱/机制等）。
  - 每行 `{variant, description, grade, priceRange, notes}` 齐全；同名版别多品级用相邻同名行（前端分组）。
  - description 四要素：①面文+书体+旋读/直读、②鉴别特征（含与普通版对比）、③尺寸重量、④背景/存世。
  - grade 用马定祥十级制（如「七级（甚少）」）；priceRange 市场参考价区间（如「50—300元」）；notes 简短补注。
  - 用审计「待复核」项排查既有重复/冗余行，人工确认后合并或删除。
- [ ] **C. 验证**：`pnpm run validate` 通过 + `node scripts/audit-variant-completeness.mjs` 该朝代归零（无缺失项）。
- [ ] **D. 提交**：`git commit -m "feat(朝代): 版别体系穷尽收录（N枚，补X版别）"`。

> 唐代（Task 9）为首个重点朝代，必须同时完成协议 A–D 且优先级硬币（开元通宝/会昌开元/乾元重宝/得壹元宝/顺天元宝）须达到 Task 1 清单的穷尽覆盖。

---

## Task 2: 朝代 0 先秦钱币

**Files:** Modify `data/dynasties/0.json`（29 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。先秦布刀圜贝（无文铜贝/布币/刀币/圜钱/蚁鼻钱/郢爰金版等）用形制读法描述（布币自上而下直读、刀币自柄向首横读），版别按字体/背文/足型细分。

## Task 3: 朝代 1 秦钱币

**Files:** Modify `data/dynasties/1.json`（4 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。秦半两按大小/字形细分（大字/小字/传形等），两甾/文信/长安按形制。

## Task 4: 朝代 2 汉代钱币

**Files:** Modify `data/dynasties/2.json`（40 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。五铢体系按时期/特征细分（郡国/上林三官/剪边/綖环等已分立条目内按字型背纹扩），新莽布刀按形制/背文。重点：大泉五十、五铢。

## Task 5: 朝代 3 三国钱币

**Files:** Modify `data/dynasties/3.json`（12 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。直百五铢/太平百钱/大泉当千等按背文（背为/背百/背星月）与面文细分。

## Task 6: 朝代 4 两晋十六国钱币

**Files:** Modify `data/dynasties/4.json`（5 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。汉兴钱按直读/横读细分，丰货钱按字型。

## Task 7: 朝代 5 南朝钱币

**Files:** Modify `data/dynasties/5.json`（17 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。太货六铢/四铢系列按书体（玉箸篆/隶）与形制细分。

## Task 8: 朝代 6 北朝钱币

**Files:** Modify `data/dynasties/6.json`（9 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。永安五铢/布泉/五行大布/永通万国按大字/小字/阔缘/背纹细分。

## Task 9: 朝代 7 隋朝钱币

**Files:** Modify `data/dynasties/7.json`（2 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。隋五铢按直笔/曲笔「五」字细分。

## Task 10: 朝代 8 唐朝钱币【重点】

**Files:** Modify `data/dynasties/8.json`（11 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D，**且**：
- 开元通宝：补容弱/尨字/大字/小字/正样/阔缘/窄缘/背月各位置（上/下/左/右/斜）/背星/背月孕星/合背/鎏金/背周，每行描述含鉴别特征。
- 会昌开元：从 8 种背字补全 23 背字（蓝/襄/荆/潭/兖/鄂/平/兴/梁/广/梓/福/桂/丹/永/并）+ 既有 8 种（昌/京/洛/益/越/宣/洪/润），每行标注铸局。
- 乾元重宝：补背云/背瑞雀/大字/阔缘/私铸减重/折十等。
- 得壹元宝/顺天元宝：补背月位置细分。
- 验证 `node scripts/audit-variant-completeness.mjs` 唐朝归零（Task 1 种子清单全部覆盖）。

## Task 11: 朝代 9 五代十国钱币

**Files:** Modify `data/dynasties/9.json`（29 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。周元通宝背星月细分、天策府宝/乾封泉宝按大字/背纹、南唐钱币（唐国通宝等）按书体细分。

## Task 12: 朝代 10 北宋钱币

**Files:** Modify `data/dynasties/10.json`（54 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。重点：崇宁通宝（瘦金体大字/御书/背星月）、大观通宝（瘦金体大字）、政和/宣和通宝（对钱/篆隶书体）、元丰/熙宁（对钱、背月、铁钱）。

## Task 13: 朝代 11 南宋钱币

**Files:** Modify `data/dynasties/11.json`（61 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。重点：淳熙/绍熙/嘉泰等背纪年细分（背七/背十四等）、嘉定系列多元宝号、铁钱（背记监记值）。

## Task 14: 朝代 12 辽朝钱币

**Files:** Modify `data/dynasties/12.json`（28 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。辽钱按大字/小字/背星月细分（大安元宝短安/长安、咸雍通宝等）。

## Task 15: 朝代 13 金朝钱币

**Files:** Modify `data/dynasties/13.json`（15 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。大定通宝（背酉/申/大字）、正隆元宝（大字/五笔正隆）、泰和重宝（玉箸篆大字）。

## Task 16: 朝代 14 西夏钱币

**Files:** Modify `data/dynasties/14.json`（14 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。西夏文/汉文钱按书体与大字细分。

## Task 17: 朝代 15 元朝钱币

**Files:** Modify `data/dynasties/15.json`（33 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。至正通宝背纪年/背字（蒙汉文）、大元通宝八思巴文、至大通宝等按背纹/书体细分。

## Task 18: 朝代 16 明朝钱币【重点】

**Files:** Modify `data/dynasties/16.json`（21 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D，**且**：
- 崇祯通宝：补京版大样、户五/工五等纪值、背贵/云/江/临等纪地、背星月细分；合并既有「跑马版/奔马版」重复行。
- 洪武通宝：背纪值/纪局（一/二/三/五/十钱、浙/豫/北平/京等）穷尽。
- 天启/隆武/永历等：背局/背字穷尽。

## Task 19: 朝代 17 清朝钱币【重点】

**Files:** Modify `data/dynasties/17.json`（44 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D，**且**：
- 顺治通宝五式、康熙通宝二十局背满汉文、乾隆通宝各局背文、咸丰各局宝文/机制币细分。
- 太平天国/晚清起义钱按面背文/材质细分。

## Task 20: 朝代 18 花钱_压胜钱

**Files:** Modify `data/dynasties/18.json`（11 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。花钱按题材（吉语/生肖/八卦/镂空）与图案细分。

## Task 21: 朝代 19 外国钱币

**Files:** Modify `data/dynasties/19.json`（67 枚），Modify `scripts/variant-standard.json`
按标准协议 A–D。安南/日本/朝鲜/琉球子分组内按背文/书体/形制细分（宽永通宝各背字与版式、天保通宝当百、朝鲜常平通宝背局等）。

---

## Task 22: P2 — 全量回归验证

**Files:** 无修改（只读验证）

- [ ] **Step 1: 数据校验**

Run: `pnpm run validate`
Expected: 0 错误 0 警告，已校验 506 枚。

- [ ] **Step 2: 全部审计归零**

Run: `node scripts/audit-completeness.mjs 2>&1 | tail -3 && node scripts/audit-features.mjs 2>&1 | tail -4 && node scripts/audit-variant-quality.mjs 2>&1 | tail -3 && node scripts/audit-variant-completeness.mjs 2>&1 | tail -3`
Expected: 缺失 0；缺旋读/直读 0；弱描述 0；版别缺失 0（退出码 0）。

- [ ] **Step 3: 构建**

Run: `pnpm run build`
Expected: `✓ built`，无错误。

- [ ] **Step 4: 提交（若审计/脚本有改动）**

```bash
git add -A
git commit -m "chore: 版别体系穷尽收录全量回归验证通过"
```

---

## 执行说明

- **顺序**：严格按 Task 1 → 2 → … → 22 执行；每朝代完成后汇报该朝代缺失项归零、validate 通过，再进入下一朝代。
- **中断恢复**：每个 Task 独立 commit；中断后从最近未完成 Task 续做。
- **纪律**：全程 Read + Edit 逐条修改，禁止批量脚本；描述准确性优先，存疑版别不收录。
