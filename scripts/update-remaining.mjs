import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));

function findCoin(dynastyName, coinName) {
  const dynasty = data.find(d => d.dynasty === dynastyName);
  if (!dynasty) return null;
  return dynasty.coins.find(c => c.name === coinName) || null;
}

// ========== 替换通用背面描述为具体描述 ==========

const rfUpdates = {
  // 汉代
  '汉代钱币/綖环五铢': '- 背面：与标准五铢相同，穿上下各有横画（面文"五铢"），但钱体仅剩外缘环状部分，内圈被剪凿取用',
  // 南朝
  '南朝钱币/四柱五铢': '- 背面：穿上下各有一星点纹（"四柱"指面背各有两个星点，共四点），为该钱最大辨识特征',
  // 北宋 - 绍圣通宝/政和重宝
  '北宋钱币/绍圣通宝': '- 背面：光素无文（光背），绍圣通宝无纪年、纪地文字',
  '北宋钱币/政和重宝': '- 背面：光素无文（光背），铁钱版背面偶有纪监文字',
  // 南宋
  '南宋钱币/纯熙元宝': '- 背面：光素无文（光背），年号仅用6天，铸量极少',
  // 辽朝 - 辽钱传统上光背，但描述可以更具体
  '辽朝钱币/通行泉货': '- 背面：光素无文（光背），辽代早期铸币沿袭唐制，多为光背',
  '辽朝钱币/神册通宝': '- 背面：光素无文（光背），辽代太祖朝铸币，铸工粗犷',
  '辽朝钱币/天赞通宝': '- 背面：光素无文（光背），辽代太祖朝铸币',
  '辽朝钱币/天显通宝': '- 背面：光素无文（光背），辽代太宗朝铸币，铸工较精',
  '辽朝钱币/会同通宝': '- 背面：光素无文（光背），辽代太宗朝铸币',
  '辽朝钱币/开泰元宝': '- 背面：光素无文（光背），辽代圣宗朝铸币',
  '辽朝钱币/太平元宝': '- 背面：光素无文（光背），辽代圣宗朝铸币',
  '辽朝钱币/景福通宝': '- 背面：光素无文（光背），辽代兴宗朝铸币',
  '辽朝钱币/清宁元宝': '- 背面：光素无文（光背），辽代道宗朝铸币',
  '辽朝钱币/大康元宝': '- 背面：光素无文（光背），辽代道宗朝铸币',
  '辽朝钱币/助国元宝': '- 背面：光素无文（光背），助国钱为辽代特有铸币类型',
  '辽朝钱币/壮国元宝': '- 背面：光素无文（光背），壮国钱与助国钱性质相近',
  '辽朝钱币/大辽天庆': '- 背面：光素无文（光背），辽末天祚帝朝铸币',
  // 金朝
  '金朝钱币/天辅元宝': '- 背面：光素无文（光背），金代太祖朝铸币，存世极罕',
  '金朝钱币/天眷通宝': '- 背面：光素无文（光背），金代熙宗朝铸币，有楷书、篆书两种',
  '金朝钱币/天眷元宝': '- 背面：光素无文（光背），金代熙宗朝铸币',
  '金朝钱币/天眷重宝': '- 背面：光素无文（光背），金代熙宗朝铸币',
  '金朝钱币/皇统元宝': '- 背面：光素无文（光背），金代熙宗朝铸币',
  '金朝钱币/皇统通宝': '- 背面：光素无文（光背），金代熙宗朝铸币',
  '金朝钱币/崇庆通宝': '- 背面：光素无文（光背），金代卫绍王朝铸币',
  '金朝钱币/崇庆元宝': '- 背面：光素无文（光背），金代卫绍王朝铸币',
  '金朝钱币/至宁元宝': '- 背面：光素无文（光背），金代卫绍王朝铸币',
  '金朝钱币/贞祐元宝': '- 背面：光素无文（光背），金代宣宗朝铸币',
  // 明朝
  '明朝钱币/洪熙通宝': '- 背面：光素无文（光背），洪熙年号仅一年，铸量极少',
  '明朝钱币/宣德通宝': '- 背面：光素无文（光背），宣德铸币铸工较精',
  '明朝钱币/弘治通宝': '- 背面：光素无文（光背），弘治铸币铜质较好',
  '明朝钱币/嘉靖通宝': '- 背面：光素无文（光背），嘉靖通宝铸造量大，有小平和折五型',
  '明朝钱币/隆庆通宝': '- 背面：光素无文（光背），隆庆年号仅六年，铸量较少',
  '明朝钱币/万历银钱': '- 背面：光素无文，银质铸币，非流通货币，属赏赐或纪念性质',
  '明朝钱币/泰昌通宝': '- 背面：光素无文（光背），泰昌年号仅一月，由天启朝补铸',
  '明朝钱币/天启通宝': '- 背面：光素无文（光背）或背纪局文字（如"工""户"等），折十型背有星月纹',
  // 明末起义
  '明末农民起义钱币/永昌通宝': '- 背面：光素无文（光背），李自成大顺政权铸币',
  // 清朝
  '清朝钱币/天命通宝': '- 背面：汉文版光素无文；满文版背面铸有满文',
  // 三藩
  '三藩钱币/洪化通宝': '- 背面：光素无文（光背），吴世璠铸币',
  // 晚清起义
  '晚清起义钱币/天朝通宝': '- 背面：光素无文（光背），天地会铸币',
  '晚清起义钱币/皇帝通宝': '- 背面：光素无文（光背），天地会铸币',
  '晚清起义钱币/天元通宝': '- 背面：光素无文（光背），天地会铸币',
  '晚清起义钱币/嗣统通宝': '- 背面：光素无文（光背），天地会铸币',
};

for (const [key, rf] of Object.entries(rfUpdates)) {
  const [dynasty, name] = key.split('/');
  const c = findCoin(dynasty, name);
  if (c) c.detail.reverseFeatures = rf;
}

// ========== 扩充较常见钱币的版别 ==========

// 新莽 十布系列 - 大部分是五级/六级，可以有更多版别
const shibuCoins = {
  '幺泉一十': { grade: '五级（稀贵）', price: '3,000—15,000元', extra: [
    { variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '5,000—20,000元', notes: '大字版较少' },
  ]},
  '幼泉二十': { grade: '五级（稀贵）', price: '3,000—20,000元', extra: [
    { variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '5,000—20,000元', notes: '大字版较少' },
  ]},
  '中泉三十': { grade: '五级（稀贵）', price: '3,000—30,000元', extra: [
    { variant: '大字版', description: '面文较大', grade: '四级（罕） 美品', priceRange: '10,000—50,000元', notes: '大字版较少' },
  ]},
  '小布一百': { extra: [{ variant: '合背版', description: '两面均为面文', grade: '五级（稀贵） 美品', priceRange: '3,000—10,000元', notes: '合背版' }] },
  '幺布二百': { extra: [{ variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '3,000—10,000元', notes: '大字版' }] },
  '幼布三百': { extra: [{ variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '5,000—15,000元', notes: '大字版较少' }] },
  '序布四百': { extra: [{ variant: '合背版', description: '两面均为面文', grade: '四级（罕） 美品', priceRange: '5,000—20,000元', notes: '合背版' }] },
  '差布五百': { extra: [{ variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '5,000—20,000元', notes: '大字版较少' }] },
  '中布六百': { extra: [{ variant: '大字版', description: '面文较大', grade: '四级（罕） 美品', priceRange: '10,000—30,000元', notes: '大字版较少' }] },
  '壮布七百': { extra: [{ variant: '传形版', description: '钱文左右反转', grade: '四级（罕） 美品', priceRange: '5,000—30,000元', notes: '传形版较罕' }] },
  '第布八百': { extra: [{ variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '5,000—20,000元', notes: '大字版较少' }] },
  '次布九百': { extra: [{ variant: '合背版', description: '两面均为面文', grade: '四级（罕） 美品', priceRange: '5,000—20,000元', notes: '合背版' }] },
};

for (const [name, info] of Object.entries(shibuCoins)) {
  const c = findCoin('新莽钱币', name);
  if (c && info.extra) {
    c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
  }
}

// 南朝钱币 - 扩充常见品种
const nanchaoUpdates = {
  '元嘉四铢': { extra: [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大字版' },
    { variant: '阔缘版', description: '外廓较宽', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '阔缘' },
  ]},
  '四铢钱': { extra: [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '大字版' },
  ]},
  '天监五铢': { extra: [
    { variant: '大字版', description: '面文较大', grade: '九级（多） 美品', priceRange: '10—30元', notes: '大字版' },
  ]},
  '公式女钱': { extra: [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '大字版' },
  ]},
  '两柱五铢': { extra: [
    { variant: '大样版', description: '体型较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大样版' },
  ]},
  '天嘉五铢': { extra: [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '大字版' },
  ]},
  '鹅眼钱': { extra: [
    { variant: '大样版', description: '体型略大', grade: '九级（多） 美品', priceRange: '10—30元', notes: '大样版' },
  ]},
};

for (const [name, info] of Object.entries(nanchaoUpdates)) {
  const c = findCoin('南朝钱币', name);
  if (c && info.extra) {
    c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
  }
}

// 北朝钱币
const beichaoUpdates = {
  '永平五铢': { extra: [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大字版' },
  ]},
  '东魏五铢': { extra: [
    { variant: '大字版', description: '面文较大', grade: '九级（多） 美品', priceRange: '10—30元', notes: '大字版' },
  ]},
  '大统五铢': { extra: [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大字版' },
  ]},
};

for (const [name, info] of Object.entries(beichaoUpdates)) {
  const c = findCoin('北朝钱币', name);
  if (c && info.extra) {
    c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
  }
}

// 太平天国钱币 - 扩充版别
const taipingUpdates = {
  '天国通宝': { extra: [
    { variant: '大字版', description: '面文较大，铸工较精', grade: '五级（稀贵） 美品', priceRange: '3,000—10,000元', notes: '大字版' },
  ]},
  '天国圣宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '1,000—3,000元', notes: '大字版' },
  ]},
  '太平圣宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '1,000—3,000元', notes: '大字版' },
  ]},
  '天国背通宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '3,000—10,000元', notes: '大字版' },
  ]},
  '天国背圣宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '3,000—10,000元', notes: '大字版' },
  ]},
  '天国太平背圣宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '1,000—3,000元', notes: '大字版' },
  ]},
  '天国圣宝背太平': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '1,000—3,000元', notes: '大字版' },
  ]},
  '太平圣宝背天国': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '1,000—3,000元', notes: '大字版' },
  ]},
};

for (const [name, info] of Object.entries(taipingUpdates)) {
  const c = findCoin('太平天国钱币', name);
  if (c && info.extra) {
    c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
  }
}

// 辽朝 - 为有条件的品种扩充版别
const liaoExtra = {
  '通行泉货': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '2,000—5,000元', notes: '大字版' },
  ]},
  '天朝万顺': { extra: [
    { variant: '大字版', description: '契丹文较大', grade: '五级（稀贵） 美品', priceRange: '5,000—15,000元', notes: '大字版' },
  ]},
  '助国元宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '5,000—15,000元', notes: '大字版' },
  ]},
  '壮国元宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '五级（稀贵） 美品', priceRange: '5,000—15,000元', notes: '大字版' },
  ]},
  '千秋万岁': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '2,000—5,000元', notes: '大字版' },
    { variant: '小型版', description: '体型较小', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '小型版' },
  ]},
  '清宁元宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '2,000—5,000元', notes: '大字版' },
  ]},
  '大康元宝': { extra: [
    { variant: '大字版', description: '面文较大', grade: '六级（稀） 美品', priceRange: '2,000—5,000元', notes: '大字版' },
  ]},
};

for (const [name, info] of Object.entries(liaoExtra)) {
  const c = findCoin('辽朝钱币', name);
  if (c && info.extra) {
    c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
  }
}

// 金朝 - 为有条件的品种扩充
const jinExtra = {
  '天眷通宝': { extra: [
    { variant: '小平篆书', description: '面文篆书，对读', grade: '二级（珍） 美品', priceRange: '50,000—200,000元', notes: '篆书版极罕' },
    { variant: '小平楷书', description: '面文楷书，对读', grade: '二级（珍） 美品', priceRange: '50,000—200,000元', notes: '楷书版极罕' },
    { variant: '折二型', description: '折二型铜钱', grade: '一级（大珍） 美品', priceRange: '200,000—500,000元', notes: '折二型极罕' },
  ]},
  '崇庆通宝': { extra: [
    { variant: '小平篆书', description: '面文篆书，对读', grade: '四级（罕） 美品', priceRange: '10,000—30,000元', notes: '篆书版' },
    { variant: '小平楷书', description: '面文楷书，对读', grade: '四级（罕） 美品', priceRange: '10,000—30,000元', notes: '楷书版' },
    { variant: '折二型', description: '折二型铜钱', grade: '三级（罕贵） 美品', priceRange: '30,000—100,000元', notes: '折二型极罕' },
  ]},
};

for (const [name, info] of Object.entries(jinExtra)) {
  const c = findCoin('金朝钱币', name);
  if (c && info.extra) {
    c.detail.variantsTable = [...c.detail.variantsTable, ...info.extra];
  }
}

// 天命通宝 fix - 之前设了通用描述但实际有汉文/满文区分
const tianming = findCoin('清朝钱币', '天命通宝');
if (tianming) {
  tianming.detail.reverseFeatures = '- 背面：汉文版光素无文（光背）；满文版背面铸满文"阿济格"（意为何恩户），亦有光背版';
}

writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Remaining corrections applied!');
