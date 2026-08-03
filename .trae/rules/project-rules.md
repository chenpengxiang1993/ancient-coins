---
alwaysApply: true
scene: project
---

# 工程开发规范

## 数据同步

数据唯一来源：`data/dynasties/*.json`（禁止手工编辑 `public/data/`，其为构建产物）。

```bash
# 手动全量重建（sync-images → 生成前端数据 → schema 校验 → 一致性校验）
pnpm run parse-data

# 仅校验（schema + 逻辑一致性）
pnpm run validate

# 转换图片为 WebP 格式 + 生成缩略图（需安装 cwebp）
node scripts/convert-images.mjs

# 构建生产版本
pnpm run build
```

数据流向：

```
data/dynasties/*.json → [Vite 插件 / generate-public-data.mjs] → public/data/
                     → [validate-data + verify-consistency]    → 校验报告
```

- `public/data/` 由 Vite 插件在 dev/build 时自动生成，已 gitignore，禁止提交。
- 修改 JSON 后，dev 下热更新即时重新生成；CI 构建前自动执行 `pnpm run parse-data`。

## 原子写入规范

所有脚本写入 JSON 文件时**必须使用原子写入**（先写临时文件再重命名），禁止直接 `writeFileSync` 覆盖目标文件：

```javascript
// 正确：原子写入
const tmp = filePath + '.tmp';
fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
fs.renameSync(tmp, filePath);

// 禁止：直接覆盖（崩溃时可能产生损坏文件）
fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
```

适用范围：`generate-public-data.mjs` → `public/data/coins-summary.json` 和 `public/data/detail/*.json`。

## 数据校验

- `validate-data.mjs`：校验 443 枚钱币的字段完整性（schema），失败时 exit 1。
- `verify-consistency.mjs`：跨字段逻辑一致性报告（稀有度/价格/版别关联）。
- 合并命令：`pnpm run validate`。
- 校验失败（错误 > 0）时构建必须中止，修复后重新执行完整流程。

## 常见错误与禁忌

| 错误行为 | 后果 | 正确做法 |
| --- | --- | --- |
| 直接编辑 `public/data/*.json` | 下次 build 被覆盖 | 修改源 JSON，运行 `pnpm run parse-data` 或 dev 自动生成 |
| 使用脚本批量修改数据 | 变更不可追溯、质量不可控 | 逐朝代逐钱币手动 Edit |
| 直接 `writeFileSync` 覆盖 JSON | 崩溃时文件损坏，数据不可恢复 | 使用原子写入（先写 `.tmp` 再 `renameSync`） |
| 跳过 `sync-images.mjs` | JSON 中 images 字段陈旧 | 始终 `pnpm run parse-data` 完整流水线 |

## 数据恢复流程

数据丢失或损坏时，从 Git 历史恢复：

1. **Git 历史**：`git log` 找到已知良好提交，`git checkout <commit> -- data/dynasties/`
2. **重新生成**：运行 `pnpm run parse-data` 重建 `public/data/`

验证恢复结果：
```bash
pnpm run validate
```
