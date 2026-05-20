import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));

function findCoin(dynastyName, coinName) {
  const dynasty = data.find(d => d.dynasty === dynastyName);
  if (!dynasty) return null;
  return dynasty.coins.find(c => c.name === coinName) || null;
}

const NS = '南宋钱币';

// Helper: common variant template for Southern Song 铜钱
function songTongVariants(name, extraVariants = []) {
  const base = [
    { variant: '小平铜钱（篆书）', description: `面文"${name}"四字篆书，对读或旋读`, grade: '九级（多） 普品', priceRange: '5—15元', notes: '篆书对钱' },
    { variant: '小平铜钱（楷书）', description: `面文"${name}"四字楷书，对读或旋读`, grade: '九级（多） 普品', priceRange: '5—15元', notes: '楷书对钱' },
    { variant: '小平铜钱 美品', description: `面文"${name}"，品相上佳`, grade: '九级（多） 美品', priceRange: '15—50元', notes: '美品' },
    { variant: '折二铜钱 美品', description: `折二型，直径约2.8cm`, grade: '八级（较多） 美品', priceRange: '20—80元', notes: '折二型' },
  ];
  return [...base, ...extraVariants];
}

// Helper: common variant template for Southern Song 铁钱为主的钱币
function songTieVariants(name, extraVariants = []) {
  const base = [
    { variant: '铁钱（普通版）', description: `面文"${name}"，铁质，铸量较大`, grade: '八级（较多） 美品', priceRange: '20—80元', notes: '铁钱常见' },
    { variant: '铁钱（较少版）', description: `面文"${name}"，铁质，较少版别`, grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '较少版' },
    { variant: '铁母', description: `铜质母钱，用于翻铸铁钱，铸工极精`, grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: `用铁钱范铸造的铜钱`, grade: '七级（甚少） 美品', priceRange: '500—3,000元', notes: '铁范铜' },
  ];
  return [...base, ...extraVariants];
}

// Helper: 纪年钱 variants (from 淳熙七年 onward)
function jishuVariants(name, startYear, endYear, extraVariants = []) {
  const base = [
    { variant: '小平铜钱（纪年）', description: `面文"${name}"，背面穿上有纪年数字（${startYear}—${endYear}）`, grade: '九级（多） 普品', priceRange: '5—15元', notes: '纪年钱' },
    { variant: '小平铜钱（纪年）', description: `面文"${name}"，背面穿上有纪年数字`, grade: '九级（多） 美品', priceRange: '15—50元', notes: '美品' },
    { variant: '折二铜钱（纪年）', description: `折二型纪年钱`, grade: '八级（较多） 美品', priceRange: '20—80元', notes: '折二纪年' },
    { variant: '铁钱（纪年）', description: `铁质纪年钱`, grade: '八级（较多） 美品', priceRange: '20—100元', notes: '铁钱纪年' },
  ];
  return [...base, ...extraVariants];
}

// 建炎元宝
let c = findCoin(NS, '建炎元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），少数有星月纹';
  c.detail.variantsTable = [
    { variant: '小平篆书', description: '面文"建炎元宝"四字篆书，旋读', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '篆书版' },
    { variant: '小平楷书', description: '面文"建炎元宝"四字楷书，旋读', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '楷书版' },
    { variant: '折二篆书', description: '折二型，篆书', grade: '六级（稀） 美品', priceRange: '300—1,000元', notes: '折二篆书较少' },
    { variant: '折二楷书', description: '折二型，楷书', grade: '六级（稀） 美品', priceRange: '300—1,000元', notes: '折二楷书较少' },
    { variant: '铁母', description: '铜质母钱，铸工极精', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ];
}

// 绍兴通宝
c = findCoin(NS, '绍兴通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），折二型背有星月纹';
  c.detail.variantsTable = songTongVariants('绍兴通宝', [
    { variant: '折二型（篆书）', description: '折二型篆书', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '折二篆书' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ]);
}

// 隆兴元宝
c = findCoin(NS, '隆兴元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铜钱稀少，铁钱较多';
  c.detail.variantsTable = songTieVariants('隆兴元宝', [
    { variant: '小平铜钱', description: '铜质小平钱，存世较少', grade: '七级（甚少） 美品', priceRange: '200—800元', notes: '铜钱较少' },
    { variant: '折二铜钱', description: '铜质折二型', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '折二铜钱稀少' },
  ]);
}

// 隆兴通宝
c = findCoin(NS, '隆兴通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铁钱为主';
  c.detail.variantsTable = songTieVariants('隆兴通宝');
}

// 隆兴重宝
c = findCoin(NS, '隆兴重宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铁钱';
  c.detail.variantsTable = songTieVariants('隆兴重宝', [
    { variant: '折二铁钱', description: '折二型铁钱', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '折二铁钱' },
  ]);
}

// 乾道元宝
c = findCoin(NS, '乾道元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铁钱背面偶有星纹';
  c.detail.variantsTable = songTieVariants('乾道元宝', [
    { variant: '小平铜钱', description: '铜质小平，存世较少', grade: '七级（甚少） 美品', priceRange: '200—800元', notes: '铜钱较少' },
    { variant: '折二铜钱 篆书', description: '折二型铜钱篆书', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '折二铜钱' },
    { variant: '折二铜钱 楷书', description: '折二型铜钱楷书', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '折二铜钱' },
  ]);
}

// 乾道通宝
c = findCoin(NS, '乾道通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铁钱为主';
  c.detail.variantsTable = songTieVariants('乾道通宝');
}

// 乾道重宝
c = findCoin(NS, '乾道重宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铁钱';
  c.detail.variantsTable = songTieVariants('乾道重宝');
}

// 纯熙元宝
c = findCoin(NS, '纯熙元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背）';
  c.detail.variantsTable = [
    { variant: '铁钱（普通版）', description: '面文"纯熙元宝"，铁质', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '年号仅用6天，极稀' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '10,000—30,000元', notes: '铁母极罕' },
  ];
}

// 淳熙通宝 - 纪年钱开始
c = findCoin(NS, '淳熙通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：淳熙七年起铸行纪年钱，背面穿上有纪年数字（七至十六），此前为光背；铁钱背面亦有纪年';
  c.detail.variantsTable = jishuVariants('淳熙通宝', '七', '十六', [
    { variant: '小平铜钱（光背，早期）', description: '淳熙七年以前铸行，光背无文', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '光背版' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '用铁钱范铸造的铜钱', grade: '七级（甚少） 美品', priceRange: '500—3,000元', notes: '铁范铜' },
  ]);
}

// 绍熙元宝
c = findCoin(NS, '绍熙元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至五），铜钱纪年；铁钱背面纪年';
  c.detail.variantsTable = jishuVariants('绍熙元宝', '元', '五', [
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—3,000元', notes: '铁范铜' },
  ]);
}

// 绍熙通宝
c = findCoin(NS, '绍熙通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至五），铁钱为主';
  c.detail.variantsTable = songTieVariants('绍熙通宝', [
    { variant: '纪年铁钱', description: '背面穿上有纪年数字', grade: '八级（较多） 美品', priceRange: '20—100元', notes: '纪年铁钱' },
  ]);
}

// 庆元通宝
c = findCoin(NS, '庆元通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至六），铜钱纪年；铁钱背面纪年或纪监';
  c.detail.variantsTable = jishuVariants('庆元通宝', '元', '六', [
    { variant: '折三型', description: '折三型铜钱', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '折三型较少' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ]);
}

// 庆元元宝
c = findCoin(NS, '庆元元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字，铁钱为主';
  c.detail.variantsTable = songTieVariants('庆元元宝', [
    { variant: '纪年铁钱', description: '背面穿上有纪年数字', grade: '八级（较多） 美品', priceRange: '20—100元', notes: '纪年铁钱' },
  ]);
}

// 嘉泰通宝
c = findCoin(NS, '嘉泰通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至四），铜钱纪年；铁钱背面纪年';
  c.detail.variantsTable = jishuVariants('嘉泰通宝', '元', '四', [
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ]);
}

// 嘉泰元宝
c = findCoin(NS, '嘉泰元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字，铁钱为主';
  c.detail.variantsTable = songTieVariants('嘉泰元宝');
}

// 开禧通宝
c = findCoin(NS, '开禧通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至三），铜钱纪年；铁钱背面纪年';
  c.detail.variantsTable = jishuVariants('开禧通宝', '元', '三', [
    { variant: '折三型', description: '折三型铜钱', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '折三型较少' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ]);
}

// 开禧元宝
c = findCoin(NS, '开禧元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字，铁钱为主';
  c.detail.variantsTable = songTieVariants('开禧元宝');
}

// 圣宋重宝
c = findCoin(NS, '圣宋重宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铁钱';
  c.detail.variantsTable = songTieVariants('圣宋重宝');
}

// 嘉定系列 - 铁钱为主
const jiadingCoins = ['嘉定通宝','嘉定元宝','嘉定重宝','嘉定崇宝','嘉定正宝','嘉定全宝','嘉定永宝','嘉定安宝','嘉定真宝','嘉定之宝','嘉定万宝','嘉定隆宝','嘉定洪宝','嘉定新宝','嘉定泉宝','嘉定大宝','嘉定珍宝','嘉定至宝','嘉定兴宝','嘉定封宝'];
for (const name of jiadingCoins) {
  c = findCoin(NS, name);
  if (c) {
    const isTongbao = name === '嘉定通宝';
    const isYuanbao = name === '嘉定元宝';
    const isZhongbao = name === '嘉定重宝';

    if (isTongbao) {
      c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至十七），铜钱纪年；铁钱背面纪年或纪监';
      c.detail.variantsTable = jishuVariants('嘉定通宝', '元', '十七', [
        { variant: '折二铜钱（纪年）', description: '折二型纪年铜钱', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '折二纪年' },
        { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
      ]);
    } else if (isYuanbao) {
      c.detail.reverseFeatures = '- 背面：穿上有纪年数字，铁钱为主，铜钱极少';
      c.detail.variantsTable = songTieVariants('嘉定元宝', [
        { variant: '小平铜钱', description: '铜质小平，存世极少', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '铜钱极少' },
      ]);
    } else if (isZhongbao) {
      c.detail.reverseFeatures = '- 背面：穿上有纪年数字，铁钱为主';
      c.detail.variantsTable = songTieVariants('嘉定重宝');
    } else {
      // 嘉定X宝 - 铁钱专用年号
      c.detail.reverseFeatures = '- 背面：光素无文或纪监文字，铁钱';
      c.detail.variantsTable = songTieVariants(name);
    }
  }
}

// 大宋通宝
c = findCoin(NS, '大宋通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿下"当拾"纪值文字';
  c.detail.variantsTable = [
    { variant: '当拾大钱', description: '面文"大宋通宝"，背穿下"当拾"，铜质精良', grade: '一级（大珍） 美品', priceRange: '200,000—500,000元', notes: '古钱五十名珍之一' },
  ];
}

// 大宋元宝
c = findCoin(NS, '大宋元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字，铁钱为主';
  c.detail.variantsTable = songTieVariants('大宋元宝');
}

// 宝庆元宝
c = findCoin(NS, '宝庆元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元），铁钱为主';
  c.detail.variantsTable = songTieVariants('宝庆元宝');
}

// 绍定通宝
c = findCoin(NS, '绍定通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至六），铜钱纪年；铁钱背面纪年';
  c.detail.variantsTable = jishuVariants('绍定通宝', '元', '六');
}

// 绍定元宝
c = findCoin(NS, '绍定元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字，铁钱为主';
  c.detail.variantsTable = songTieVariants('绍定元宝');
}

// 端平通宝
c = findCoin(NS, '端平通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至三），铜钱纪年';
  c.detail.variantsTable = jishuVariants('端平通宝', '元', '三', [
    { variant: '折五型', description: '折五型铜钱', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '折五型' },
  ]);
}

// 端平元宝
c = findCoin(NS, '端平元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字，铁钱为主';
  c.detail.variantsTable = songTieVariants('端平元宝');
}

// 端平重宝
c = findCoin(NS, '端平重宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铁钱';
  c.detail.variantsTable = songTieVariants('端平重宝');
}

// 嘉熙通宝
c = findCoin(NS, '嘉熙通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至四），铜钱纪年；铁钱背面纪年';
  c.detail.variantsTable = jishuVariants('嘉熙通宝', '元', '四');
}

// 嘉熙重宝
c = findCoin(NS, '嘉熙重宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铁钱';
  c.detail.variantsTable = songTieVariants('嘉熙重宝');
}

// 淳佑通宝 / 淳祐通宝 / 淳祐元宝
for (const name of ['淳佑通宝', '淳祐元宝', '淳祐通宝']) {
  c = findCoin(NS, name);
  if (c) {
    c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至十二），铜钱纪年；铁钱背面纪年';
    c.detail.variantsTable = jishuVariants(name, '元', '十二', [
      { variant: '折二铜钱（纪年）', description: '折二型纪年铜钱', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '折二纪年' },
    ]);
  }
}

// 皇宋元宝
c = findCoin(NS, '皇宋元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至六），铜钱纪年';
  c.detail.variantsTable = jishuVariants('皇宋元宝', '元', '六');
}

// 开庆通宝
c = findCoin(NS, '开庆通宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元），年号仅用一年';
  c.detail.variantsTable = [
    { variant: '小平铜钱（纪年）', description: '面文"开庆通宝"，背面穿上"元"字', grade: '八级（较多） 普品', priceRange: '10—30元', notes: '年号仅一年' },
    { variant: '小平铜钱（纪年）', description: '美品', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '美品' },
    { variant: '折二铜钱（纪年）', description: '折二型', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '折二型' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ];
}

// 景定元宝
c = findCoin(NS, '景定元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至五），铜钱纪年';
  c.detail.variantsTable = jishuVariants('景定元宝', '元', '五');
}

// 咸淳元宝
c = findCoin(NS, '咸淳元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：穿上有纪年数字（元至八），铜钱纪年，为南宋最后的纪年钱';
  c.detail.variantsTable = jishuVariants('咸淳元宝', '元', '八', [
    { variant: '折二铜钱（纪年）', description: '折二型纪年铜钱', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '折二纪年' },
  ]);
}

// Also update 绍兴元宝 if exists
c = findCoin(NS, '绍兴元宝');
if (c) {
  c.detail.reverseFeatures = '- 背面：光素无文（光背），铜钱较少，铁钱较多';
  c.detail.variantsTable = songTongVariants('绍兴元宝', [
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ]);
}

writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Southern Song dynasty corrections applied!');
