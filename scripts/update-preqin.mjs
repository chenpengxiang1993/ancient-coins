import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));
const coins = data[0]['coins'];

// 1. 楚国铸币 (idx 21) - Add reverseFeatures
coins[21].detail.reverseFeatures = [
  '- 楚国铸币体系包含三大类型，背面特征各不相同：',
  '- 铜贝（蚁鼻钱/鬼脸钱）：背面平素无文，实心扁平，晚期打磨较光滑',
  '- 布币（殊布当釿、连布）：背面铸有纪值文字，如"十货""四货"等',
  '- 黄金称量货币（郢爰金版）：背面无文，多见锤打痕迹及织物印痕，边缘有切割痕迹',
].join('\n');

// 2. 鱼币钱 (idx 26) - Add reverseFeatures
coins[26].detail.reverseFeatures = [
  '- 背面：较正面平整或微凹，纹饰较正面大为简化，通常无鱼鳞纹等精细纹饰',
  '- 部分背面可见铸造痕迹，如浇口残留或合范痕迹',
  '- 背面穿孔处与正面贯通，穿孔周围打磨痕迹明显',
  '- 整体工艺正面精、背面简，符合先秦仿生铸币的典型工艺特征',
].join('\n');

// 3. 殊布当釿 (idx 23) - Fix reverseFeatures
coins[23].detail.reverseFeatures = [
  '- 背面：铸有"十货"纪值文字，意为折合十枚铜贝（蚁鼻钱），体现了楚布与楚铜贝之间的兑换关系',
  '- 铸工较精整，文字规整',
].join('\n');

// 4. 连布 (idx 22) - Fix reverseFeatures
coins[22].detail.reverseFeatures = [
  '- 背面：铸有"四货"纪值文字，意为折合四枚铜贝（蚁鼻钱），与面文"四布当釿"相对应',
  '- 铸工较精',
].join('\n');

// 5. 蚁鼻钱 (idx 24) - Expand reverseFeatures
coins[24].detail.reverseFeatures = [
  '- 背面：平素无文，实心扁平，表面较为平整',
  '- 晚期蚁鼻钱背面打磨较光滑；早期铜贝背面可能保留微凹或铸造痕迹，反映了从仿贝中空结构到实心平背的演变过程',
].join('\n');

// 6. 郢爰金版 (idx 25) - Expand reverseFeatures
coins[25].detail.reverseFeatures = [
  '- 背面：无文，表面多见锤打痕迹，部分标本背面可见织物印痕（铸造时以织物垫衬所致）',
  '- 背面较正面粗糙，保留浇铸及锤打加工的自然纹理，部分可见冷凝收缩纹',
  '- 金版边缘可见切割痕迹，说明使用时按需切割',
  '- 正面模具捺印规整、背面自然铸成，体现了正面精加工、背面保留铸造态的工艺特征',
].join('\n');

// 7. 平肩空首布 (idx 2) - Refine reverseFeatures
coins[2].detail.reverseFeatures = [
  '- 背面：平素无文（无文字），通常有三道竖纹，竖纹自首部延伸至布身中部',
  '- 铸工较精整，竖纹规整',
].join('\n');

// 8. 斜肩空首布 (idx 3) - Refine reverseFeatures
coins[3].detail.reverseFeatures = [
  '- 背面：平素无文（无文字），通常有一至两道竖纹，较平肩空首布竖纹少',
  '- 铸工较精，形制统一',
].join('\n');

// 9. 耸肩空首布 (idx 4) - Refine reverseFeatures
coins[4].detail.reverseFeatures = [
  '- 背面：平素无文（无文字），通常有二至三道竖纹或斜纹',
  '- 铸工较精整，竖纹较深峻',
].join('\n');

// 10. Fix 楚国铸币 grade field data quality issues
for (const row of coins[21].detail.variantsTable) {
  const grade = row.grade || '';
  if (grade.includes('蚁鼻钱') || grade.includes('鬼脸钱')) {
    row.grade = '八级（较多） 美品';
  } else if (grade.includes('郢爰金版')) {
    if (grade.includes('整版')) {
      row.grade = '四级（罕） 美品';
    } else {
      row.grade = '五级（稀贵） 美品';
    }
  } else if (grade.includes('殊布当釿')) {
    row.grade = '六级（稀） 美品';
  } else if (grade.includes('连布')) {
    row.grade = '七级（甚少） 美品';
  }
}

writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Pre-Qin coins updated successfully!');
