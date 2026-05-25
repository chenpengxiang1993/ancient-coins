---
alwaysApply: true
scene: project
---

# 工程开发规范

## 文档合并与导出

```bash
# 合并 docs/target/ 下26个分朝代文件为 Markdown
node scripts/merge-and-export.mjs
# 输出：docs/中国历代金属钱币全集.md

# 导出为 Word（需 pandoc）
pandoc "docs/中国历代金属钱币全集.md" -o "docs/中国历代金属钱币全集.docx" --from markdown --to docx --standalone
# 输出：docs/中国历代金属钱币全集.docx
```

合并后文档结构：1.历代钱币汇总表（每朝代独立小表）→ 2.历代钱币详细介绍（每朝代下按钱币名称展开）

## 数据同步

修改 `docs/target/` 下文件后，**必须使用完整流程**，禁止跳过任何步骤：

```bash
# 推荐：一条命令完成所有步骤（解析 → 迁移 → 拆分 → 校验）
pnpm run parse-data

# 等效手动执行（禁止省略任何步骤）：
node scripts/parse-coins-data.mjs
node scripts/migrate-variants.mjs
node scripts/split-coins-data.mjs
node scripts/validate-data.mjs

# 转换图片为 WebP 格式 + 生成缩略图（需安装 cwebp）
node scripts/convert-images.mjs

# 构建生产版本
pnpm run build
```

数据流向（三步流水线，缺一不可）：

```
步骤一：docs/target/*.md → parse-coins-data.mjs → data/coins.json
  输出字段：castingTime、material、dimensions、obverseFeatures、reverseFeatures、castingCraft、coreBackground、variants（版别体系文本）、valueReference、valueTable（价值参考表格）

步骤二：data/coins.json → migrate-variants.mjs → data/coins.json（原地更新）
  职责：将 variants 文本与 valueTable 表格智能匹配，生成 variantsTable（含 description 字段），删除 variants、valueReference、valueTable

步骤三：data/coins.json → split-coins-data.mjs → public/data/coins-summary.json + public/data/detail/0.json—25.json
```

图片流水线：

```
public/images/coins/**/*.jpg → convert-images.mjs → *.webp（原图）+ thumb.webp（150×150 缩略图）
```

## 前后端字段对照表

前端 `CoinDetail` 类型（`src/types/index.ts`）与最终 JSON 必须完全匹配：

| 前端类型字段 | JSON 字段 | 说明 |
| --- | --- | --- |
| `castingTime` | `castingTime` | 铸造时间 |
| `material` | `material` | 材质成分 |
| `dimensions` | `dimensions` | 尺寸重量 |
| `obverseFeatures` | `obverseFeatures` | 面特征 |
| `reverseFeatures` | `reverseFeatures` | 背特征 |
| `castingCraft` | `castingCraft` | 铸造工艺 |
| `coreBackground` | `coreBackground` | 核心背景 |
| `variantsTable` | `variantsTable` | 版别体系表格（含特征描述、品相等级、参考价格） |
| `images` | `images` | 钱币图片 |

`VariantTableRow` 字段：variant、description、grade、priceRange、notes（五个字段缺一不可）

## 数据校验

- 每次数据同步后自动执行 `validate-data.mjs`，校验所有443枚钱币的字段完整性
- 也可手动执行：`pnpm run validate`
- 校验失败（错误 > 0）时构建必须中止，修复后重新执行完整流程
- **禁止跳过 `migrate-variants.mjs`**：该步骤负责为 `variantsTable.grade` 添加稀有度等级

## 原子写入与数据安全规范

所有脚本写入 JSON 文件时**必须使用原子写入**（先写临时文件再重命名），禁止直接 `writeFileSync` 覆盖目标文件：

```javascript
// 正确：原子写入
const tmp = filePath + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
fs.renameSync(tmp, filePath);

// 禁止：直接覆盖（崩溃时可能产生损坏文件）
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
```

适用范围：
- `parse-coins-data.mjs` → `data/coins.json`
- `migrate-variants.mjs` → `data/coins.json` 和 `public/data/detail/*.json`
- `split-coins-data.mjs` → `public/data/coins-summary.json` 和 `public/data/detail/*.json`

## 数据同步前备份规范

每次执行 `pnpm run parse-data` 前，**必须自动备份** `data/coins.json`：

```bash
cp data/coins.json "data/coins.json.bak.$(date +%Y%m%d%H%M%S)"
```

可在 `parse-data` 脚本中自动加入备份步骤，确保数据丢失时可回溯。

## 版别体系数据完整性校验增强

除字段完整性校验外，`validate-data.mjs` 还应检查以下内容：

| 校验项 | 说明 |
| --- | --- |
| `variantsTable` 非空 | 每枚钱币必须有版别表（至少1行） |
| `variant` 非空 | 每行版别名不能为空 |
| `description` 非空 | 每行描述不能为空 |
| `grade` 格式 | 必须以等级前缀开头，如"八级（较多）" |
| `coins.json` 与 `detail/*.json` 一致 | variantsTable 内容必须完全匹配 |
| 钱币数量 | 每个朝代钱币数量必须与预期一致 |

## 常见错误与禁忌

| 错误行为 | 后果 | 正确做法 |
| --- | --- | --- |
| 手动执行 `parse → split` 跳过 `migrate` | `variantsTable.grade` 缺少稀有度等级前缀 | 使用 `pnpm run parse-data` 完整流程 |
| md文件中「版别体系」模块仍使用旧格式（纯文本子项） | `parse` 无法正确解析5列表格 | 使用 `scripts/merge-variants-value.mjs` 转换为表格格式 |
| 单独重跑 `migrate-variants.mjs` | `detail/*.json` 与 `coins.json` 可能不一致 | 使用完整 `pnpm run parse-data` 流程 |
| 直接 `writeFileSync` 覆盖 JSON | 崩溃时文件损坏，数据不可恢复 | 使用原子写入（先写 `.tmp` 再 `renameSync`） |
| 修改 `docs/target/` 后不执行完整流程 | 前端数据与源文件不一致 | 严格执行 `pnpm run parse-data` 完整四步流水线 |

## 数据恢复流程

当数据丢失或损坏时，按以下优先级恢复：

1. **最近备份**：检查 `data/coins.json.bak.*` 文件，取最新一份
2. **重新解析**：从 `docs/target/*.md` 源文件重新执行 `pnpm run parse-data`
3. **Git 历史**：通过 `git checkout` 恢复特定文件到已知良好版本

验证恢复结果：
```bash
pnpm run validate
```
