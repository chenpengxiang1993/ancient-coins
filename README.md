# 中国古代钱币图鉴

先秦至清代金属铸币的交互式图鉴，涵盖 21 个历史时期、512 种钱币，支持按朝代浏览、全文搜索和稀有度评级。

## 功能

- **朝代浏览** — 21 个历史时期分类，横向标签快速切换
- **全文搜索** — 客户端即时搜索，支持钱币名称、朝代、材质等多字段匹配
- **钱币详情** — 展示钱币图片、文字描述、版别信息、铸造工艺、稀有度评级
- **稀有度评级** — 基于马定祥十级评级体系（一级大珍 → 十级多泛）
- **响应式布局** — 适配桌面端、平板、手机，移动端侧边栏抽屉式交互
- **按需加载** — 摘要数据异步加载 + 详情按朝代懒加载
- **图片优化** — WebP 格式 + 独立缩略图 + `<picture>` 元素渐进加载
- **代码拆分** — CoinDetail 组件 React.lazy 懒加载，首屏 JS 仅 ~18 KB

## 技术栈

- **React 18** + **TypeScript**
- **Vite 6** 构建（terser 压缩 + 预压缩 .gz/.br）
- **SCSS Modules** 样式方案
- **pnpm** 包管理
- 零 UI 框架依赖，原生组件 + 自定义样式

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器（端口 3601）
pnpm dev

# 数据重建（sync-images → 生成前端数据 → schema 校验 → 一致性校验）
pnpm run parse-data

# 转换图片（JPG → WebP + 生成缩略图，需安装 cwebp）
pnpm run convert-images

# 构建生产版本
pnpm run build

# 预览构建产物
pnpm run preview
```

## 数据流水线（JSON-first）

```
data/dynasties/{0..20}.json (21 个朝代 JSON，单一数据源)
  └─► Vite 插件（vite.config.ts）在 dev/build 时自动生成
        ├─► public/data/coins-summary.json (~230 KB, 首屏)
        └─► public/data/detail/{0..20}.json (按朝代懒加载)
```

- 唯一数据源：`data/dynasties/{0..20}.json`。`public/data/` 为构建产物（已 gitignore），禁止提交与手工编辑。
- 修改 JSON 后，dev 下热更新即时重新生成；或运行 `pnpm run parse-data` 手动全量重建。
- `pnpm run validate` 全量校验（schema + 逻辑一致性）。

## 图片流水线

```
public/images/coins/**/*.jpg  →  scripts/convert-images.mjs  →  *.webp + thumb.webp
```

- 原图 WebP（Q80）— 比 JPG 减少约 25-35% 体积
- 缩略图 thumb.webp（150×150，Q70）— 缩略图场景替代原图，减少约 95% 传输量
- `<picture>` 元素自动选择 WebP，不支持时回退 JPG

## 项目结构

```
├── data/dynasties/      # 21 个朝代 JSON 数据源（唯一可编辑入口）
├── public/
│   ├── images/coins/     # 钱币图片（JPG + WebP + 缩略图，按朝代分目录）
│   └── data/             # 前端运行时数据（构建时自动生成，gitignore）
│       ├── coins-summary.json  # 摘要数据（运行时 fetch）
│       └── detail/             # 朝代详情 JSON
├── src/
│   ├── components/
│   │   ├── CoinDetail/   # 钱币详情面板（React.lazy 懒加载）
│   │   ├── CoinImage/    # 钱币图片组件（picture + WebP + 缩略图）
│   │   ├── CoinList/     # 侧边栏钱币列表
│   │   ├── DynastyTabs/  # 朝代标签栏
│   │   └── SearchBar/    # 搜索栏
│   ├── hooks/
│   │   ├── useCoinDetail.ts   # 详情数据获取与缓存
│   │   ├── useSummaryData.ts  # 摘要数据异步加载
│   │   └── useDebounce.ts     # 防抖
│   ├── utils/
│   │   ├── search.ts    # 全文搜索引擎
│   │   ├── rarity.ts    # 稀有度解析
│   │   └── format.ts    # 文本格式化
│   ├── types/index.ts   # TypeScript 类型定义
│   └── styles/          # 共享样式变量与 mixin
├── scripts/              # 数据生成、校验、图片转换等脚本
└── deploy/               # 部署配置（Nginx）
```

## 数据覆盖

| 时期 | 数量 | 时期 | 数量 |
|---|---|---|---|
| 先秦 | 29 | 北宋 | 54 |
| 秦 | 4 | 南宋 | 61 |
| 汉（含新莽22） | 40 | 辽朝 | 28 |
| 三国 | 12 | 金朝 | 15 |
| 两晋十六国 | 5 | 西夏 | 14 |
| 南朝 | 17 | 元朝 | 33 |
| 北朝 | 9 | 明朝（含明末4、南明4） | 21 |
| 隋朝 | 2 | 清朝（含三藩4、太平天国11、晚清起义8） | 44 |
| 唐朝 | 11 | 花钱/压胜钱 | 11 |
| 五代十国 | 29 | 外国铸币 | 67 |
| 历代铁钱（专题） | 6 | | |

## 部署

项目通过 GitHub Actions 自动构建部署至云服务器，详见 [deploy/README.md](deploy/README.md)。

## 许可

本项目数据与图片仅供学习参考。
