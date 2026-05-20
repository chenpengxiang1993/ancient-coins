import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));

function findCoin(dynastyName, coinName) {
  const dynasty = data.find(d => d.dynasty === dynastyName);
  if (!dynasty) return null;
  return dynasty.coins.find(c => c.name === coinName) || null;
}

// =============================================
// 清朝钱币 corrections
// =============================================

// 1. 天命通宝 - Fix rarity and variants
const tianming = findCoin('清朝钱币', '天命通宝');
if (tianming) {
  tianming.summary.rarity = '六级（稀）';
  tianming.summary.estimatedValue = '200—3,000元';
  tianming.detail.variantsTable = [
    { variant: '汉文小平', description: '面文"天命通宝"四字楷书，对读，铜质精良', grade: '六级（稀） 普品', priceRange: '200—500元', notes: '开国钱币，铸量有限' },
    { variant: '汉文小平', description: '面文"天命通宝"四字楷书，对读，铜质精良', grade: '六级（稀） 美品', priceRange: '500—1,500元', notes: '品相上佳' },
    { variant: '汉文小平', description: '面文"天命通宝"四字楷书，对读', grade: '六级（稀） 极美品', priceRange: '1,500—3,000元', notes: '品相极佳' },
    { variant: '满文小平', description: '面文满文"天命汗钱"，无汉文', grade: '七级（甚少） 美品', priceRange: '400—1,200元', notes: '满文版略多于汉文版' },
    { variant: '满文小平', description: '面文满文"天命汗钱"', grade: '七级（甚少） 极美品', priceRange: '1,200—2,500元', notes: '品相极佳' },
    { variant: '大字版', description: '汉文大字版，文字较大', grade: '五级（稀贵） 极美品', priceRange: '2,000—5,000元', notes: '大字版较少' },
  ];
}

// 2. 天聪通宝 - Fix rarity and variants
const tiancong = findCoin('清朝钱币', '天聪通宝');
if (tiancong) {
  tiancong.summary.rarity = '五级（稀贵）';
  tiancong.summary.estimatedValue = '3,000—20,000元';
  tiancong.detail.variantsTable = [
    { variant: '满文折十', description: '面文满文"天聪汗钱"，折十型，铜质精良', grade: '五级（稀贵） 美品', priceRange: '3,000—8,000元', notes: '存世较少' },
    { variant: '满文折十', description: '面文满文"天聪汗钱"，折十型', grade: '五级（稀贵） 极美品', priceRange: '8,000—20,000元', notes: '品相极佳' },
  ];
}

// 3. 顺治通宝 - Restructure into Five Styles system
const shunzhi = findCoin('清朝钱币', '顺治通宝');
if (shunzhi) {
  shunzhi.detail.variantsTable = [
    { variant: '一式：仿明式（光背）', description: '顺治元年至七年铸行，光背或背星、圈纹，仿明朝制式', grade: '八级（较多） 普品', priceRange: '20—50元', notes: '最常见版式' },
    { variant: '一式：仿明式（光背）', description: '顺治元年至七年铸行，光背或背星、圈纹', grade: '八级（较多） 美品', priceRange: '50—150元', notes: '品相上佳' },
    { variant: '一式：背星/圈纹', description: '背面铸星纹或圈纹', grade: '七级（甚少） 美品', priceRange: '100—300元', notes: '有纹饰版较少' },
    { variant: '二式：汉字纪局式（常见局）', description: '背铸单一汉字纪局，常见：户、工、浙、东、河等', grade: '八级（较多） 美品', priceRange: '100—300元', notes: '汉字纪局' },
    { variant: '二式：汉字纪局式（少见局）', description: '较少局名：荆、阳、襄等', grade: '七级（甚少） 美品', priceRange: '300—800元', notes: '少见局名' },
    { variant: '二式：背"延"', description: '背右"延"字，极罕见', grade: '四级（罕） 美品', priceRange: '3,000—10,000元', notes: '延字版极罕' },
    { variant: '三式：一厘式（常见局）', description: '背穿右纪局、穿左"一厘"，常见局：户、工、浙、东、河、临等', grade: '八级（较多） 美品', priceRange: '50—150元', notes: '一厘纪值' },
    { variant: '三式：一厘式（较少局）', description: '较少局：宁、昌、福、陕、江、云等', grade: '七级（甚少） 美品', priceRange: '100—300元', notes: '较少局一厘' },
    { variant: '三式：一厘式（稀少局）', description: '稀少局：蓟、宣等', grade: '六级（稀） 美品', priceRange: '300—1,000元', notes: '稀少局一厘' },
    { variant: '四式：满文纪局式（宝泉局）', description: '背满文"宝泉"，顺治十四年始铸', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '满文宝泉' },
    { variant: '四式：满文纪局式（宝源局）', description: '背满文"宝源"', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '满文宝源' },
    { variant: '五式：满汉文纪局式（常见局）', description: '满汉文对照纪局，常见：东、河、浙、江', grade: '八级（较多） 美品', priceRange: '50—150元', notes: '满汉文常见局' },
    { variant: '五式：满汉文纪局式（较少局）', description: '较少：昌、原、蓟、临、陕', grade: '七级（甚少） 美品', priceRange: '150—500元', notes: '满汉文较少局' },
    { variant: '五式：满汉文纪局式（稀少局）', description: '稀少：同、宁、宣', grade: '五级（稀贵） 美品', priceRange: '2,000—5,000元', notes: '满汉文稀少局' },
    { variant: '五式：满汉文"福"', description: '福建局仅见数枚样钱，极罕', grade: '三级（罕贵） 美品', priceRange: '5,000—20,000元', notes: '福局极罕' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱，铸工极精', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕见' },
    { variant: '母钱', description: '翻铸母钱', grade: '五级（稀贵） 美品以上', priceRange: '5,000—20,000元', notes: '母钱稀少' },
  ];
}

// 4. 康熙通宝 - Fix 罗汉钱 grade, consolidate variants
const kangxi = findCoin('清朝钱币', '康熙通宝');
if (kangxi) {
  kangxi.detail.variantsTable = [
    { variant: '宝泉局（满文）', description: '户部中央局，背面满文"宝泉"', grade: '九级（多） 普品', priceRange: '10—20元', notes: '最常见' },
    { variant: '宝泉局（满文）', description: '户部中央局，背面满文"宝泉"', grade: '九级（多） 美品', priceRange: '30—60元', notes: '品相上佳' },
    { variant: '宝泉局（满文）', description: '户部中央局', grade: '九级（多） 极美品', priceRange: '80—200元', notes: '品相极佳' },
    { variant: '宝源局（满文）', description: '工部中央局，背面满文"宝源"', grade: '九级（多） 普品', priceRange: '10—20元', notes: '工部铸' },
    { variant: '宝源局（满文）', description: '工部中央局', grade: '九级（多） 美品', priceRange: '30—60元', notes: '品相上佳' },
    { variant: '满汉文常见局（同、东、江、苏、广、浙）', description: '六局存世量较大', grade: '九级（多） 美品', priceRange: '50—200元', notes: '常见地方局' },
    { variant: '满汉文较少局（福、宁、宣、原、蓟、昌、南、河、临、陕）', description: '十局存世量中等', grade: '八级（较多） 美品', priceRange: '100—400元', notes: '中等存世量' },
    { variant: '满汉文稀少局（桂、云）', description: '两局较稀少', grade: '七级（甚少） 美品', priceRange: '300—1,500元', notes: '稀少局' },
    { variant: '满汉文极稀少局（台、漳）', description: '台湾局铸期短存世极罕；漳州局亦稀少', grade: '五级（稀贵） 美品', priceRange: '2,000—8,000元', notes: '台、漳极罕' },
    { variant: '罗汉钱（普通版）', description: '"熙"字少一撇，"通"为单点通，铜质精良', grade: '七级（甚少） 美品', priceRange: '200—500元', notes: '罗汉钱名品' },
    { variant: '罗汉钱（普通版）', description: '"熙"字少一撇，"通"为单点通', grade: '七级（甚少） 极美品', priceRange: '500—1,500元', notes: '品相极佳' },
    { variant: '罗汉钱 大字版', description: '罗汉钱中的大字版', grade: '六级（稀） 美品', priceRange: '500—1,500元', notes: '大字罗汉' },
    { variant: '罗汉大样（宫钱类）', description: '大样罗汉，类宫钱', grade: '四级（罕） 美品', priceRange: '3,000—10,000元', notes: '宫钱类罗汉' },
    { variant: '背星月', description: '背面铸星纹或月纹', grade: '七级（甚少） 美品', priceRange: '50—150元', notes: '星月纹' },
    { variant: '大字版', description: '面文大字版', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '大字版' },
    { variant: '阔缘版', description: '钱缘较宽', grade: '八级（较多） 美品', priceRange: '30—80元', notes: '阔缘' },
    { variant: '母钱', description: '翻铸母钱', grade: '六级（稀） 美品以上', priceRange: '3,000—10,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
  ];
}

// 5. 雍正通宝 - Fix mint bureau grades and prices
const yongzheng = findCoin('清朝钱币', '雍正通宝');
if (yongzheng) {
  yongzheng.detail.variantsTable = [
    { variant: '宝泉局', description: '户部中央局，背面满文"宝泉"', grade: '八级（较多） 普品', priceRange: '30—80元', notes: '较常见' },
    { variant: '宝泉局', description: '户部中央局', grade: '八级（较多） 美品', priceRange: '80—200元', notes: '品相上佳' },
    { variant: '宝源局', description: '工部中央局，背面满文"宝源"', grade: '八级（较多） 普品', priceRange: '30—80元', notes: '工部铸' },
    { variant: '宝源局', description: '工部中央局', grade: '八级（较多） 美品', priceRange: '80—200元', notes: '品相上佳' },
    { variant: '宝苏局', description: '苏州铸局', grade: '八级（较多） 美品', priceRange: '100—300元', notes: '江苏铸' },
    { variant: '宝浙局', description: '浙江铸局', grade: '八级（较多） 美品', priceRange: '100—300元', notes: '浙江铸' },
    { variant: '宝云局', description: '云南铸局', grade: '八级（较多） 美品', priceRange: '80—200元', notes: '云南铸' },
    { variant: '宝昌局', description: '南昌铸局', grade: '七级（甚少） 美品', priceRange: '200—500元', notes: '江西铸' },
    { variant: '宝河局', description: '河南铸局', grade: '七级（甚少） 美品', priceRange: '300—800元', notes: '河南铸' },
    { variant: '宝晋局', description: '太原铸局', grade: '七级（甚少） 美品', priceRange: '500—1,500元', notes: '山西铸' },
    { variant: '宝巩局', description: '甘肃铸局', grade: '六级（稀） 美品', priceRange: '1,000—5,000元', notes: '甘肃铸，较少' },
    { variant: '宝济局', description: '济南铸局', grade: '六级（稀） 美品', priceRange: '1,000—5,000元', notes: '山东铸，稀少' },
    { variant: '宝黔局', description: '贵州铸局', grade: '五级（稀贵） 美品', priceRange: '3,000—10,000元', notes: '贵州铸，名品' },
    { variant: '宝广局', description: '广东铸局', grade: '五级（稀贵） 美品', priceRange: '2,000—5,000元', notes: '广东铸' },
    { variant: '宝武局', description: '武昌铸局', grade: '五级（稀贵） 美品', priceRange: '3,000—10,000元', notes: '湖北铸，雍正宝武局极罕' },
    { variant: '宝南局', description: '长沙铸局', grade: '四级（罕） 美品', priceRange: '5,000—20,000元', notes: '湖南铸，雍正宝南局极罕，名品' },
    { variant: '宝川局', description: '成都铸局', grade: '五级（稀贵） 美品', priceRange: '5,000—15,000元', notes: '四川铸' },
    { variant: '五笔乡', description: '"通"字走之旁五笔写法', grade: '七级（甚少） 美品', priceRange: '500—1,500元', notes: '五笔乡版' },
    { variant: '大字版', description: '面文大字版', grade: '八级（较多） 美品', priceRange: '200—500元', notes: '大字版' },
    { variant: '阔缘版', description: '钱缘较宽', grade: '八级（较多） 美品', priceRange: '200—500元', notes: '阔缘' },
    { variant: '母钱', description: '翻铸母钱', grade: '五级（稀贵） 美品以上', priceRange: '5,000—20,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
  ];
}

// 6. 乾隆通宝 - Consolidate variants, fix key issues
const qianlong = findCoin('清朝钱币', '乾隆通宝');
if (qianlong) {
  qianlong.detail.variantsTable = [
    { variant: '宝泉局', description: '户部中央局，背面满文"宝泉"', grade: '十级（多泛） 普品', priceRange: '3—10元', notes: '最常见' },
    { variant: '宝泉局', description: '户部中央局', grade: '十级（多泛） 美品', priceRange: '10—30元', notes: '品相上佳' },
    { variant: '宝泉局', description: '户部中央局', grade: '十级（多泛） 极美品', priceRange: '30—80元', notes: '品相极佳' },
    { variant: '宝源局', description: '工部中央局，背面满文"宝源"', grade: '十级（多泛） 普品', priceRange: '5—15元', notes: '工部铸' },
    { variant: '宝源局', description: '工部中央局', grade: '十级（多泛） 美品', priceRange: '10—30元', notes: '品相上佳' },
    { variant: '山底隆', description: '"隆"字底部似"山"字形，名誉版', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '山底隆名版' },
    { variant: '山底隆', description: '"隆"字底部似"山"字形', grade: '六级（稀） 极美品', priceRange: '300—1,000元', notes: '极美品' },
    { variant: '缶隆', description: '"隆"字右下似"缶"字，名誉版', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '缶隆名版' },
    { variant: '缶隆', description: '"隆"字右下似"缶"字', grade: '六级（稀） 极美品', priceRange: '500—2,000元', notes: '极美品' },
    { variant: '生隆', description: '"隆"字带"生"字形态', grade: '七级（甚少） 美品', priceRange: '50—300元', notes: '生隆版' },
    { variant: '宝苏局', description: '苏州铸局', grade: '八级（较多） 美品', priceRange: '10—50元', notes: '江苏铸' },
    { variant: '宝浙局', description: '浙江铸局', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '浙江铸' },
    { variant: '宝福局', description: '福州铸局', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '福建铸' },
    { variant: '宝川局', description: '成都铸局', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '四川铸' },
    { variant: '宝云局', description: '云南铸局', grade: '八级（较多） 美品', priceRange: '5—30元', notes: '云南铸' },
    { variant: '宝黔局', description: '贵州铸局', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '贵州铸' },
    { variant: '宝广局', description: '广东铸局', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '广东铸' },
    { variant: '阿克苏局', description: '新疆铸局，红铜材质', grade: '八级（较多） 美品', priceRange: '50—200元', notes: '新疆红铜' },
    { variant: '宝伊局', description: '伊犁铸局', grade: '八级（较多） 美品', priceRange: '50—200元', notes: '新疆局' },
    { variant: '库车局', description: '新疆铸局，红铜材质', grade: '八级（较多） 美品', priceRange: '50—200元', notes: '新疆红铜' },
    { variant: '阔缘版', description: '钱缘较宽', grade: '八级（较多） 美品', priceRange: '20—60元', notes: '阔缘' },
    { variant: '大字版', description: '面文大字版', grade: '八级（较多） 美品', priceRange: '20—50元', notes: '大字版' },
    { variant: '母钱', description: '翻铸母钱', grade: '六级（稀） 美品以上', priceRange: '3,000—10,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
    { variant: '宫钱', description: '吉语宫钱类', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '宫钱' },
  ];
}

// 7. 嘉庆通宝 - Fix variants
const jiaqing = findCoin('清朝钱币', '嘉庆通宝');
if (jiaqing) {
  jiaqing.detail.variantsTable = [
    { variant: '宝泉局', description: '户部中央局，背面满文"宝泉"', grade: '十级（多泛） 普品', priceRange: '3—10元', notes: '最常见' },
    { variant: '宝泉局', description: '户部中央局', grade: '十级（多泛） 美品', priceRange: '10—30元', notes: '品相上佳' },
    { variant: '宝源局', description: '工部中央局', grade: '十级（多泛） 普品', priceRange: '5—15元', notes: '工部铸' },
    { variant: '宝源局', description: '工部中央局', grade: '十级（多泛） 美品', priceRange: '10—30元', notes: '品相上佳' },
    { variant: '文庆版', description: '"庆"字为"攵"旁，名誉版', grade: '七级（甚少） 美品', priceRange: '100—500元', notes: '文庆名版' },
    { variant: '寿寿版', description: '背面铸"寿"字，祝寿宫钱类', grade: '六级（稀） 美品', priceRange: '500—2,000元', notes: '宫钱类' },
    { variant: '宝苏局', description: '苏州铸局', grade: '八级（较多） 美品', priceRange: '10—50元', notes: '江苏铸' },
    { variant: '宝浙局', description: '浙江铸局', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '浙江铸' },
    { variant: '宝川局', description: '成都铸局', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '四川铸' },
    { variant: '母钱', description: '翻铸母钱', grade: '六级（稀） 美品以上', priceRange: '3,000—10,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
  ];
}

// 8. 道光通宝 - Fix variants
const daoguang = findCoin('清朝钱币', '道光通宝');
if (daoguang) {
  daoguang.detail.variantsTable = [
    { variant: '宝泉局', description: '户部中央局，背面满文"宝泉"', grade: '十级（多泛） 普品', priceRange: '3—10元', notes: '最常见' },
    { variant: '宝泉局', description: '户部中央局', grade: '十级（多泛） 美品', priceRange: '10—30元', notes: '品相上佳' },
    { variant: '宝源局', description: '工部中央局', grade: '十级（多泛） 普品', priceRange: '5—15元', notes: '工部铸' },
    { variant: '宝源局', description: '工部中央局', grade: '十级（多泛） 美品', priceRange: '10—30元', notes: '品相上佳' },
    { variant: '宝苏局', description: '苏州铸局', grade: '八级（较多） 美品', priceRange: '10—50元', notes: '江苏铸' },
    { variant: '宝浙局', description: '浙江铸局', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '浙江铸' },
    { variant: '宝川局', description: '成都铸局', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '四川铸' },
    { variant: '母钱', description: '翻铸母钱', grade: '六级（稀） 美品以上', priceRange: '3,000—10,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
  ];
}

// 9. 咸丰通宝 - Fix variants
const xianfeng_tb = findCoin('清朝钱币', '咸丰通宝');
if (xianfeng_tb) {
  xianfeng_tb.detail.variantsTable = [
    { variant: '宝泉局 小平', description: '户部中央局，背面满文"宝泉"', grade: '八级（较多） 普品', priceRange: '10—30元', notes: '最常见' },
    { variant: '宝泉局 小平', description: '户部中央局', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '品相上佳' },
    { variant: '宝源局 小平', description: '工部中央局', grade: '八级（较多） 普品', priceRange: '10—30元', notes: '工部铸' },
    { variant: '宝源局 小平', description: '工部中央局', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '品相上佳' },
    { variant: '宝苏局 小平', description: '苏州铸局', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '江苏铸' },
    { variant: '宝福局 小平', description: '福州铸局', grade: '八级（较多） 美品', priceRange: '50—200元', notes: '福建铸' },
    { variant: '铁钱（常见局）', description: '铁质铸币', grade: '九级（多） 美品', priceRange: '30—100元', notes: '铁钱' },
    { variant: '克勤郡王铸钱', description: '克勤郡王自行铸币，文字风格独特', grade: '四级（罕） 美品', priceRange: '1,000—5,000元', notes: '克勤郡王铸' },
    { variant: '母钱', description: '翻铸母钱', grade: '五级（稀贵） 美品以上', priceRange: '5,000—15,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
  ];
}

// 10. 咸丰重宝 - Fix variants
const xianfeng_zb = findCoin('清朝钱币', '咸丰重宝');
if (xianfeng_zb) {
  xianfeng_zb.detail.variantsTable = [
    { variant: '宝泉局 当五', description: '户部铸，面文"咸丰重宝"，背"当五"纪值', grade: '八级（较多） 美品', priceRange: '200—500元', notes: '当五纪值' },
    { variant: '宝源局 当五', description: '工部铸', grade: '八级（较多） 美品', priceRange: '200—500元', notes: '工部当五' },
    { variant: '宝泉局 当十', description: '户部铸，背"当十"', grade: '八级（较多） 美品', priceRange: '100—500元', notes: '当十最常见' },
    { variant: '宝泉局 当十', description: '户部铸', grade: '七级（甚少） 极美品', priceRange: '300—1,000元', notes: '极美品' },
    { variant: '宝源局 当十', description: '工部铸', grade: '八级（较多） 美品', priceRange: '100—500元', notes: '工部当十' },
    { variant: '宝苏局 当十', description: '苏州铸局', grade: '八级（较多） 美品', priceRange: '150—600元', notes: '江苏铸' },
    { variant: '宝福局 当十', description: '福州铸局，铸工精良', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '福建铸，名品' },
    { variant: '宝福局 当十 计重', description: '内计重版，背面铸有重量', grade: '五级（稀贵） 美品', priceRange: '3,000—10,000元', notes: '计重版名品' },
    { variant: '宝河局 当十', description: '河南铸局', grade: '八级（较多） 美品', priceRange: '80—300元', notes: '河南铸' },
    { variant: '常见局 当二十', description: '各地铸局当二十型', grade: '七级（甚少） 美品', priceRange: '500—2,000元', notes: '当二十' },
    { variant: '宝福局 当二十 计重', description: '内计重版', grade: '五级（稀贵） 美品', priceRange: '3,000—10,000元', notes: '计重版' },
    { variant: '宝泉局 当五十', description: '户部铸当五十型', grade: '七级（甚少） 美品', priceRange: '2,000—5,000元', notes: '当五十' },
    { variant: '宝源局 当五十', description: '工部铸当五十型', grade: '七级（甚少） 美品', priceRange: '2,000—5,000元', notes: '当五十' },
    { variant: '宝苏局 当五十', description: '苏州铸局', grade: '六级（稀） 美品', priceRange: '3,000—8,000元', notes: '江苏铸' },
    { variant: '宝福局 当五十 计重', description: '内计重版', grade: '五级（稀贵） 美品', priceRange: '5,000—20,000元', notes: '计重版名品' },
    { variant: '克勤郡王 当五十', description: '克勤郡王铸', grade: '四级（罕） 美品', priceRange: '10,000—50,000元', notes: '克勤郡王铸' },
    { variant: '母钱', description: '翻铸母钱', grade: '五级（稀贵） 美品以上', priceRange: '5,000—30,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '80,000—200,000元', notes: '祖钱极罕' },
  ];
}

// 11. 咸丰元宝 - Fix variants
const xianfeng_yb = findCoin('清朝钱币', '咸丰元宝');
if (xianfeng_yb) {
  xianfeng_yb.detail.variantsTable = [
    { variant: '宝泉局 当百', description: '户部铸，面文"咸丰元宝"，背"当百"', grade: '七级（甚少） 美品', priceRange: '1,000—5,000元', notes: '当百' },
    { variant: '宝泉局 当百', description: '户部铸', grade: '六级（稀） 极美品', priceRange: '5,000—20,000元', notes: '极美品' },
    { variant: '宝源局 当百', description: '工部铸', grade: '七级（甚少） 美品', priceRange: '1,000—5,000元', notes: '工部当百' },
    { variant: '宝苏局 当百', description: '苏州铸局', grade: '六级（稀） 美品', priceRange: '3,000—10,000元', notes: '江苏铸' },
    { variant: '宝福局 当百 计重', description: '内计重版', grade: '四级（罕） 美品', priceRange: '10,000—50,000元', notes: '计重版' },
    { variant: '宝巩局 当百', description: '甘肃铸局', grade: '六级（稀） 美品', priceRange: '5,000—20,000元', notes: '甘肃铸' },
    { variant: '克勤郡王 当百', description: '克勤郡王铸', grade: '三级（罕贵） 美品', priceRange: '50,000—200,000元', notes: '克勤郡王铸' },
    { variant: '宝泉局 当五百', description: '户部铸当五百型', grade: '五级（稀贵） 美品', priceRange: '30,000—80,000元', notes: '大面值' },
    { variant: '宝源局 当五百', description: '工部铸当五百型', grade: '五级（稀贵） 美品', priceRange: '25,000—70,000元', notes: '大面值' },
    { variant: '宝巩局 当五百', description: '甘肃铸局', grade: '四级（罕） 美品', priceRange: '80,000—250,000元', notes: '宝巩当五百名品' },
    { variant: '宝泉局 当千', description: '户部铸当千型，清代最大面值', grade: '四级（罕） 美品', priceRange: '50,000—150,000元', notes: '最大面值' },
    { variant: '宝泉局 当千', description: '户部铸', grade: '三级（罕贵） 极美品', priceRange: '150,000—500,000元', notes: '极美品' },
    { variant: '宝源局 当千', description: '工部铸当千型', grade: '四级（罕） 美品', priceRange: '50,000—120,000元', notes: '工部当千' },
    { variant: '宝巩局 当千', description: '甘肃铸局', grade: '三级（罕贵） 美品', priceRange: '150,000—400,000元', notes: '宝巩当千名品' },
    { variant: '母钱', description: '翻铸母钱', grade: '二级（珍） 美品以上', priceRange: '50,000—150,000元', notes: '母钱极罕' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '200,000—500,000元', notes: '祖钱极罕' },
  ];
}

// 12. 同治通宝 - Fix variants
const tongzhi = findCoin('清朝钱币', '同治通宝');
if (tongzhi) {
  tongzhi.detail.variantsTable = [
    { variant: '宝泉局', description: '户部中央局，背面满文"宝泉"', grade: '九级（多） 普品', priceRange: '5—15元', notes: '较常见' },
    { variant: '宝泉局', description: '户部中央局', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '宝源局', description: '工部中央局', grade: '九级（多） 普品', priceRange: '5—15元', notes: '工部铸' },
    { variant: '宝源局', description: '工部中央局', grade: '九级（多） 美品', priceRange: '15—50元', notes: '品相上佳' },
    { variant: '宝苏局', description: '苏州铸局', grade: '八级（较多） 美品', priceRange: '20—80元', notes: '江苏铸' },
    { variant: '宝浙局', description: '浙江铸局', grade: '八级（较多） 美品', priceRange: '20—60元', notes: '浙江铸' },
    { variant: '宝云局', description: '云南铸局', grade: '八级（较多） 美品', priceRange: '15—50元', notes: '云南铸' },
    { variant: '母钱', description: '翻铸母钱', grade: '六级（稀） 美品以上', priceRange: '3,000—10,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
  ];
}

// 13. 光绪通宝 - Fix variants
const guangxu = findCoin('清朝钱币', '光绪通宝');
if (guangxu) {
  guangxu.detail.variantsTable = [
    { variant: '宝泉局', description: '户部中央局，背面满文"宝泉"', grade: '九级（多） 普品', priceRange: '3—10元', notes: '较常见' },
    { variant: '宝泉局', description: '户部中央局', grade: '九级（多） 美品', priceRange: '10—30元', notes: '品相上佳' },
    { variant: '宝源局', description: '工部中央局', grade: '九级（多） 普品', priceRange: '5—15元', notes: '工部铸' },
    { variant: '宝源局', description: '工部中央局', grade: '九级（多） 美品', priceRange: '10—30元', notes: '品相上佳' },
    { variant: '宝苏局', description: '苏州铸局', grade: '八级（较多） 美品', priceRange: '10—50元', notes: '江苏铸' },
    { variant: '宝浙局', description: '浙江铸局', grade: '八级（较多） 美品', priceRange: '10—40元', notes: '浙江铸' },
    { variant: '宝广局（机制币）', description: '广东铸局机制币', grade: '七级（甚少） 美品', priceRange: '50—200元', notes: '机制币版' },
    { variant: '机制铜元版', description: '光绪后期机制铜元', grade: '八级（较多） 美品', priceRange: '10—50元', notes: '机制铜元' },
    { variant: '母钱', description: '翻铸母钱', grade: '六级（稀） 美品以上', priceRange: '3,000—10,000元', notes: '母钱稀少' },
    { variant: '雕母（祖钱）', description: '手工精雕母钱', grade: '一级（大珍） 美品以上', priceRange: '50,000—150,000元', notes: '祖钱极罕' },
  ];
}

// 14. 宣统通宝 - Fix variants
const xuantong = findCoin('清朝钱币', '宣统通宝');
if (xuantong) {
  xuantong.detail.variantsTable = [
    { variant: '宝泉局', description: '户部中央局，背面满文"宝泉"', grade: '九级（多） 普品', priceRange: '10—30元', notes: '末代钱币' },
    { variant: '宝泉局', description: '户部中央局', grade: '九级（多） 美品', priceRange: '30—80元', notes: '品相上佳' },
    { variant: '宝源局', description: '工部中央局', grade: '九级（多） 美品', priceRange: '30—80元', notes: '工部铸' },
    { variant: '宝广局（机制币）', description: '广东铸局机制币', grade: '七级（甚少） 美品', priceRange: '100—300元', notes: '机制币版' },
    { variant: '母钱', description: '翻铸母钱', grade: '六级（稀） 美品以上', priceRange: '5,000—15,000元', notes: '母钱稀少' },
  ];
}

writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Qing dynasty corrections applied!');
