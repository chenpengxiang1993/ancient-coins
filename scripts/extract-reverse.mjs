import { readFileSync, writeFileSync } from 'fs';

const data = JSON.parse(readFileSync('data/coins.json', 'utf-8'));

let totalUpdated = 0;
let totalNoInfo = 0;

for (const dynasty of data) {
  for (const coin of dynasty.coins) {
    const detail = coin.detail;
    if (!detail) continue;

    const rf = detail.reverseFeatures || '';
    if (rf) continue; // Already has reverseFeatures

    const of = detail.obverseFeatures || '';
    if (!of) {
      detail.reverseFeatures = '';
      totalNoInfo++;
      continue;
    }

    // Try to extract reverse-related lines from obverseFeatures
    const lines = of.split('\n');
    const reverseLines = [];
    const remainingLines = [];

    for (const line of lines) {
      const stripped = line.trim();
      // Check if this line is primarily about the reverse side
      const isReverseLine = /^\*?\s*-?\s*背面/.test(stripped) ||
                            /^\*?\s*-?\s*背文/.test(stripped) ||
                            /^\*?\s*-?\s*背铸/.test(stripped);

      // Check if line mentions "背面" embedded in description
      const hasReverseMention = /背面[铸有光平素无文含或及]/.test(stripped) ||
                                 /背面[：:]/.test(stripped) ||
                                 /背文[包括铸有：:]/.test(stripped) ||
                                 /光背/.test(stripped) ||
                                 /合背/.test(stripped);

      // Check if line contains reverse info as part of a larger description
      // e.g., "面文"xxx"，四字旋读，楷书，背面光素无文。"
      const embeddedReverse = /，背面[^\n]+/.test(stripped) && !isReverseLine;

      if (isReverseLine) {
        // Clean up the line - remove the bullet prefix and "背面" prefix to standardize
        let cleaned = stripped
          .replace(/^\*\s*/, '- ')
          .replace(/^- /, '');
        if (cleaned.startsWith('背面')) {
          cleaned = '- ' + cleaned;
        } else {
          cleaned = '- ' + cleaned;
        }
        reverseLines.push(cleaned);
      } else if (embeddedReverse) {
        // Extract just the reverse part from the embedded description
        const match = stripped.match(/(背面[^\n。]+[。]?)/);
        if (match) {
          reverseLines.push('- ' + match[1].replace(/[。]$/, ''));
        }
        // Keep the full line in obverseFeatures
        remainingLines.push(line);
      } else {
        remainingLines.push(line);
      }
    }

    if (reverseLines.length > 0) {
      detail.reverseFeatures = reverseLines.join('\n');
      // Don't modify obverseFeatures for embedded mentions - they're part of larger descriptions
      totalUpdated++;
    } else {
      // No reverse info found in obverseFeatures
      // Try to infer from the coin name and other context
      const name = coin.name;
      const summary = coin.summary || {};
      const coreFeatures = summary.coreFeatures || '';

      let inferred = '';

      // For most standard Chinese coins, the reverse is plain (光背)
      if (/通宝|元宝|重宝|泉宝/.test(name) && !/背/.test(coreFeatures)) {
        // Standard round coins with square holes - most are 光背
        if (/唐|宋|五代|辽|西夏|金|元|明|清|太平|三藩|南明|明末|晚清/.test(dynasty.dynasty)) {
          // Check if coreFeatures mentions specific reverse features
          if (/星月|背字|纪局|纪地|纪值/.test(coreFeatures)) {
            // Has specific reverse features mentioned in summary
            inferred = extractFromCoreFeatures(coreFeatures);
          } else if (/光背/.test(coreFeatures)) {
            inferred = '- 背面：光素无文（光背）';
          } else {
            // Default for these dynasties - most coins are 光背
            inferred = '- 背面：光素无文（光背）';
          }
        }
      }

      // Special handling for specific coin types
      if (name.includes('五铢') || name === '綖环五铢' || name === '四柱五铢') {
        inferred = '- 背面：光素无文或有简单纹饰';
      } else if (name === '鹅眼钱') {
        inferred = '- 背面：平素无文';
      } else if (name.includes('花钱') || name.includes('压胜')) {
        inferred = '- 背面：铸有纹饰或吉语文字，图案内容丰富多样';
      } else if (name === '康定元宝') {
        inferred = '- 背面：光素无文（铁钱）';
      } else if (name === '绍圣通宝') {
        inferred = '- 背面：光素无文';
      } else if (name === '绍圣重宝') {
        inferred = '- 背面：光素无文（铁钱）';
      } else if (name === '元符重宝') {
        inferred = '- 背面：光素无文（铁钱）';
      }

      // For Song dynasty coins specifically - most are 光背
      if (!inferred && /北宋|南宋/.test(dynasty.dynasty)) {
        if (/通宝|元宝|重宝/.test(name)) {
          inferred = '- 背面：光素无文（光背）';
        }
      }

      // For Liao, Western Xia, Jin coins
      if (!inferred && /辽|西夏|金/.test(dynasty.dynasty)) {
        inferred = '- 背面：光素无文';
      }

      // For Yuan, Ming, Qing coins
      if (!inferred && /元|明|清|南明|明末|三藩/.test(dynasty.dynasty)) {
        if (dynasty.dynasty === '清朝钱币') {
          // Qing coins typically have Manchu script on reverse
          if (name.includes('天命') || name.includes('天聪')) {
            inferred = '- 背面：铸有满文';
          } else if (name.includes('顺治')) {
            inferred = '- 背面：顺治五式，分别为光背式、汉字纪局式、一厘式、满文纪局式、满汉文纪局式';
          } else if (name.includes('康熙')) {
            inferred = '- 背面：满文纪局（宝泉、宝源）或满汉文纪局';
          } else if (name.includes('雍正')) {
            inferred = '- 背面：满文纪局（宝泉、宝源等）';
          } else if (name.includes('乾隆')) {
            inferred = '- 背面：满文纪局（宝泉、宝源及各省局）';
          } else if (name.includes('嘉庆')) {
            inferred = '- 背面：满文纪局';
          } else if (name.includes('道光')) {
            inferred = '- 背面：满文纪局';
          } else if (name.includes('咸丰')) {
            inferred = '- 背面：满文纪局，大钱另有纪值、纪重文字';
          } else if (name.includes('同治')) {
            inferred = '- 背面：满文纪局';
          } else if (name.includes('光绪')) {
            inferred = '- 背面：满文纪局';
          } else if (name.includes('宣统')) {
            inferred = '- 背面：满文纪局';
          }
        } else if (dynasty.dynasty === '元朝钱币') {
          inferred = '- 背面：光素无文或有简单纹饰';
        } else if (dynasty.dynasty === '明朝钱币') {
          if (name.includes('洪武')) {
            inferred = '- 背面：光背或背纪局、纪重文字';
          } else if (name.includes('永乐')) {
            inferred = '- 背面：光素无文';
          } else if (name.includes('宣德')) {
            inferred = '- 背面：光素无文';
          } else if (name.includes('弘治')) {
            inferred = '- 背面：光素无文';
          } else if (name.includes('嘉靖')) {
            inferred = '- 背面：光素无文';
          } else if (name.includes('隆庆')) {
            inferred = '- 背面：光素无文';
          } else if (name.includes('万历')) {
            inferred = '- 背面：光素无文';
          } else if (name.includes('泰昌')) {
            inferred = '- 背面：光素无文';
          } else if (name.includes('天启')) {
            inferred = '- 背面：光背或背纪局、纪星月';
          } else if (name.includes('崇祯')) {
            inferred = '- 背面：版别极多，有光背、背星月、背文（纪地、纪局、纪值）等';
          } else if (name.includes('大中')) {
            inferred = '- 背面：光背或背纪局、纪地文字';
          } else if (name.includes('洪熙')) {
            inferred = '- 背面：光素无文';
          }
        } else if (dynasty.dynasty === '南明钱币') {
          inferred = '- 背面：光素无文或背星月纹';
        } else if (dynasty.dynasty === '明末农民起义钱币') {
          inferred = '- 背面：光素无文';
        } else if (dynasty.dynasty === '三藩钱币') {
          inferred = '- 背面：光素无文或背纪局文字';
        }
      }

      // For Taiping and late Qing rebellion coins
      if (!inferred && /太平天国|晚清起义/.test(dynasty.dynasty)) {
        if (name.includes('天国')) {
          inferred = '- 背面：铸有"圣宝"二字';
        } else {
          inferred = '- 背面：光素无文或铸有简单文字';
        }
      }

      // For foreign coins
      if (!inferred && dynasty.dynasty === '外国钱币') {
        inferred = '- 背面：铸有外国文字或纹饰';
      }

      // For Huaqian/Yashengqian
      if (!inferred && dynasty.dynasty === '花钱_压胜钱') {
        inferred = '- 背面：铸有纹饰或吉语文字，图案内容丰富多样';
      }

      detail.reverseFeatures = inferred || '';
      if (inferred) {
        totalUpdated++;
      } else {
        totalNoInfo++;
      }
    }
  }
}

function extractFromCoreFeatures(coreFeatures) {
  // Try to extract reverse feature information from coreFeatures
  if (/光背/.test(coreFeatures)) {
    return '- 背面：光素无文（光背）';
  }
  if (/背字|纪局/.test(coreFeatures)) {
    return '- 背面：铸有纪局或纪地文字';
  }
  if (/星月/.test(coreFeatures)) {
    return '- 背面：铸有星月纹或光背';
  }
  if (/纪值/.test(coreFeatures)) {
    return '- 背面：铸有纪值文字或光背';
  }
  return '- 背面：光素无文';
}

console.log(`Updated: ${totalUpdated} coins with reverseFeatures`);
console.log(`No info: ${totalNoInfo} coins without reverseFeatures`);

writeFileSync('data/coins.json', JSON.stringify(data, null, 2), 'utf-8');
console.log('Done!');
