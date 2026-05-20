import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));

function findCoin(dynastyName, coinName) {
  const dynasty = data.find(d => d.dynasty === dynastyName);
  if (!dynasty) return null;
  return dynasty.coins.find(c => c.name === coinName) || null;
}

const BS = '北宋钱币';

// Common variant template for Northern Song 铜钱 with 篆楷对钱
function bsDuiqian(name, extra = []) {
  return [
    { variant: '小平篆书', description: `面文"${name}"四字篆书，旋读`, grade: '九级（多） 普品', priceRange: '3—10元', notes: '篆书对钱' },
    { variant: '小平楷书', description: `面文"${name}"四字楷书，旋读`, grade: '九级（多） 普品', priceRange: '3—10元', notes: '楷书对钱' },
    { variant: '小平 美品', description: '品相上佳', grade: '九级（多） 美品', priceRange: '10—30元', notes: '美品' },
    { variant: '折二型', description: '折二型，直径约2.8cm', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '折二型' },
    { variant: '大字版', description: '面文较大，笔画粗壮', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '大字版' },
    { variant: '阔缘版', description: '外廓较宽', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '阔缘' },
    ...extra,
  ];
}

// 咸平元宝
let c = findCoin(BS, '咸平元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('咸平元宝', [
    { variant: '阔咸版', description: '"咸"字较阔', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '阔咸版' },
    { variant: '铁母', description: '铜质母钱，铸工极精', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ]);
}

// 景德元宝
c = findCoin(BS, '景德元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('景德元宝', [
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ]);
}

// 祥符通宝
c = findCoin(BS, '祥符通宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('祥符通宝', [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '大字版' },
    { variant: '阔缘版', description: '外廓较宽', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '阔缘' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ]);
}

// 祥符元宝
c = findCoin(BS, '祥符元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('祥符元宝', [
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ]);
}

// 天禧通宝
c = findCoin(BS, '天禧通宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('天禧通宝', [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '大字版' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ]);
}

// 天圣元宝
c = findCoin(BS, '天圣元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('天圣元宝', [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '大字版' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '用铁钱范铸造的铜钱', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '铁范铜' },
  ]);
}

// 明道元宝
c = findCoin(BS, '明道元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('明道元宝', [
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '大字版' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ]);
}

// 景祐元宝
c = findCoin(BS, '景祐元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('景祐元宝', [
    { variant: '长祐版', description: '"祐"字较长', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '长祐版' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '铁范铜' },
  ]);
}

// 至和元宝
c = findCoin(BS, '至和元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('至和元宝', [
    { variant: '阔和版', description: '"和"字较阔', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '阔和版' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '铁范铜' },
  ]);
}

// 至和通宝
c = findCoin(BS, '至和通宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('至和通宝', [
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ]);
}

// 嘉祐元宝
c = findCoin(BS, '嘉祐元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('嘉祐元宝', [
    { variant: '阔祐版', description: '"祐"字较阔', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '阔祐版' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '铁范铜' },
  ]);
}

// 嘉祐通宝
c = findCoin(BS, '嘉祐通宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('嘉祐通宝', [
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '铁范铜' },
  ]);
}

// 嘉祐重宝
c = findCoin(BS, '嘉祐重宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '铁钱（普通版）', description: '面文"嘉祐重宝"，铁质', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '铁钱' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ];
}

// 治平元宝
c = findCoin(BS, '治平元宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('治平元宝', [
    { variant: '四出纹版', description: '穿四角有决纹延伸至外廓', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '四出纹版' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '铁范铜' },
  ]);
}

// 治平通宝
c = findCoin(BS, '治平通宝');
if (c) {
  c.detail.variantsTable = bsDuiqian('治平通宝', [
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '铁范铜' },
  ]);
}

// 熙宁通宝
c = findCoin(BS, '熙宁通宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平楷书', description: '面文"熙宁通宝"四字楷书，对读', grade: '八级（较多） 普品', priceRange: '5—15元', notes: '楷书版' },
    { variant: '小平楷书 美品', description: '品相上佳', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '美品' },
    { variant: '折二型', description: '折二型，直径约2.8cm', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '折二型' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '铁范铜' },
  ];
}

// 熙宁重宝
c = findCoin(BS, '熙宁重宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '折二篆书', description: '面文"熙宁重宝"四字篆书，对读', grade: '九级（多） 普品', priceRange: '3—10元', notes: '篆书折二' },
    { variant: '折二楷书', description: '面文"熙宁重宝"四字楷书，对读', grade: '九级（多） 普品', priceRange: '3—10元', notes: '楷书折二' },
    { variant: '折二 美品', description: '品相上佳', grade: '九级（多） 美品', priceRange: '10—30元', notes: '美品' },
    { variant: '阔缘版', description: '外廓较宽', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '阔缘' },
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '大字版' },
    { variant: '铁母', description: '铜质母钱', grade: '三级（罕贵） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
    { variant: '铁钱版', description: '铁质折二钱', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '铁钱' },
  ];
}

// 元丰重宝
c = findCoin(BS, '元丰重宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '铁钱（普通版）', description: '面文"元丰重宝"四字，铁质', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '铁钱' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '30,000—80,000元', notes: '铁母极罕' },
  ];
}

// 绍圣元宝
c = findCoin(BS, '绍圣元宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平篆书', description: '面文"绍圣元宝"四字篆书，旋读', grade: '九级（多） 普品', priceRange: '3—10元', notes: '篆书对钱' },
    { variant: '小平行书', description: '面文"绍圣元宝"四字行书，旋读', grade: '九级（多） 普品', priceRange: '3—10元', notes: '行书对钱' },
    { variant: '小平 美品', description: '品相上佳', grade: '九级（多） 美品', priceRange: '10—30元', notes: '美品' },
    { variant: '折二篆书', description: '折二型篆书', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '折二篆书' },
    { variant: '折二行书', description: '折二型行书', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '折二行书' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—3,000元', notes: '铁范铜' },
    { variant: '隶书版', description: '面文隶书，名誉版', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '隶书版名品' },
  ];
}

// 绍圣通宝
c = findCoin(BS, '绍圣通宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平楷书', description: '面文"绍圣通宝"四字楷书，对读', grade: '八级（较多） 普品', priceRange: '10—30元', notes: '楷书版' },
    { variant: '小平 美品', description: '品相上佳', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '美品' },
    { variant: '折二型', description: '折二型', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '折二型较少' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ];
}

// 绍圣重宝
c = findCoin(BS, '绍圣重宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '铁钱', description: '面文"绍圣重宝"四字，铁质', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '铁钱' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ];
}

// 元符通宝
c = findCoin(BS, '元符通宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平篆书', description: '面文"元符通宝"四字篆书，对读', grade: '九级（多） 普品', priceRange: '3—10元', notes: '篆书对钱' },
    { variant: '小平行书', description: '面文"元符通宝"四字行书，对读', grade: '九级（多） 普品', priceRange: '3—10元', notes: '行书对钱' },
    { variant: '小平 美品', description: '品相上佳', grade: '九级（多） 美品', priceRange: '10—30元', notes: '美品' },
    { variant: '折二篆书', description: '折二型篆书', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '折二篆书' },
    { variant: '折二行书', description: '折二型行书', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '折二行书' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—3,000元', notes: '铁范铜' },
    { variant: '行书大字版', description: '行书大字，名誉版', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '大字版名品' },
  ];
}

// 元符重宝
c = findCoin(BS, '元符重宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '铁钱', description: '面文"元符重宝"四字，铁质', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '铁钱' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ];
}

// 圣宋通宝
c = findCoin(BS, '圣宋通宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平楷书', description: '面文"圣宋通宝"四字楷书，对读', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '楷书版，较元宝少见' },
    { variant: '小平篆书', description: '面文"圣宋通宝"四字篆书，对读', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '篆书版' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '10,000—30,000元', notes: '铁母极罕' },
    { variant: '长冠版', description: '"宝"字宝盖较长，名誉版', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '长冠版名品' },
  ];
}

// 建国通宝
c = findCoin(BS, '建国通宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平钱', description: '面文"建国通宝"四字楷书，对读', grade: '一级（大珍） 美品', priceRange: '500,000—2,000,000元', notes: '存世极罕，仅数枚' },
  ];
}

// 政和通宝
c = findCoin(BS, '政和通宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平篆书', description: '面文"政和通宝"四字篆书，旋读', grade: '九级（多） 普品', priceRange: '3—10元', notes: '篆书对钱' },
    { variant: '小平隶书', description: '面文"政和通宝"四字隶书，旋读', grade: '九级（多） 普品', priceRange: '3—10元', notes: '隶书对钱' },
    { variant: '小平 美品', description: '品相上佳', grade: '九级（多） 美品', priceRange: '10—30元', notes: '美品' },
    { variant: '折二篆书', description: '折二型篆书', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '折二篆书' },
    { variant: '折二隶书', description: '折二型隶书', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '折二隶书' },
    { variant: '文政版', description: '"政"字反文旁为"文"，名誉版', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '文政版名品' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
    { variant: '铁范铜', description: '铁范铜', grade: '七级（甚少） 美品', priceRange: '500—3,000元', notes: '铁范铜' },
  ];
}

// 政和重宝
c = findCoin(BS, '政和重宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '铁钱（普通版）', description: '面文"政和重宝"四字，铁质', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '铁钱' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ];
}

// 宣和元宝
c = findCoin(BS, '宣和元宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平篆书', description: '面文"宣和元宝"四字篆书，旋读', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '篆书版' },
    { variant: '小平隶书', description: '面文"宣和元宝"四字隶书，旋读', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '隶书版' },
    { variant: '折二型', description: '折二型', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '折二较少' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '5,000—20,000元', notes: '铁母极罕' },
  ];
}

// 靖康元宝
c = findCoin(BS, '靖康元宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平篆书', description: '面文"靖康元宝"四字篆书，旋读', grade: '一级（大珍） 美品', priceRange: '100,000—500,000元', notes: '北宋最珍稀年号钱' },
  ];
}

// 皇祐元宝
c = findCoin(BS, '皇祐元宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平钱', description: '面文"皇祐元宝"四字', grade: '一级（大珍） 美品', priceRange: '200,000—800,000元', notes: '存世极罕' },
  ];
}

// 庆历直十
c = findCoin(BS, '庆历直十');
if (c) {
  c.detail.variantsTable = [
    { variant: '铁钱（普通版）', description: '面文"庆历直十"，铁质，折十型', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '铁钱折十' },
    { variant: '铁母', description: '铜质母钱', grade: '二级（珍） 美品', priceRange: '20,000—50,000元', notes: '铁母极罕' },
  ];
}

// 应运元宝
c = findCoin(BS, '应运元宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平钱', description: '面文"应运元宝"四字楷书，旋读，李顺起义军铸', grade: '一级（大珍） 美品', priceRange: '100,000—300,000元', notes: '农民起义钱，极罕' },
  ];
}

// 应运钱
c = findCoin(BS, '应运钱');
if (c) {
  c.detail.variantsTable = [
    { variant: '铁钱', description: '铁质，李顺起义军铸', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '铁钱较少' },
    { variant: '铜钱', description: '铜质，极罕', grade: '二级（珍） 美品', priceRange: '50,000—150,000元', notes: '铜钱极罕' },
  ];
}

// 应感通宝
c = findCoin(BS, '应感通宝');
if (c) {
  c.detail.variantsTable = [
    { variant: '小平钱', description: '面文"应感通宝"四字楷书，对读', grade: '一级（大珍） 美品', priceRange: '100,000—300,000元', notes: '王小波李顺起义钱，极罕' },
  ];
}

// 应感钱
c = findCoin(BS, '应感钱');
if (c) {
  c.detail.variantsTable = [
    { variant: '铁钱', description: '铁质，起义军铸', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '铁钱' },
    { variant: '铜钱', description: '铜质，极罕', grade: '二级（珍） 美品', priceRange: '50,000—150,000元', notes: '铜钱极罕' },
  ];
}

writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Northern Song corrections applied!');
