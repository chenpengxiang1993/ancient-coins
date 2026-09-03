# 技术设计文档：新增「历代铁钱」专题类目（dynastyIndex 20）

> 日期：2026-09-03 ｜ 状态：已获用户批准设计方向
> 补充要求（用户 2026-09-03）：特征描述、尺寸、重量、铸造局、铸造年份等必须详尽描述；内容须经多个官方数据源交叉核实完善。

## 1. 需求理解

- **目标**：新增跨朝代专题类目「历代铁钱」（`data/dynasties/20.json`），系统收录中国历代圆形方孔铁钱，与「花钱_压胜钱」（18）、「外国钱币」（19）并列。
- **收录范围**：六大主流铸行体系（分期分组条目模式）——南朝梁、五代十国（楚/闽）、北宋、南宋、西夏、清代咸丰。
- **呈现信息**（每条目及每版别行）：
  - 背面纹饰：`featuresGroup.reverse` + 版别行 description（光背/背星月/背纪年/背纪值/背局名等）
  - 特征描述：`featuresGroup`（common/obverse/reverse）三段详尽描述
  - 尺寸、重量：条目 `dimensions` 给区间，版别行 description 逐钱标注「径 X.X 厘米，重约 X 克」（可考者必录，不可考者不虚构）
  - 铸造局（钱监/钱局）、铸造年份：`castingTime`、`castingCraft`、`coreBackground` 及版别行 notes 详尽标注
  - 参考价格：`summary.estimatedValue` + 版别行 `priceRange`
  - 等级：`summary.rarity` + 版别行 `grade`（马定祥十级制）
- **不做**：不改动现有朝代文件（0–19.json）；不迁移既有 41 枚铁质条目；不收录新莽/蜀/唐/金/明零散铁钱（后续可扩）。

## 2. 影响评估

- **涉及模块**：数据（新增 20.json）、前端常量（dynastyTabs）、图片同步脚本、版别权威清单、项目文档
- **涉及朝代**：新增文件仅 20.json（index 20，位于 19 之后，符合顺序规则）；不动 0–19
- **文件清单**：
  - 新增：`data/dynasties/20.json`（6 条目 × 3–20 版别行）
  - 修改：`src/constants/dynastyTabs.ts`（追加 `'铁钱'`，注释 0-19→0-20）
  - 修改：`scripts/sync-images.mjs`（`DYNASTY_PREFIX_MAP` 加 `'历代铁钱': 'aa'`，a–z 已用尽）
  - 修改：`scripts/variant-standard.json`（新增 `"20"` 清单，与写入版别表同步定义）
  - 修改：`AGENTS.md` §2.1 朝代表（第 21 行：20｜历代铁钱｜20.json｜6）、README（朝代 20→21、钱币 506→512）
- **风险点**：
  1. 版别行等级/价格与 5/9/10/11/14/17.json 已有同币定级不一致 → 实现时逐行核对既有数据，一致者优先沿用
  2. variant-standard 清单漏项导致审计不过 → 版别表与清单同步编写
  3. 尺寸/重量/铸局等细节数据不可考时虚构 → 铁律：仅录可考数据，用「约」标注近似，不可考者宁缺毋滥
  4. 前端 tab 数组越位 → App.tsx 按 `DYNASTY_TAB_LABELS[idx] ?? dynasty.dynasty` 回退，追加安全；仍需 dev 验证

## 3. 技术方案

### 3.1 数据结构（沿用现有 schema，零结构变更）

顶层：`{ "dynasty": "历代铁钱", "dynastyIndex": 20, "coins": [...] }`

条目模式（对齐 18.json 花钱）：`coin.dynasty = "历代铁钱"`（单分组），条目名承载分期：

| id | name | 概要 |
|----|------|------|
| 20-0 | 南朝梁铁五铢 | 梁武帝普通四年（523 年）始铸，中国大规模铁钱之始 |
| 20-1 | 五代十国铁钱 | 楚（长沙）乾封泉宝大铁钱、天策府宝；闽（福州）开元通宝、永隆通宝等 |
| 20-2 | 北宋铁钱 | 川陕铁钱体系：淳化至宣和各朝，益州/邛州/兴元府等钱监 |
| 20-3 | 南宋铁钱 | 绍兴至嘉熙，背纪年/纪值体系，两淮川铁钱区 |
| 20-4 | 西夏铁钱 | 天盛、乾祐、天庆、光定诸元宝铁钱 |
| 20-5 | 清代咸丰铁钱 | 宝河、宝巩、宝苏等局当五/当十/当百铁钱 |

每条目 `detail`：`castingTime`（起讫年份+公历）、`material`（铁质描述，与既有铁质条目措辞一致）、`dimensions`（分期区间）、`featuresGroup` 三段（含读法：圆形方孔钱须注明旋读/直读）、`castingCraft`（铸造工艺+钱监/钱局）、`coreBackground`（铸行背景，多行 `\n` 分隔、注明来源）。
`variantsTable` 每行：`variant`（钱名+版别，含背纹关键词）、`description`（形制+**背面纹饰**+尺寸+重量+铸地/铸局+年份）、`grade`、`priceRange`、`notes`（存世/出处备注）。

### 3.2 内容生产流程（多源核实）

1. **先核对既有数据**：提取 5/9/10/11/14/17.json 中同币条目/版别行的定级、价格、尺寸，优先沿用
2. **多官方数据源交叉核实**：AGENTS.md §9.2 官网资源（中国国家博物馆 chnmuseum.cn、中国大百科 zgbk.com、故宫 dpm.org.cn、中国钱币博物馆 cncoin.com）检索核实铸造年份、钱监/钱局、形制尺寸
3. **权威出版物知识兜底**：《中国钱币大辞典》《古钱大辞典》《历代古钱图说》《中国古钱谱》体系内容
4. **冲突处理**：多源不一致时取权威出版物记载，差异记入 notes；禁止虚构钱币、版别、尺寸、重量
5. 按条目 20-0→20-5 顺序逐条撰写（单文件内顺序执行，符合 AGENTS.md §2）

### 3.3 配套改动

- `dynastyTabs.ts`：数组追加 `'铁钱'`（注释标 20）
- `sync-images.mjs`：`'历代铁钱': 'aa'`（图片目录 `aa-历代铁钱/`，本期无图，仅预留映射避免空前缀）
- `variant-standard.json`：`"20": { "南朝梁铁五铢": [...], "五代十国铁钱": [...], "北宋铁钱": [...], "南宋铁钱": [...], "西夏铁钱": [...], "清代咸丰铁钱": [...] }`（结构对齐现有清单：顶层=朝代索引字符串，内层=币名→版别关键词数组）
- `AGENTS.md` §2.1、README 数据同步

## 4. 实现计划（按条目顺序）

1. [ ] P0 20-0 南朝梁铁五铢（依据 5-9 既有条目扩展 + 官方源核实）
2. [ ] P0 20-1 五代十国铁钱（核对 9.json 乾封泉宝/天策府宝/开元通宝-闽等）
3. [ ] P0 20-2 北宋铁钱（核对 10.json 9 枚铁质条目 + 补主流铁钱）
4. [ ] P0 20-3 南宋铁钱（核对 11.json 31 枚铁质条目，重点背纪年体系）
5. [ ] P0 20-4 西夏铁钱（核对 14.json 铁钱/铁母版别行）
6. [ ] P0 20-5 清代咸丰铁钱（核对 17.json 咸丰通宝/重宝/元宝铁钱版别行）
7. [ ] P1 配套 4 处：dynastyTabs / sync-images / variant-standard / AGENTS.md+README
8. [ ] P0 集成验证：parse-data → validate → audit-variant-completeness → audit-variant-quality → build → dev 人工确认

## 5. 验证方案

```bash
pnpm run parse-data                              # 完整流水线（sync-images→生成→校验）
pnpm run validate                                # schema + 一致性
node scripts/audit-completeness.mjs              # 完整性
node scripts/audit-features.mjs                  # 旋读/直读覆盖（新条目须含读法描述）
node scripts/audit-variant-completeness.mjs      # 版别清单覆盖（缺失 0）
node scripts/audit-variant-quality.mjs           # 弱描述检查
npx tsc --noEmit && pnpm run build               # 类型 + 构建
```

人工验证：dev 起服 → 朝代 tab 出现「铁钱」且在末位 → 6 条目渲染（分组、版别表、价格、等级）→ 搜索「铁五铢」「嘉定」「咸丰铁钱」可命中 → 既有朝代页无变化。

## 6. 回归影响

- 现有 506 枚数据零改动；仅前端 tab 数组追加与两个脚本映射追加，均为加法操作
- 搜索/懒加载按 dynastyIndex 动态取数，20 自动纳入
- 提交按 Conventional Commits：`feat(铁钱): 新增历代铁钱专题类目（20.json，6 条目）`
