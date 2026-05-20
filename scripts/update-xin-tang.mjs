import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));

// =============================================
// 新莽钱币 (dynastyIndex 3) corrections
// =============================================
const xinCoins = data[3].coins;

// 1. 一刀平五千 - Fix variant grades and prices
const yidao = xinCoins.find(c => c.name === '一刀平五千');
if (yidao) {
  yidao.summary.estimatedValue = '50,000—500,000元';
  yidao.detail.variantsTable = [
    { variant: '错金完好型', description: '金错完整，"一刀"二字嵌金清晰可辨，铸造精整，为该钱最佳品相', grade: '一级（大珍） 极美品', priceRange: '200,000—500,000元', notes: '金错完好，最为珍贵' },
    { variant: '错金尚存型', description: '金错尚存但部分磨损，"一刀"二字嵌金可辨', grade: '二级（珍） 美品', priceRange: '80,000—200,000元', notes: '金错尚存' },
    { variant: '错金脱落型', description: '金错大部分脱落，仅残留嵌金痕迹', grade: '三级（罕贵） 美品', priceRange: '50,000—120,000元', notes: '金错脱落但仍可辨识' },
  ];
}

// 2. 壮泉四十 - Fix prices (severely underpriced)
const zhuangquan = xinCoins.find(c => c.name === '壮泉四十');
if (zhuangquan) {
  zhuangquan.summary.estimatedValue = '100,000—2,000,000元';
  zhuangquan.detail.variantsTable = [
    { variant: '标准型壮泉四十', description: '面文"壮泉四十"四字悬针篆，铸造精整', grade: '一级（大珍） 普品', priceRange: '100,000—300,000元', notes: '六泉中最稀少者' },
    { variant: '标准型壮泉四十', description: '面文"壮泉四十"四字悬针篆，铸造精整', grade: '一级（大珍） 美品', priceRange: '300,000—800,000元', notes: '文字清晰，锈色自然' },
    { variant: '标准型壮泉四十', description: '面文"壮泉四十"四字悬针篆，铸造精整', grade: '一级（大珍） 极美品', priceRange: '800,000—2,000,000元', notes: '品相极佳' },
  ];
}

// 3. 大泉五十 - Add missing variants
const daquan50 = xinCoins.find(c => c.name === '大泉五十');
if (daquan50) {
  const existingVariants = [...daquan50.detail.variantsTable];
  // Add missing important variants
  daquan50.detail.variantsTable = [
    { variant: '普通版', description: '面文"大泉五十"四字悬针篆，对读，铸工较精', grade: '九级（多） 普品', priceRange: '30—80元', notes: '最常见版别' },
    { variant: '普通版', description: '面文"大泉五十"四字悬针篆，对读，铸工较精', grade: '九级（多） 美品', priceRange: '80—300元', notes: '文字清晰' },
    { variant: '大字版', description: '钱文较大，笔画粗壮', grade: '八级（较多） 美品', priceRange: '100—500元', notes: '钱文较大' },
    { variant: '悬针篆精铸版', description: '悬针篆特征明显，笔画末端尖锐如针，铸造精整', grade: '七级（甚少） 美品', priceRange: '200—1,000元', notes: '悬针篆特征明显' },
    { variant: '四出纹版', description: '穿四角各有一道纹线延伸至外廓（四出纹）', grade: '七级（甚少） 美品', priceRange: '300—1,500元', notes: '四出纹为重要版别' },
    { variant: '传形版', description: '钱文左右反转，"大泉"在右，"五十"在左', grade: '六级（稀） 美品', priceRange: '500—5,000元', notes: '钱文反转' },
    { variant: '合背版', description: '两面均为面文，属铸造错误', grade: '六级（稀） 美品', priceRange: '1,000—5,000元', notes: '双面钱文' },
    { variant: '铁母', description: '铜质母钱，用于翻铸铁钱，铸工极精', grade: '二级（珍） 极美品', priceRange: '5,000—30,000元', notes: '铜质母钱，极罕见' },
  ];
}

// 4. 货泉 - Add missing variants
const huoquan = xinCoins.find(c => c.name === '货泉');
if (huoquan) {
  huoquan.detail.variantsTable = [
    { variant: '普通版', description: '面文"货泉"二字对读，悬针篆', grade: '九级（多） 普品', priceRange: '10—30元', notes: '最常见版别' },
    { variant: '普通版', description: '面文"货泉"二字对读，悬针篆', grade: '九级（多） 美品', priceRange: '30—100元', notes: '文字清晰' },
    { variant: '大字版', description: '钱文较大，笔画粗壮', grade: '八级（较多） 美品', priceRange: '20—200元', notes: '钱文较大' },
    { variant: '连廓版', description: '内廓与钱文相连', grade: '七级（甚少） 美品', priceRange: '50—500元', notes: '连廓特征明显' },
    { variant: '面四决纹', description: '穿四角各有决纹延伸', grade: '八级（较多） 美品', priceRange: '30—100元', notes: '四决纹' },
    { variant: '传形版', description: '钱文左右反转', grade: '七级（甚少） 美品', priceRange: '200—1,000元', notes: '钱文反转' },
    { variant: '合面版', description: '两面均为背，无面文', grade: '六级（稀） 美品', priceRange: '500—3,000元', notes: '双面无文' },
  ];
}

// =============================================
// 唐朝钱币 (dynastyIndex 9) corrections
// =============================================
const tangCoins = data[9].coins;

// 1. 咸通玄宝 - Fix prices (severely underpriced)
const xiantong = tangCoins.find(c => c.name === '咸通玄宝');
if (xiantong) {
  xiantong.summary.estimatedValue = '50,000—500,000元';
  xiantong.detail.variantsTable = [
    { variant: '普通版', description: '面文"咸通玄宝"四字楷书，对读', grade: '一级（大珍） 普品', priceRange: '50,000—200,000元', notes: '古钱五十名珍之一' },
    { variant: '普通版', description: '面文"咸通玄宝"四字楷书，对读', grade: '一级（大珍） 美品', priceRange: '200,000—500,000元', notes: '品相极佳，极为罕见' },
  ];
}

// 2. 乾封泉宝 - Fix prices
const qianfeng = tangCoins.find(c => c.name === '乾封泉宝');
if (qianfeng) {
  qianfeng.summary.estimatedValue = '3,000—80,000元';
  qianfeng.detail.variantsTable = [
    { variant: '普通版', description: '面文"乾封泉宝"四字楷书，旋读，铸行仅约10个月', grade: '四级（罕） 普品', priceRange: '3,000—8,000元', notes: '年号仅存约10个月' },
    { variant: '普通版', description: '面文"乾封泉宝"四字楷书，旋读', grade: '四级（罕） 美品', priceRange: '10,000—30,000元', notes: '文字清晰，品相上佳' },
    { variant: '普通版', description: '面文"乾封泉宝"四字楷书，旋读', grade: '四级（罕） 极美品', priceRange: '30,000—80,000元', notes: '品相极佳，极罕见' },
    { variant: '狭穿版', description: '穿孔较窄，钱文笔画略粗', grade: '六级（稀） 美品', priceRange: '2,000—5,000元', notes: '穿口较窄' },
  ];
}

// 3. 大历元宝 - Fix prices
const dali = tangCoins.find(c => c.name === '大历元宝');
if (dali) {
  dali.summary.estimatedValue = '500—20,000元';
  for (const row of dali.detail.variantsTable) {
    if (row.grade.includes('普品') && row.priceRange.includes('300')) {
      row.priceRange = '500—2,000元';
    } else if (row.grade.includes('美品') && !row.grade.includes('极')) {
      row.priceRange = '2,000—8,000元';
    } else if (row.grade.includes('极美品')) {
      row.priceRange = '8,000—20,000元';
    }
  }
}

// 4. 建中通宝 - Fix prices
const jianzhong = tangCoins.find(c => c.name === '建中通宝');
if (jianzhong) {
  jianzhong.summary.estimatedValue = '1,000—30,000元';
  for (const row of jianzhong.detail.variantsTable) {
    if (row.grade.includes('普品')) {
      row.priceRange = '1,000—3,000元';
    } else if (row.grade.includes('美品') && !row.grade.includes('极')) {
      row.priceRange = '3,000—10,000元';
    } else if (row.grade.includes('极美品')) {
      row.priceRange = '10,000—30,000元';
    }
  }
}

// 5. 开元通宝 - Fix key variant grades
const kaiyuan = tangCoins.find(c => c.name === '开元通宝');
if (kaiyuan) {
  for (const row of kaiyuan.detail.variantsTable) {
    // Fix "普通光背（流通品）" grade - should be 十级 not 八级
    if (row.variant.includes('普通光背') && row.grade.includes('八级')) {
      row.grade = row.grade.replace('八级（较多）', '十级（多泛）');
    }
    // Fix "右挑元" grade - should be 五级 not 八级
    if (row.variant.includes('右挑元') && row.grade.includes('八级')) {
      row.grade = row.grade.replace('八级（较多）', '五级（稀贵）');
    }
    // Fix "容弱大字" grade - should be 五级 not 八级
    if (row.variant.includes('容弱大字') && row.grade.includes('八级')) {
      row.grade = row.grade.replace('八级（较多）', '五级（稀贵）');
    }
    // Fix "遒劲" grade - should be 七级 not 八级
    if (row.variant.includes('遒劲') && row.grade.includes('八级')) {
      row.grade = row.grade.replace('八级（较多）', '七级（甚少）');
    }
  }
}

// Write back
writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Xin and Tang corrections applied!');
