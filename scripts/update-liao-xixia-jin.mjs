import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));

function findCoin(dynastyName, coinName) {
  const dynasty = data.find(d => d.dynasty === dynastyName);
  if (!dynasty) return null;
  return dynasty.coins.find(c => c.name === coinName) || null;
}

// 辽钱大多数为珍稀品，版别较少，2个版别是合理的
// 但需要修正reverseFeatures和完善描述

// ========== 辽朝钱币 ==========
const liaoCoins = {
  '通行泉货': { rf: '- 背面：光素无文（光背）', extra: [{ variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '2,000—5,000元', notes: '大字版' }] },
  '神册通宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '天赞通宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '天显通宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '会同通宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '开泰元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '太平元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '景福通宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '清宁元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '大康元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '天朝万顺': { rf: '- 背面：光素无文（光背），契丹文钱币', extra: [] },
  '助国元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '壮国元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '千秋万岁': { rf: '- 背面：光素无文（光背），吉语钱', extra: [] },
  '大辽天庆': { rf: '- 背面：光素无文（光背）', extra: [] },
};

for (const [name, info] of Object.entries(liaoCoins)) {
  const c = findCoin('辽朝钱币', name);
  if (c) {
    if (info.rf) c.detail.reverseFeatures = info.rf;
    if (info.extra.length > 0) {
      c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
    }
  }
}

// ========== 西夏钱币 ==========
// 西夏钱币有汉文和西夏文两种，背面特征需区分
const xixiaUpdates = {
  '福圣宝钱': { rf: '- 背面：光素无文（光背），西夏文钱币', extra: [] },
  '大安宝钱': { rf: '- 背面：光素无文（光背），西夏文钱币', extra: [] },
  '大安通宝': { rf: '- 背面：光素无文（光背），汉文钱币', extra: [
    { variant: '长字版', description: '面文较长', grade: '六级（稀） 美品', priceRange: '1,000—3,000元', notes: '长字版' },
  ]},
  '贞观宝钱': { rf: '- 背面：光素无文（光背），西夏文钱币', extra: [] },
  '元德重宝': { rf: '- 背面：光素无文（光背），汉文钱币', extra: [] },
  '乾祐宝钱': { rf: '- 背面：光素无文（光背），西夏文钱币', extra: [] },
  '天庆宝钱': { rf: '- 背面：光素无文（光背），西夏文钱币', extra: [] },
  '藩国宝钱': { rf: '- 背面：光素无文（光背），西夏文钱币', extra: [] },
};

for (const [name, info] of Object.entries(xixiaUpdates)) {
  const c = findCoin('西夏钱币', name);
  if (c) {
    if (info.rf) c.detail.reverseFeatures = info.rf;
    if (info.extra.length > 0) {
      c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
    }
  }
}

// ========== 金朝钱币 ==========
// 金朝钱币铸造精美，多为珍品
const jinUpdates = {
  '天辅元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '天眷通宝': { rf: '- 背面：光素无文（光背）', extra: [
    { variant: '小平楷书', description: '面文"天眷通宝"四字楷书，对读', grade: '二级（珍） 美品', priceRange: '50,000—200,000元', notes: '楷书版极罕' },
    { variant: '小平篆书', description: '面文"天眷通宝"四字篆书，对读', grade: '二级（珍） 美品', priceRange: '50,000—200,000元', notes: '篆书版极罕' },
  ]},
  '天眷元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '天眷重宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '皇统元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '皇统通宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '崇庆通宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '崇庆元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '至宁元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
  '贞祐元宝': { rf: '- 背面：光素无文（光背）', extra: [] },
};

for (const [name, info] of Object.entries(jinUpdates)) {
  const c = findCoin('金朝钱币', name);
  if (c) {
    if (info.rf) c.detail.reverseFeatures = info.rf;
    if (info.extra.length > 0) {
      c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
    }
  }
}

// ========== 三藩/太平天国/晚清起义/南明/明末 ==========
// These smaller categories need better reverseFeatures

const otherUpdates = [
  // 南明
  { dynasty: '南明钱币', name: '弘光通宝', rf: '- 背面：光素无文（光背）或背星月纹' },
  { dynasty: '南明钱币', name: '隆武通宝', rf: '- 背面：光素无文（光背）或背星纹' },
  { dynasty: '南明钱币', name: '永历通宝', rf: '- 背面：光素无文或背纪值、纪局文字（如"五厘""壹分"等）' },
  { dynasty: '南明钱币', name: '大明通宝', rf: '- 背面：光素无文（光背）或背星月纹' },
  // 明末起义
  { dynasty: '明末农民起义钱币', name: '大顺通宝', rf: '- 背面：光素无文或背"工""户"字' },
  { dynasty: '明末农民起义钱币', name: '永昌通宝', rf: '- 背面：光素无文（光背）' },
  { dynasty: '明末农民起义钱币', name: '兴朝通宝', rf: '- 背面：光素无文或背"五厘""壹分"纪值' },
  { dynasty: '明末农民起义钱币', name: '西王赏功', rf: '- 背面：光素无文（光背），金/银/铜三种材质' },
  // 三藩
  { dynasty: '三藩钱币', name: '利用通宝', rf: '- 背面：光素无文或背"厘""一分""二分""五厘"纪值' },
  { dynasty: '三藩钱币', name: '昭武通宝', rf: '- 背面：光素无文或背"壹分""五厘"纪值' },
  { dynasty: '三藩钱币', name: '洪化通宝', rf: '- 背面：光素无文（光背）' },
  { dynasty: '三藩钱币', name: '裕民通宝', rf: '- 背面：光素无文或背"一分""浙一钱"纪值' },
  // 太平天国
  { dynasty: '太平天国钱币', name: '天国通宝', rf: '- 背面：铸有"圣宝"二字' },
  { dynasty: '太平天国钱币', name: '天国圣宝', rf: '- 背面：铸有"通宝"二字' },
  { dynasty: '太平天国钱币', name: '太平通宝', rf: '- 背面：铸有"圣宝"二字' },
  { dynasty: '太平天国钱币', name: '太平圣宝', rf: '- 背面：铸有"通宝"或"圣宝"二字' },
  { dynasty: '太平天国钱币', name: '太平天国', rf: '- 背面：铸有"圣宝"二字，竖读' },
  // 晚清起义
  { dynasty: '晚清起义钱币', name: '金钱义记', rf: '- 背面：铸有方胜纹（两个菱形相连）或文字' },
  { dynasty: '晚清起义钱币', name: '平靖通宝', rf: '- 背面：铸有"中""左""右""前""后"等字' },
  { dynasty: '晚清起义钱币', name: '天朝通宝', rf: '- 背面：光素无文' },
  // 花钱
  { dynasty: '花钱_压胜钱', name: '吉语花钱', rf: '- 背面：铸有吉语文字或图案，如"长命富贵""天下太平"等' },
  { dynasty: '花钱_压胜钱', name: '生肖花钱', rf: '- 背面：铸有十二生肖图案' },
  { dynasty: '花钱_压胜钱', name: '八卦花钱', rf: '- 背面：铸有八卦图案' },
  { dynasty: '花钱_压胜钱', name: '镂空花钱', rf: '- 背面：镂空花纹图案' },
];

for (const u of otherUpdates) {
  const c = findCoin(u.dynasty, u.name);
  if (c && u.rf) {
    c.detail.reverseFeatures = u.rf;
  }
}

writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Liao/XiXia/Jin/other corrections applied!');
