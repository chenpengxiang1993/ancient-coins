import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));

function findCoin(dynastyName, coinName) {
  const dynasty = data.find(d => d.dynasty === dynastyName);
  if (!dynasty) return null;
  return dynasty.coins.find(c => c.name === coinName) || null;
}

// =============================================
// 明朝钱币 corrections
// =============================================

// 1. 大中通宝 - Add regional mint variants
const dazhong = findCoin('明朝钱币', '大中通宝');
if (dazhong) {
  dazhong.detail.variantsTable = [
    { variant: '小平光背（京版/南京版）', description: '中央标准版，光背无文', grade: '八级（较多） 普品', priceRange: '50—150元', notes: '京版最常见' },
    { variant: '小平光背（京版/南京版）', description: '中央标准版', grade: '八级（较多） 美品', priceRange: '100—300元', notes: '品相上佳' },
    { variant: '小平背"浙"', description: '浙江铸局，背面"浙"字', grade: '八级（较多） 美品', priceRange: '100—300元', notes: '较常见纪地版' },
    { variant: '小平背"福"/背"桂"', description: '福建、广西铸局', grade: '七级（甚少） 美品', priceRange: '300—800元', notes: '较少见' },
    { variant: '小平背"鄂"', description: '武昌铸局', grade: '七级（甚少） 美品', priceRange: '500—1,500元', notes: '较少' },
    { variant: '小平背"广"/背"豫"', description: '广东、河南铸局', grade: '六级（稀） 美品', priceRange: '1,000—3,000元', notes: '稀少' },
    { variant: '小平背"济"/背"北平"', description: '济南、北京铸局', grade: '五级（稀贵） 美品', priceRange: '2,000—5,000元', notes: '稀少' },
    { variant: '凤阳版 小平', description: '朱元璋故乡凤阳铸', grade: '七级（甚少） 美品', priceRange: '300—800元', notes: '凤阳铸' },
    { variant: '折二 美品', description: '折二型，直径约2.8cm', grade: '八级（较多） 美品', priceRange: '200—500元', notes: '折二型' },
    { variant: '折三 美品', description: '折三型', grade: '七级（甚少） 美品', priceRange: '300—800元', notes: '折三型' },
    { variant: '折五 美品', description: '折五型', grade: '七级（甚少） 美品', priceRange: '500—1,500元', notes: '折五型' },
    { variant: '当十 美品', description: '当十型，大型钱', grade: '六级（稀） 美品', priceRange: '1,000—3,000元', notes: '当十型' },
  ];
}

// 2. 洪武通宝 - Add complete nine bureau system
const hongwu = findCoin('明朝钱币', '洪武通宝');
if (hongwu) {
  hongwu.detail.variantsTable = [
    { variant: '小平光背（京版/南京版）', description: '中央标准版，光背无文', grade: '八级（较多） 普品', priceRange: '20—50元', notes: '京版最常见' },
    { variant: '小平光背（京版/南京版）', description: '中央标准版', grade: '八级（较多） 美品', priceRange: '50—150元', notes: '品相上佳' },
    { variant: '小平背纪重', description: '背面铸纪重文字，如"一钱""二钱"等', grade: '八级（较多） 美品', priceRange: '100—300元', notes: '纪重版' },
    { variant: '背"浙"系列', description: '浙江铸局，各折值均有', grade: '八级（较多） 美品', priceRange: '500—2,000元', notes: '浙江铸，较常见' },
    { variant: '背"京"系列', description: '南京铸局，折二至折十', grade: '七级（甚少） 美品', priceRange: '2,000—8,000元', notes: '南京铸' },
    { variant: '背"鄂"系列', description: '武昌铸局', grade: '七级（甚少） 美品', priceRange: '2,500—10,000元', notes: '武昌铸' },
    { variant: '背"济"系列', description: '济南铸局', grade: '六级（稀） 美品', priceRange: '3,000—15,000元', notes: '济南铸，稀少' },
    { variant: '背"桂"系列', description: '桂林铸局', grade: '六级（稀） 美品', priceRange: '5,000—20,000元', notes: '桂林铸，折二尤罕' },
    { variant: '背"福"系列', description: '福州铸局', grade: '五级（稀贵） 美品', priceRange: '8,000—30,000元', notes: '福建铸，名品' },
    { variant: '背"豫"系列', description: '河南铸局', grade: '六级（稀） 美品', priceRange: '3,000—10,000元', notes: '河南铸' },
    { variant: '背"广"系列', description: '广东铸局', grade: '六级（稀） 美品', priceRange: '3,000—10,000元', notes: '广东铸' },
    { variant: '背"北平"系列', description: '北京铸局', grade: '六级（稀） 美品', priceRange: '3,000—10,000元', notes: '北京铸' },
    { variant: '折二 美品', description: '折二型', grade: '八级（较多） 美品', priceRange: '100—300元', notes: '折二型' },
    { variant: '折三 美品', description: '折三型', grade: '八级（较多） 美品', priceRange: '150—400元', notes: '折三型' },
    { variant: '折五 美品', description: '折五型', grade: '七级（甚少） 美品', priceRange: '300—800元', notes: '折五型' },
    { variant: '折十 美品', description: '折十型，大型钱', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '折十型' },
  ];
}

// 3. 洪熙通宝 - Fix (extremely rare, only a few known)
const hongxi = findCoin('明朝钱币', '洪熙通宝');
if (hongxi) {
  hongxi.summary.estimatedValue = '50,000—150,000元';
  hongxi.detail.variantsTable = [
    { variant: '小平钱', description: '面文"洪熙通宝"四字楷书，对读，铸工精整', grade: '一级（大珍） 美品', priceRange: '50,000—100,000元', notes: '存世极少，仅数枚' },
    { variant: '小平钱', description: '面文"洪熙通宝"四字楷书', grade: '一级（大珍） 极美品', priceRange: '100,000—150,000元', notes: '极美品罕见' },
  ];
}

// 4. 永乐通宝 - Add variants
const yongle = findCoin('明朝钱币', '永乐通宝');
if (yongle) {
  yongle.detail.variantsTable = [
    { variant: '标准版', description: '面文"永乐通宝"四字楷书，对读，铸工精整', grade: '九级（多） 普品', priceRange: '5—15元', notes: '较常见' },
    { variant: '标准版', description: '面文"永乐通宝"', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大字版' },
    { variant: '折三型', description: '折三型，较少', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '折三型稀少' },
  ];
}

// 5. 宣德通宝 - Add variants
const xuande = findCoin('明朝钱币', '宣德通宝');
if (xuande) {
  xuande.detail.variantsTable = [
    { variant: '标准版', description: '面文"宣德通宝"四字楷书，对读', grade: '九级（多） 普品', priceRange: '5—15元', notes: '较常见' },
    { variant: '标准版', description: '面文"宣德通宝"', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大字版' },
  ];
}

// 6. 弘治通宝 - Add variants
const hongzhi = findCoin('明朝钱币', '弘治通宝');
if (hongzhi) {
  hongzhi.detail.variantsTable = [
    { variant: '标准版', description: '面文"弘治通宝"四字楷书，对读', grade: '八级（较多） 普品', priceRange: '10—30元', notes: '较常见' },
    { variant: '标准版', description: '面文"弘治通宝"', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '品相上佳' },
    { variant: '大字版', description: '面文较大', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '大字版' },
  ];
}

// 7. 嘉靖通宝 - Add variants
const jiajing = findCoin('明朝钱币', '嘉靖通宝');
if (jiajing) {
  jiajing.detail.variantsTable = [
    { variant: '标准版', description: '面文"嘉靖通宝"四字楷书，对读', grade: '九级（多） 普品', priceRange: '5—15元', notes: '较常见' },
    { variant: '标准版', description: '面文"嘉靖通宝"', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大字版' },
    { variant: '折五型', description: '折五型大钱', grade: '五级（稀贵） 美品', priceRange: '5,000—15,000元', notes: '折五大钱稀少' },
  ];
}

// 8. 隆庆通宝 - Add variants
const longqing = findCoin('明朝钱币', '隆庆通宝');
if (longqing) {
  longqing.detail.variantsTable = [
    { variant: '标准版', description: '面文"隆庆通宝"四字楷书，对读，铸工精整', grade: '七级（甚少） 普品', priceRange: '100—300元', notes: '隆庆铸期短，存世较少' },
    { variant: '标准版', description: '面文"隆庆通宝"', grade: '七级（甚少） 美品', priceRange: '300—800元', notes: '品相上佳' },
    { variant: '标准版', description: '面文"隆庆通宝"', grade: '六级（稀） 极美品', priceRange: '800—2,000元', notes: '品相极佳' },
  ];
}

// 9. 万历通宝 - Add variants
const wanli = findCoin('明朝钱币', '万历通宝');
if (wanli) {
  wanli.detail.variantsTable = [
    { variant: '标准版', description: '面文"万历通宝"四字楷书，对读', grade: '九级（多） 普品', priceRange: '5—15元', notes: '较常见' },
    { variant: '标准版', description: '面文"万历通宝"', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大字版' },
    { variant: '折二型', description: '折二型', grade: '七级（甚少） 美品', priceRange: '200—500元', notes: '折二型较少' },
    { variant: '矿银版', description: '矿银铸钱，铜质精良', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '矿银版' },
  ];
}

// 10. 泰昌通宝 - Add variants
const taichang = findCoin('明朝钱币', '泰昌通宝');
if (taichang) {
  taichang.detail.variantsTable = [
    { variant: '标准版', description: '面文"泰昌通宝"四字楷书，对读', grade: '九级（多） 普品', priceRange: '5—15元', notes: '较常见' },
    { variant: '标准版', description: '面文"泰昌通宝"', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '大字版', description: '面文较大', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '大字版' },
    { variant: '心泰版', description: '"泰"字上部"三"连写似"心"字', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '心泰版名品' },
    { variant: '双点通版', description: '"通"字双点走之', grade: '七级（甚少） 美品', priceRange: '100—300元', notes: '双点通' },
  ];
}

// 11. 天启通宝 - Add complete variant categories
const tianqi = findCoin('明朝钱币', '天启通宝');
if (tianqi) {
  tianqi.detail.variantsTable = [
    { variant: '小平光背', description: '面文"天启通宝"四字楷书，对读，光背无文', grade: '九级（多） 普品', priceRange: '5—15元', notes: '最常见' },
    { variant: '小平光背', description: '面文"天启通宝"', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '小平背纪局', description: '背面铸纪局文字，如"工""户"等', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '纪局版' },
    { variant: '小平背"浙"', description: '浙江铸局', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '浙江纪地' },
    { variant: '折十（普通版）', description: '折十型大钱，面文"天启通宝"', grade: '八级（较多） 美品', priceRange: '200—500元', notes: '折十型' },
    { variant: '折十（大字版/阔缘版）', description: '折十大字或阔缘版', grade: '七级（甚少） 美品', priceRange: '500—1,500元', notes: '名版' },
    { variant: '折十背星月', description: '折十型背面铸星月纹', grade: '七级（甚少） 美品', priceRange: '300—800元', notes: '星月纹' },
    { variant: '合背版', description: '两面均为面文，属铸造错误', grade: '七级（甚少） 极美品', priceRange: '500—2,000元', notes: '合背版' },
  ];
}

// 12. 崇祯通宝 - Add complete variant categories
const chongzhen = findCoin('明朝钱币', '崇祯通宝');
if (chongzhen) {
  chongzhen.detail.variantsTable = [
    { variant: '光背', description: '面文"崇祯通宝"四字楷书，对读，光背无文', grade: '九级（多） 普品', priceRange: '5—15元', notes: '最常见' },
    { variant: '光背', description: '光背无文', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '背"户"', description: '背面"户"字，户部铸', grade: '八级（较多） 美品', priceRange: '20—60元', notes: '户部' },
    { variant: '背"工"', description: '背面"工"字，工部铸', grade: '八级（较多） 美品', priceRange: '20—60元', notes: '工部' },
    { variant: '背"兵"', description: '背面"兵"字，兵部铸', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '兵部' },
    { variant: '背"江"/背"广"', description: '纪地版', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '纪地版' },
    { variant: '背"一分"', description: '纪值版，背面"一分"', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '纪值' },
    { variant: '背"八厘"', description: '纪值版，背面"八厘"', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '纪值' },
    { variant: '背星', description: '背面铸星纹', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '星纹' },
    { variant: '背月', description: '背面铸月纹', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '月纹' },
    { variant: '背星月', description: '背面铸星月纹', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '星月纹' },
    { variant: '背天干（甲、乙、丙等）', description: '背面铸天干文字', grade: '九级（多） 美品', priceRange: '30—100元', notes: '天干纪号' },
    { variant: '跑马崇祯', description: '背面铸奔马图案，名品', grade: '七级（甚少） 美品', priceRange: '600—1,200元', notes: '奔马图案名品' },
    { variant: '跑马崇祯', description: '背面铸奔马图案', grade: '六级（稀） 极美品', priceRange: '1,200—2,500元', notes: '极美品' },
    { variant: '折二光背', description: '折二型，光背', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '折二型' },
    { variant: '大字版', description: '面文大字版', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '大字版' },
    { variant: '合背版', description: '两面均为面文', grade: '七级（甚少） 极美品', priceRange: '500—2,000元', notes: '合背版' },
    { variant: '母钱', description: '翻铸母钱', grade: '六级（稀） 美品以上', priceRange: '3,000—10,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
  ];
}

writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Ming dynasty corrections applied!');
