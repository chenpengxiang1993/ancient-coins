import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const COINS_FILE = path.join(ROOT, 'data', 'coins.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'coins');
const REPORT_FILE = path.join(ROOT, 'data', 'image-fetch-report.json');
const CACHE_FILE = path.join(ROOT, 'data', 'image-fetch-cache.json');
const TRACKER_FILE = path.join(ROOT, 'data', 'image-tracker.json');

const REQUEST_DELAY = 600;
const MAX_RETRIES = 3;
const NM_BASE = 'https://www.chnmuseum.cn/zp/zpml/hb/';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '');
}

function toAbsoluteUrl(relativeUrl, baseUrl) {
  if (relativeUrl.startsWith('http')) return relativeUrl;
  return new URL(relativeUrl, baseUrl).href;
}

function fetchText(url, encoding = 'utf-8') {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      },
      timeout: 15000,
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location.startsWith('http')
          ? response.headers.location
          : new URL(response.headers.location, url).href;
        fetchText(redirectUrl, encoding).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve(buffer.toString(encoding));
      });
    }).on('error', reject);
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'X-Requested-With': 'XMLHttpRequest',
      },
      timeout: 15000,
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location.startsWith('http')
          ? response.headers.location
          : new URL(response.headers.location, url).href;
        fetchJson(redirectUrl).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    const file = fs.createWriteStream(destPath);
    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': new URL(url).origin + '/',
      },
      timeout: 30000,
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectUrl = response.headers.location.startsWith('http')
          ? response.headers.location
          : new URL(response.headers.location, url).href;
        fs.unlink(destPath, () => {});
        downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        fs.unlink(destPath, () => {});
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const stat = fs.statSync(destPath);
        if (stat.size < 500) {
          fs.unlinkSync(destPath);
          reject(new Error(`File too small (${stat.size}B), likely error page: ${url}`));
          return;
        }
        resolve();
      });
    }).on('error', (err) => {
      if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function downloadWithRetry(url, destPath, retries = MAX_RETRIES) {
  for (let i = 0; i < retries; i++) {
    try {
      await downloadFile(url, destPath);
      return true;
    } catch (err) {
      if (i < retries - 1) {
        console.log(`    重试 (${i + 1}/${retries}): ${err.message}`);
        await delay(1000 * (i + 1));
      } else {
        console.log(`    ✗ 下载失败: ${err.message}`);
        return false;
      }
    }
  }
  return false;
}

function parseNationalMuseumListPage(html, pageUrl) {
  const coins = [];
  const liRegex = /<li>\s*<dl>\s*<dt>([\s\S]*?)<\/dt>\s*<dd>([\s\S]*?)<\/dd>\s*<\/dl>\s*<\/li>/g;
  let liMatch;

  while ((liMatch = liRegex.exec(html)) !== null) {
    const dtContent = liMatch[1];
    const ddContent = liMatch[2];

    const imgMatch = dtContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["']/);
    if (!imgMatch) continue;

    const imgSrc = imgMatch[1];
    const imgAlt = imgMatch[2];

    const hrefMatch = dtContent.match(/<a[^>]+href=["']([^"']+)["']/);
    const detailHref = hrefMatch ? hrefMatch[1] : null;

    const pMatch = ddContent.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const coinName = pMatch ? pMatch[1].trim() : imgAlt;

    const periodMatch = ddContent.match(/cpsdtem="([^"]*)"/);
    const period = periodMatch ? periodMatch[1] : '';

    if (coinName && imgSrc) {
      coins.push({
        name: coinName,
        imageUrl: toAbsoluteUrl(imgSrc, pageUrl),
        detailUrl: detailHref ? toAbsoluteUrl(detailHref, pageUrl) : null,
        period,
        source: 'national-museum',
      });
    }
  }

  return coins;
}

function parseNationalMuseumPCListPage(html, pageUrl) {
  const coins = parseNationalMuseumListPage(html, pageUrl);
  for (const coin of coins) {
    coin.source = 'national-museum-pc';
  }
  return coins;
}

async function fetchNationalMuseumDetailImages(detailUrl) {
  try {
    const html = await fetchText(detailUrl);
    const allImages = [];

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src.includes('/P02') || src.includes('/upload') || src.includes('/cptp/')) {
        allImages.push(toAbsoluteUrl(src, detailUrl));
      }
    }

    const uniqueImages = [...new Set(allImages)];
    return uniqueImages;
  } catch {
    return [];
  }
}

async function scrapeNationalMuseum() {
  console.log('\n=== 抓取中国国家博物馆货币馆藏 ===\n');
  const allCoins = [];

  const firstPageUrl = NM_BASE;
  console.log(`  抓取第 1 页: ${firstPageUrl}`);

  try {
    const html = await fetchText(firstPageUrl);
    const coins = parseNationalMuseumListPage(html, firstPageUrl);
    allCoins.push(...coins);
    console.log(`    → 获取 ${coins.length} 条记录`);

    const countPageMatch = html.match(/var\s+countPage\s*=\s*(\d+)/);
    const totalPages = countPageMatch ? parseInt(countPageMatch[1], 10) : 23;

    for (let page = 1; page < totalPages; page++) {
      const url = `${NM_BASE}index_${page}.shtml`;
      console.log(`  抓取第 ${page + 1} 页: ${url}`);

      try {
        const pageHtml = await fetchText(url);
        const pageCoins = parseNationalMuseumListPage(pageHtml, url);
        allCoins.push(...pageCoins);
        console.log(`    → 获取 ${pageCoins.length} 条记录`);

        if (pageCoins.length === 0) break;

        await delay(REQUEST_DELAY);
      } catch (err) {
        console.error(`  ✗ 抓取失败: ${err.message}`);
        break;
      }
    }
  } catch (err) {
    console.error(`  ✗ 首页抓取失败: ${err.message}`);
  }

  console.log(`  ✓ 国家博物馆共获取 ${allCoins.length} 条钱币记录\n`);
  return allCoins;
}

function postJson(url, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Origin': urlObj.origin,
        'Referer': urlObj.origin + '/mu/frontend/pg/m/collection/antique',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (err) {
          reject(new Error(`JSON parse error: ${err.message}`));
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function searchShanghaiMuseum(keyword) {
  const apiUrl = 'https://www.shanghaimuseum.net/mu/frontend/pg/collection/search-antique';
  try {
    const result = await postJson(apiUrl, {
      params: {
        langCode: 'CHINESE',
        antiqueSourceCode: 'ANTIQUE_SOURCE_1',
        esFlag: true,
        keywords: keyword,
      },
      page: 1,
      limit: 20,
    });

    if (result.code !== 0 || !result.data || result.data.length === 0) {
      return [];
    }

    const baseUrl = 'https://www.shanghaimuseum.net/mu/';
    return result.data.map((item) => ({
      name: item.name,
      imageUrl: item.picPath ? baseUrl + item.picPath : (item.thumbnailPath ? baseUrl + item.thumbnailPath : null),
      detailUrl: `${baseUrl}frontend/pg/m/article/id/${item.id}`,
      detailId: item.id,
      source: 'shanghai-museum',
      period: item.age?.entryItemName || '',
      type: item.antiqueType1?.entryItemName || '',
    })).filter(item => item.imageUrl);
  } catch (err) {
    console.error(`  ✗ 上海博物馆搜索失败 (${keyword}): ${err.message}`);
    return [];
  }
}

async function fetchShanghaiMuseumDetailImages(detailUrl) {
  try {
    const html = await fetchText(detailUrl);
    const images = [];

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (!src.includes('logo') && !src.includes('icon') && !src.includes('banner') && !src.includes('arrow')) {
        images.push(toAbsoluteUrl(src, detailUrl));
      }
    }

    return images;
  } catch {
    return [];
  }
}

async function searchPalaceMuseum(keyword) {
  const searchUrl = `https://www.dpm.org.cn/search/search.html?q=${encodeURIComponent(keyword)}&category=collection`;
  try {
    const html = await fetchText(searchUrl);
    const results = [];

    const itemRegex = /<a[^>]+href=["']([^"']*collection[^"']*)["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["'][^>]*>[\s\S]*?<[^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\//g;
    let match;
    while ((match = itemRegex.exec(html)) !== null) {
      results.push({
        name: match[3].trim(),
        imageUrl: toAbsoluteUrl(match[2], searchUrl),
        detailUrl: toAbsoluteUrl(match[1], searchUrl),
        source: 'palace-museum',
      });
    }

    if (results.length === 0) {
      const linkRegex = /<a[^>]+href=["'](\/collection\/[^"']+\.html)["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/g;
      while ((match = linkRegex.exec(html)) !== null) {
        results.push({
          name: keyword,
          imageUrl: toAbsoluteUrl(match[2], searchUrl),
          detailUrl: toAbsoluteUrl(match[1], 'https://www.dpm.org.cn'),
          source: 'palace-museum',
        });
      }
    }

    return results.filter(r => r.imageUrl);
  } catch (err) {
    return [];
  }
}

async function fetchPalaceMuseumDetailImages(detailUrl) {
  try {
    const html = await fetchText(detailUrl);
    const images = [];

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    let match;
    while ((match = imgRegex.exec(html)) !== null) {
      const src = match[1];
      if (src.includes('/upload') || src.includes('/pic') || src.includes('_')) {
        if (!src.includes('logo') && !src.includes('icon') && !src.includes('banner') && !src.includes('arrow') && !src.includes('qrcode')) {
          images.push(toAbsoluteUrl(src, detailUrl));
        }
      }
    }

    return [...new Set(images)];
  } catch {
    return [];
  }
}

async function searchWikimediaCommons(keyword) {
  const searchUrl = `https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyword)}&srnamespace=6&srlimit=10&format=json&origin=*`;
  try {
    const html = await fetchText(searchUrl);
    const data = JSON.parse(html);
    if (!data.query || !data.query.search || data.query.search.length === 0) {
      return [];
    }

    const titles = data.query.search.map(s => s.title);
    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(titles.join('|'))}&prop=imageinfo&iiprop=url&iiurlwidth=800&format=json&origin=*`;

    const infoHtml = await fetchText(imageInfoUrl);
    const infoData = JSON.parse(infoHtml);

    const results = [];
    if (infoData.query && infoData.query.pages) {
      for (const page of Object.values(infoData.query.pages)) {
        if (page.imageinfo && page.imageinfo.length > 0) {
          const info = page.imageinfo[0];
          results.push({
            name: page.title.replace('File:', ''),
            imageUrl: info.thumburl || info.url,
            detailUrl: info.descriptionurl,
            source: 'wikimedia-commons',
          });
        }
      }
    }

    return results;
  } catch (err) {
    return [];
  }
}

function loadTracker() {
  if (fs.existsSync(TRACKER_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
    } catch {
      return createTracker();
    }
  }
  return createTracker();
}

function createTracker() {
  return {
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rounds: [],
    summary: {
      totalCoins: 0,
      totalMissing: 0,
      totalAcquired: 0,
      totalFailed: 0,
    },
  };
}

function saveTracker(tracker) {
  tracker.updatedAt = new Date().toISOString();
  fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2), 'utf-8');
}

function updateTrackerWithResults(tracker, results, roundLabel) {
  const round = {
    label: roundLabel,
    timestamp: new Date().toISOString(),
    acquired: results.success.length,
    failed: results.failed.length,
    skipped: results.skipped.length,
    details: {
      acquired: results.success.map(s => ({
        id: s.id,
        name: s.name,
        dynasty: s.dynasty,
        source: s.source,
        matchedName: s.matchedName,
        matchScore: s.matchScore,
      })),
      failed: results.failed.map(f => ({
        id: f.id,
        name: f.name,
        dynasty: f.dynasty,
      })),
    },
  };

  tracker.rounds.push(round);

  const coinsFile = path.join(ROOT, 'data', 'coins.json');
  const coinsData = JSON.parse(fs.readFileSync(coinsFile, 'utf-8'));
  let totalMissing = 0;
  let totalAcquired = 0;

  for (const dynasty of coinsData) {
    for (const coin of dynasty.coins) {
      const coinDir = path.join(IMAGES_DIR, sanitizeFileName(dynasty.dynasty), sanitizeFileName(coin.name));
      const mainPath = path.join(coinDir, 'main.jpg');
      if (fs.existsSync(mainPath) && fs.statSync(mainPath).size > 1000) {
        totalAcquired++;
      } else {
        totalMissing++;
      }
    }
  }

  tracker.summary.totalCoins = coinsData.reduce((s, d) => s + d.coins.length, 0);
  tracker.summary.totalMissing = totalMissing;
  tracker.summary.totalAcquired = totalAcquired;
  tracker.summary.totalFailed = tracker.rounds.reduce((s, r) => s + r.failed, 0);

  saveTracker(tracker);
  return round;
}

function normalizeCoinName(name) {
  return name
    .replace(/[（）()【】\[\]]/g, '')
    .replace(/[""\u201c\u201d]/g, '')
    .replace(/（[^）]*）/g, '')
    .replace(/-[^-]*$/g, '')
    .replace(/背.*$/g, '')
    .trim();
}

function normalizeForMatching(name) {
  return normalizeCoinName(name)
    .replace(/铜钱$|铜币$|铜刀币$|铜布$|铜仿贝$|青铜钱$|青铜刀币$|青铜布$|金钱$|银钱$|铁钱$|银币$|银元$|铜元$/g, '')
    .trim();
}

const COIN_ALIASES = {
  '包金铜贝': ['铜贝币', '青铜贝币', '包金贝', '铜贝'],
  '无文铜贝': ['无文铜仿贝', '铜仿贝', '无文贝'],
  '平肩空首布': ['平肩弧足空首布', '平肩空首布铜'],
  '斜肩空首布': ['斜肩弧足空首布'],
  '耸肩空首布': ['耸肩尖足空首布', '耸肩空首布铜'],
  '原始布': ['铜原始空首布', '原始空首布'],
  '桥足布钱': ['桥足布', '安邑一釿', '安邑二釿', '梁充釿'],
  '锐角布钱': ['锐角布', '殊布当釿', '楚大布'],
  '尖足布钱': ['尖足布', '晋阳尖足布', '大尖足布'],
  '类方足布': ['类方足布'],
  '类圆足布': ['类圆足布'],
  '方足布钱': ['方足布', '莆子方足布'],
  '圆足布钱': ['圆足布', '蔺字圆足布', '离石圆足布'],
  '三孔布': ['三孔布下博', '三孔布'],
  '齐刀': ['齐大刀', '齐返邦长大刀', '齐返邦大刀', '即墨大刀', '安阳之大刀'],
  '燕刀': ['明刀', '明字刀'],
  '赵刀': ['言阳新刀', '甘丹刀'],
  '直刀': ['直刀'],
  '秦半两钱': ['半两铜钱', '半两', '半两青铜钱'],
  '八铢半两': ['八铢半两'],
  '四铢半两': ['四铢半两'],
  '榆荚半两': ['榆荚半两'],
  '两锱半两': ['两锱半两'],
  '赤仄五铢': ['三官五铢', '上林三官五铢'],
  '昭帝五铢': ['西汉五铢穿下横纹'],
  '宣帝五铢': ['西汉五铢'],
  '建武五铢': ['光武五铢'],
  '东汉五铢': ['东汉五铢'],
  '剪边五铢': ['剪边五铢', '剪凿五铢'],
  '綖环五铢': ['綖环五铢'],
  '小泉直一': ['直一', '小泉直一铜钱'],
  '大泉五十': ['大泉五十'],
  '契刀五百': ['契刀五百铜钱'],
  '一刀平五千': ['一刀平五千铜钱', '金错刀'],
  '大布黄千': ['大布黄千铜钱', '大布黄千铜阳模'],
  '货泉': ['货泉'],
  '布泉-新莽': ['布泉铜钱', '王莽布泉'],
  '壮泉四十': ['壮泉四十'],
  '中泉三十': ['中泉三十'],
  '幼泉二十': ['幼泉二十'],
  '么泉一十': ['么泉一十'],
  '小布一百': ['小布一百'],
  '第布八百': ['第布八百铜钱'],
  '次布九百': ['次布九百'],
  '大泉当千': ['大泉当千'],
  '大泉二千': ['大泉二千'],
  '大泉五千': ['大泉五千铜钱'],
  '直百五铢': ['直百五铢背为铜钱', '直百五铢'],
  '直百': ['直百'],
  '太平百钱': ['太平百钱'],
  '定平一百': ['定平一百'],
  '大泉五百': ['大泉五百'],
  '汉兴': ['汉兴铜钱', '汉兴钱'],
  '凉造新泉': ['凉造新泉铜钱'],
  '太夏真兴': ['太夏真兴'],
  '丰货': ['丰货铜钱'],
  '太和五铢': ['太和五铢铜钱'],
  '永平五铢': ['永平五铢'],
  '布泉-北周': ['布泉铜钱', '北周布泉'],
  '五行大布': ['五行大布铜钱'],
  '永通万国': ['永通万国铜钱', '合背永通万国'],
  '常平五铢': ['常平五铢'],
  '永安五铢': ['永安五铢'],
  '永光': ['永光钱', '永光铜钱'],
  '景和': ['景和钱', '景和铜钱'],
  '大明四铢': ['大明四铢铜钱'],
  '两铢': ['两铢'],
  '孝建四铢': ['孝建四铢', '孝建'],
  '公式女钱': ['公式女钱'],
  '铁五铢': ['铁五铢'],
  '太清丰乐': ['太清丰乐铜钱', '太清丰乐'],
  '四柱五铢': ['四柱五铢'],
  '天嘉五铢': ['天嘉五铢'],
  '太货六铢': ['太货六铢铜钱'],
  '鹅眼钱': ['鹅眼钱'],
  '隋五铢': ['五铢白钱', '曲笔五铢', '隋五铢'],
  '开元通宝': ['开元通宝铜钱', '开元通宝青铜钱'],
  '乾封泉宝': ['乾封泉宝'],
  '乾元重宝': ['乾元重宝铜钱', '乾元重宝大钱', '乾元重宝重轮大钱'],
  '大历元宝': ['大历元宝'],
  '建中通宝': ['建中通宝'],
  '得壹元宝': ['得壹元宝'],
  '顺天元宝': ['顺天元宝'],
  '高昌吉利': ['高昌吉利'],
  '会昌开元': ['开元通宝', '会昌开元通宝'],
  '咸通玄宝': ['咸通玄宝'],
  '开平通宝': ['开平通宝'],
  '开平元宝': ['开平元宝'],
  '天成元宝': ['天成元宝'],
  '天福元宝': ['天福元宝'],
  '汉元通宝': ['汉元通宝'],
  '周元通宝': ['周元通宝'],
  '永隆通宝': ['永隆通宝'],
  '天德重宝': ['天德重宝'],
  '天策府宝': ['天策府宝'],
  '乾亨通宝-南汉': ['乾亨通宝'],
  '广政通宝': ['广政通宝'],
  '大齐通宝': ['大齐通宝'],
  '保大元宝': ['保大元宝'],
  '永通泉宝': ['永通泉宝'],
  '大蜀通宝': ['大蜀通宝'],
  '应感通宝': ['应感通宝'],
  '应运元宝': ['应运元宝'],
  '皇宋通宝': ['皇宋通宝九叠篆', '皇宋通宝'],
  '至和通宝': ['至和通宝'],
  '圣宋元宝': ['圣宋元宝'],
  '建国通宝': ['建国通宝'],
  '靖康通宝': ['靖康通宝铜钱', '靖康通宝'],
  '靖康元宝': ['靖康元宝'],
  '嘉定重宝': ['嘉定铁钱'],
  '福圣宝钱': ['西夏文福圣宝钱铜钱', '福圣宝钱'],
  '大安宝钱': ['大安宝钱'],
  '大安通宝': ['大安通宝'],
  '贞观宝钱': ['贞观宝钱'],
  '乾祐宝钱': ['乾祐宝钱'],
  '天庆宝钱': ['天庆宝钱'],
  '天盛元宝': ['天盛元宝'],
  '皇建元宝': ['皇建元宝'],
  '光定元宝': ['光定元宝'],
  '蒙文大元通宝': ['大元通宝雕母', '蒙文大元通宝雕母'],
  '至正通宝': ['至正通宝'],
  '至大通宝': ['至大通宝'],
  '大元通宝': ['大元通宝'],
  '中统元宝交钞': ['壹贯文中统元宝交钞', '中统元宝交钞'],
  '大明通行宝钞': ['大明通行宝钞壹贯文铜钞版', '大明通行宝钞肆拾文'],
  '万历银钱': ['万历通宝银钱', '万历通宝'],
  '崇祯通宝': ['崇祯通宝雕母'],
  '大顺通宝': ['大顺通宝永昌通宝'],
  '永昌通宝': ['大顺通宝永昌通宝'],
  '兴朝通宝': ['兴朝通宝'],
  '天聪汗钱': ['天聪汉之钱', '天聪汗钱'],
  '天命通宝': ['天命通宝'],
  '天命汗钱': ['天命汗之钱'],
  '顺治通宝': ['顺治通宝背满汉文宁铜钱', '顺治通宝'],
  '康熙通宝': ['康熙通宝'],
  '雍正通宝': ['雍正通宝'],
  '乾隆通宝': ['乾隆通宝开炉钱', '乾隆通宝'],
  '嘉庆通宝': ['嘉庆通宝雕母', '嘉庆通宝'],
  '道光通宝': ['道光通宝样钱', '道光通宝'],
  '咸丰通宝': ['咸丰通宝'],
  '咸丰重宝': ['咸丰重宝'],
  '咸丰元宝': ['咸丰元宝'],
  '同治通宝': ['同治通宝'],
  '光绪通宝': ['光绪通宝'],
  '宣统通宝': ['宣统通宝样钱', '宣统通宝机制钱'],
  '祺祥通宝': ['祺祥重宝雕母钱'],
  '祺祥重宝': ['祺祥重宝雕母钱'],
  '太平天国圣宝': ['太平天国钱币'],
  '天国圣宝': ['太平天国钱币'],
  '太平圣宝': ['太平天国钱币'],
  '天国太平背圣宝': ['太平天国钱币'],
  '天国圣宝背太平': ['太平天国钱币'],
  '太平圣宝背天国': ['太平天国钱币'],
  '大清铜币': ['大清铜币', '户部大清铜币'],
  '大清银币': ['大清银币', '宣统三年大清银币'],
  '光绪元宝': ['光绪元宝铜元', '光绪元宝银元'],
  '宣统元宝': ['宣统元宝铜元'],
  '宽永通宝': ['宽永通宝'],
  '景兴通宝': ['景兴通宝'],
  '光中通宝': ['光中通宝'],
  '景盛通宝': ['景盛通宝'],
  '国宝金匮直万': ['国宝金匮值万'],
  '连布': ['四布当釿铜连布'],
  '殊布当釿': ['殊布当釿', '楚大布'],
  '郢爯': ['郢爯金版', '郢称金版'],
  '文信': ['文信铜钱'],
  '五铢': ['五铢铜钱', '五铢金钱', '三官五铢青铜钱'],
  '半两钱': ['半两铜钱', '半两青铜钱'],
  '三孔布钱': ['三孔布'],
  '齐刀钱': ['齐刀', '齐大刀', '即墨大刀', '齐造邦长大刀'],
  '楚国铸币': ['郢爰', '郢爰印戳'],
  '蚁鼻钱': ['蚁鼻钱', '鬼脸钱', '铜贝币'],
  '郢爰金版': ['郢爰', '郢爰印戳'],
  '鱼币钱': ['鱼币'],
  '桥梁币': ['桥梁币'],
  '两甾钱': ['两甾'],
  '长安钱': ['长安'],
  '五分钱': ['五分钱'],
  '白金三品': ['白金三品'],
  '董卓小钱': ['董卓小钱'],
  '世平百钱': ['世平百钱'],
  '得壹元宝-史思明': ['得壹元宝'],
  '顺天元宝-史思明': ['顺天元宝'],
  '西域铸币': ['西域', '龟兹'],
  '开平元宝': ['开平元宝'],
  '开国通宝': ['开国通宝'],
  '大齐通宝': ['大齐通宝'],
  '飞龙进宝': ['飞龙进宝'],
  '永安钱': ['永安一百', '永安五百', '永安一千'],
  '康定元宝': ['康定元宝'],
  '嘉祐重宝': ['嘉祐重宝'],
  '元丰重宝': ['元丰重宝'],
  '政和重宝': ['政和重宝'],
  '皇祐元宝': ['皇祐元宝'],
  '庆历直十': ['庆历重宝'],
  '应运钱': ['应运元宝', '应运通宝铁钱'],
  '应感钱': ['应感通宝'],
  '隆兴通宝': ['隆兴元宝'],
  '隆兴重宝': ['隆兴重宝'],
  '乾道通宝': ['乾道通宝'],
  '乾道重宝': ['乾道重宝'],
  '纯熙元宝': ['纯熙元宝'],
  '淳熙通宝': ['淳熙元宝'],
  '圣宋重宝': ['圣宋重宝'],
  '嘉定崇宝': ['嘉定铁钱'],
  '嘉定正宝': ['嘉定铁钱'],
  '嘉定全宝': ['嘉定铁钱'],
  '嘉定永宝': ['嘉定铁钱'],
  '嘉定安宝': ['嘉定铁钱'],
  '嘉定真宝': ['嘉定铁钱'],
  '嘉定之宝': ['嘉定铁钱'],
  '嘉定万宝': ['嘉定铁钱'],
  '嘉定隆宝': ['嘉定铁钱'],
  '嘉定洪宝': ['嘉定铁钱'],
  '嘉定新宝': ['嘉定铁钱'],
  '嘉定泉宝': ['嘉定铁钱'],
  '嘉定大宝': ['嘉定铁钱'],
  '嘉定珍宝': ['嘉定铁钱'],
  '嘉定至宝': ['嘉定铁钱'],
  '嘉定兴宝': ['嘉定铁钱'],
  '嘉定封宝': ['嘉定铁钱'],
  '绍定元宝': ['绍定通宝'],
  '端平重宝': ['端平通宝', '端平元宝'],
  '淳佑通宝': ['淳祐通宝'],
  '临安府钱牌': ['临安府行用铜牌'],
  '壮国元宝': ['牡国元宝'],
  '皇统通宝': ['皇统元宝'],
  '贞祐元宝': ['贞祐通宝'],
  '致和元宝': ['致和通宝'],
  '至元元宝': ['至元通宝'],
  '天聪通宝': ['天聪汉之钱'],
  '大顺通宝': ['大顺通宝、永昌通宝'],
  '永昌通宝': ['大顺通宝、永昌通宝'],
};

const VARIANT_ALIASES = {
  '会昌开元': '开元通宝',
  '大泉五十': '大泉五十',
  '小泉直一': '小泉直一',
};

const COIN_ENGLISH_NAMES = {
  '包金铜贝': 'gold-plated copper cowrie',
  '无文铜贝': 'bronze cowrie shell coin',
  '平肩空首布': 'flat-shoulder hollow-head spade coin',
  '斜肩空首布': 'sloping-shoulder hollow-head spade coin',
  '耸肩空首布': 'pointed-shoulder hollow-head spade coin',
  '桥足布钱': 'bridge-foot spade coin',
  '锐角布钱': 'sharp-corner spade coin',
  '尖足布钱': 'pointed-foot spade coin',
  '方足布钱': 'square-foot spade coin',
  '圆足布钱': 'round-foot spade coin',
  '三孔布钱': 'three-hole spade coin',
  '齐刀钱': 'Qi knife coin',
  '燕刀钱': 'Yan knife coin',
  '秦半两钱': 'Qin Ban Liang',
  '五铢': 'Wu Zhu',
  '开元通宝': 'Kaiyuan Tongbao',
  '大泉五十': 'Daquan Wushi',
  '货泉': 'Huoquan',
  '一刀平五千': 'Yidao Pingwuqian',
  '大布黄千': 'Dabu Huangqian',
  '靖康通宝': 'Jingkang Tongbao',
  '崇宁通宝': 'Chongning Tongbao',
  '大观通宝': 'Daguan Tongbao',
  '宣和通宝': 'Xuanhe Tongbao',
  '咸丰通宝': 'Xianfeng Tongbao',
  '咸丰重宝': 'Xianfeng Zhongbao',
  '咸丰元宝': 'Xianfeng Yuanbao',
  '康熙通宝': 'Kangxi Tongbao',
  '乾隆通宝': 'Qianlong Tongbao',
  '雍正通宝': 'Yongzheng Tongbao',
  '顺治通宝': 'Shunzhi Tongbao',
  '光绪通宝': 'Guangxu Tongbao',
  '光绪元宝': 'Guangxu Yuanbao',
  '太平天国圣宝': 'Taiping Tianguo Shengbao',
};

function getSearchKeywords(coinName) {
  const norm = normalizeCoinName(coinName);
  const keywords = [coinName, norm];

  if (VARIANT_ALIASES[norm]) {
    keywords.push(VARIANT_ALIASES[norm]);
  }

  if (COIN_ALIASES[coinName]) {
    keywords.push(...COIN_ALIASES[coinName]);
  }
  if (COIN_ALIASES[norm]) {
    keywords.push(...COIN_ALIASES[norm]);
  }

  if (norm.endsWith('通宝') || norm.endsWith('元宝') || norm.endsWith('重宝')) {
    const prefix = norm.replace(/通宝$|元宝$|重宝$/, '');
    if (prefix.length >= 2) {
      keywords.push(prefix);
    }
  }

  if (COIN_ENGLISH_NAMES[coinName]) {
    keywords.push(COIN_ENGLISH_NAMES[coinName]);
  }

  return [...new Set(keywords)];
}

function matchCoins(sourceName, targetName) {
  if (sourceName === targetName) return 1.0;

  const normSource = normalizeCoinName(sourceName);
  const normTarget = normalizeCoinName(targetName);

  if (normSource === normTarget) return 0.95;

  const matchSource = normalizeForMatching(sourceName);
  const matchTarget = normalizeForMatching(targetName);

  if (matchSource === matchTarget) return 0.90;

  for (const [coinName, aliases] of Object.entries(COIN_ALIASES)) {
    const normCoinName = normalizeCoinName(coinName);
    if (normSource === normCoinName || matchSource === normalizeForMatching(coinName)) {
      for (const alias of aliases) {
        if (normTarget === normalizeCoinName(alias) || matchTarget === normalizeForMatching(alias)) {
          return 0.85;
        }
        if (normTarget.includes(normalizeCoinName(alias)) || normalizeCoinName(alias).includes(normTarget)) {
          return 0.80;
        }
      }
    }
    if (normTarget === normCoinName || matchTarget === normalizeForMatching(coinName)) {
      for (const alias of aliases) {
        if (normSource === normalizeCoinName(alias) || matchSource === normalizeForMatching(alias)) {
          return 0.85;
        }
        if (normSource.includes(normalizeCoinName(alias)) || normalizeCoinName(alias).includes(normSource)) {
          return 0.80;
        }
      }
    }
  }

  if (matchSource.includes(matchTarget) || matchTarget.includes(matchSource)) {
    const longer = matchSource.length > matchTarget.length ? matchSource : matchTarget;
    const shorter = matchSource.length > matchTarget.length ? matchTarget : matchSource;

    const commonSuffixes = ['五铢', '通宝', '元宝', '重宝', '半两', '泉宝'];
    let bothHaveCommonSuffix = false;
    for (const suffix of commonSuffixes) {
      if (matchSource.endsWith(suffix) && matchTarget.endsWith(suffix) && matchSource !== matchTarget) {
        const prefixSource = matchSource.slice(0, -suffix.length);
        const prefixTarget = matchTarget.slice(0, -suffix.length);
        if (prefixSource.length > 0 && prefixTarget.length > 0) {
          if (!prefixSource.includes(prefixTarget) && !prefixTarget.includes(prefixSource)) {
            bothHaveCommonSuffix = true;
            break;
          }
        }
      }
    }

    if (bothHaveCommonSuffix) {
      return 0;
    }

    const longerLen = Math.max(matchSource.length, matchTarget.length);
    const shorterLen = Math.min(matchSource.length, matchTarget.length);
    return 0.5 + 0.4 * (shorterLen / longerLen);
  }

  if (normSource.replace(/[·\-]/g, '') === normTarget.replace(/[·\-]/g, '')) return 0.9;

  const sourceChars = matchSource.split('');
  const targetChars = matchTarget.split('');
  let commonCount = 0;
  for (const ch of sourceChars) {
    const idx = targetChars.indexOf(ch);
    if (idx !== -1) {
      commonCount++;
      targetChars.splice(idx, 1);
    }
  }
  const similarity = commonCount / Math.max(sourceChars.length, matchTarget.length);
  if (similarity >= 0.7) return similarity * 0.7;

  return 0;
}

function loadCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch {
      return {};
    }
  }
  return {};
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const limit = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : Infinity;
  const dynastyFilter = args.includes('--dynasty') ? args[args.indexOf('--dynasty') + 1] : null;
  const skipExisting = !args.includes('--force');

  if (!fs.existsSync(COINS_FILE)) {
    console.error('错误: data/coins.json 不存在，请先运行 node scripts/parse-coins-data.mjs');
    process.exit(1);
  }

  const coinsData = JSON.parse(fs.readFileSync(COINS_FILE, 'utf-8'));

  switch (command) {
    case 'scrape-nm': {
      const nmCoins = await scrapeNationalMuseum();
      const cache = loadCache();
      for (const coin of nmCoins) {
        cache[`nm:${coin.name}`] = coin;
      }
      saveCache(cache);
      console.log(`✓ 国家博物馆数据已缓存到 ${CACHE_FILE}`);
      console.log(`  共 ${nmCoins.length} 条记录，前10条预览:`);
      for (const c of nmCoins.slice(0, 10)) {
        console.log(`    - ${c.name} (${c.period}) → ${c.imageUrl}`);
      }
      break;
    }

    case 'scrape-nm-pc': {
      console.log('\n=== 抓取国家博物馆PC端货币馆藏 ===\n');
      const allCoins = [];
      const NM_PC_BASE = 'https://www.chnmuseum.cn/zp/zpml/hb/';

      const firstPageUrl = NM_PC_BASE;
      console.log(`  抓取第 1 页: ${firstPageUrl}`);

      try {
        const html = await fetchText(firstPageUrl);
        const coins = parseNationalMuseumPCListPage(html, firstPageUrl);
        allCoins.push(...coins);
        console.log(`    → 获取 ${coins.length} 条记录`);

        const totalPages = 23;

        for (let page = 1; page < totalPages; page++) {
          const url = `${NM_PC_BASE}index_${page}.shtml`;
          console.log(`  抓取第 ${page + 1} 页: ${url}`);

          try {
            const pageHtml = await fetchText(url);
            const pageCoins = parseNationalMuseumPCListPage(pageHtml, url);
            allCoins.push(...pageCoins);
            console.log(`    → 获取 ${pageCoins.length} 条记录`);

            if (pageCoins.length === 0) break;

            await delay(REQUEST_DELAY);
          } catch (err) {
            console.error(`  ✗ 抓取失败: ${err.message}`);
          }
        }
      } catch (err) {
        console.error(`  ✗ 首页抓取失败: ${err.message}`);
      }

      const cache = loadCache();
      for (const coin of allCoins) {
        cache[`nm-pc:${coin.name}`] = coin;
      }
      saveCache(cache);
      console.log(`\n✓ 国家博物馆PC端数据已缓存到 ${CACHE_FILE}`);
      console.log(`  共 ${allCoins.length} 条记录，前10条预览:`);
      for (const c of allCoins.slice(0, 10)) {
        console.log(`    - ${c.name} → ${c.imageUrl}`);
      }
      break;
    }

    case 'fetch': {
      console.log('\n=== 从官方平台获取钱币图片 ===\n');

      const cache = loadCache();
      let nmCoins = [];
      for (const key of Object.keys(cache)) {
        if (key.startsWith('nm:') || key.startsWith('nm-pc:')) {
          nmCoins.push(cache[key]);
        }
      }

      if (nmCoins.length === 0) {
        console.log('国家博物馆缓存为空，先执行抓取...');
        nmCoins = await scrapeNationalMuseum();
        for (const coin of nmCoins) {
          cache[`nm:${coin.name}`] = coin;
        }
        saveCache(cache);
      } else {
        console.log(`使用缓存的国家博物馆数据: ${nmCoins.length} 条记录`);
      }

      const allCoins = [];
      for (const dynasty of coinsData) {
        if (dynastyFilter && !dynasty.dynasty.includes(dynastyFilter)) continue;
        for (const coin of dynasty.coins) {
          allCoins.push(coin);
        }
      }

      console.log(`待处理钱币: ${allCoins.length} 枚${dynastyFilter ? ` (过滤: ${dynastyFilter})` : ''}${limit < Infinity ? ` (限制: ${limit})` : ''}\n`);

      const results = {
        success: [],
        failed: [],
        skipped: [],
      };

      const coinsToProcess = allCoins.slice(0, limit);
      let processed = 0;

      for (const coin of coinsToProcess) {
        processed++;
        const coinDir = path.join(IMAGES_DIR, sanitizeFileName(coin.dynasty), sanitizeFileName(coin.name));
        const mainImagePath = path.join(coinDir, 'main.jpg');

        if (skipExisting && fs.existsSync(mainImagePath) && fs.statSync(mainImagePath).size > 1000) {
          results.skipped.push({ id: coin.id, name: coin.name, dynasty: coin.dynasty });
          console.log(`  [${processed}/${coinsToProcess.length}] ⏭ ${coin.name} (已存在)`);
          continue;
        }

        console.log(`  [${processed}/${coinsToProcess.length}] ${coin.name} (${coin.dynasty})`);

        let downloaded = false;

        let bestMatch = null;
        let bestScore = 0;
        for (const nmCoin of nmCoins) {
          const score = matchCoins(nmCoin.name, coin.name);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = nmCoin;
          }
        }

        if (bestMatch && bestScore >= 0.75) {
          console.log(`    → 国家博物馆匹配: "${bestMatch.name}" (分数: ${bestScore.toFixed(2)})`);
          const success = await downloadWithRetry(bestMatch.imageUrl, mainImagePath);
          if (success) {
            downloaded = true;
            results.success.push({
              id: coin.id,
              name: coin.name,
              dynasty: coin.dynasty,
              source: 'national-museum',
              matchedName: bestMatch.name,
              matchScore: bestScore,
            });
          }
        }

        if (!downloaded) {
          const keywords = getSearchKeywords(coin.name);
          for (const kw of keywords) {
            if (downloaded) break;
            console.log(`    → 搜索上海博物馆: "${kw}"...`);
            await delay(REQUEST_DELAY);
            const smResults = await searchShanghaiMuseum(kw);

            if (smResults.length > 0) {
              let smBestMatch = null;
              let smBestScore = 0;
              for (const smCoin of smResults) {
                const score = matchCoins(smCoin.name, coin.name);
                if (score > smBestScore) {
                  smBestScore = score;
                  smBestMatch = smCoin;
                }
              }

              if (smBestMatch && smBestScore >= 0.5) {
                console.log(`    → 上海博物馆匹配: "${smBestMatch.name}" (分数: ${smBestScore.toFixed(2)})`);
                const success = await downloadWithRetry(smBestMatch.imageUrl, mainImagePath);
                if (success) {
                  downloaded = true;
                  results.success.push({
                    id: coin.id,
                    name: coin.name,
                    dynasty: coin.dynasty,
                    source: 'shanghai-museum',
                    matchedName: smBestMatch.name,
                    matchScore: smBestScore,
                  });
                }
              }
            }
          }
        }

        if (!downloaded) {
          const keywords = getSearchKeywords(coin.name);
          for (const kw of keywords) {
            if (downloaded) break;
            console.log(`    → 搜索故宫博物院: "${kw}"...`);
            await delay(REQUEST_DELAY);
            const pmResults = await searchPalaceMuseum(kw);

            if (pmResults.length > 0) {
              let pmBestMatch = null;
              let pmBestScore = 0;
              for (const pmCoin of pmResults) {
                const score = matchCoins(pmCoin.name, coin.name);
                if (score > pmBestScore) {
                  pmBestScore = score;
                  pmBestMatch = pmCoin;
                }
              }

              if (pmBestMatch && pmBestScore >= 0.5) {
                console.log(`    → 故宫博物院匹配: "${pmBestMatch.name}" (分数: ${pmBestScore.toFixed(2)})`);
                const success = await downloadWithRetry(pmBestMatch.imageUrl, mainImagePath);
                if (success) {
                  downloaded = true;
                  results.success.push({
                    id: coin.id,
                    name: coin.name,
                    dynasty: coin.dynasty,
                    source: 'palace-museum',
                    matchedName: pmBestMatch.name,
                    matchScore: pmBestScore,
                  });
                }
              }
            }
          }
        }

        if (!downloaded) {
          const wmKeywords = getSearchKeywords(coin.name);
          for (const kw of wmKeywords) {
            if (downloaded) break;
            console.log(`    → 搜索Wikimedia Commons: "${kw}"...`);
            await delay(REQUEST_DELAY);
            const wmResults = await searchWikimediaCommons(kw);

            if (wmResults.length > 0) {
              let wmBestMatch = null;
              let wmBestScore = 0;
              for (const wmCoin of wmResults) {
                const score = matchCoins(wmCoin.name, coin.name);
                if (score > wmBestScore) {
                  wmBestScore = score;
                  wmBestMatch = wmCoin;
                }
              }

              if (wmBestMatch && wmBestScore >= 0.4) {
                console.log(`    → Wikimedia Commons匹配: "${wmBestMatch.name}" (分数: ${wmBestScore.toFixed(2)})`);
                const success = await downloadWithRetry(wmBestMatch.imageUrl, mainImagePath);
                if (success) {
                  downloaded = true;
                  results.success.push({
                    id: coin.id,
                    name: coin.name,
                    dynasty: coin.dynasty,
                    source: 'wikimedia-commons',
                    matchedName: wmBestMatch.name,
                    matchScore: wmBestScore,
                  });
                }
              }
            }
          }
        }

        if (!downloaded) {
          results.failed.push({ id: coin.id, name: coin.name, dynasty: coin.dynasty });
          console.log(`    ✗ 未找到图片`);
        }

        await delay(REQUEST_DELAY);
      }

      fs.writeFileSync(REPORT_FILE, JSON.stringify(results, null, 2), 'utf-8');

      const tracker = loadTracker();
      updateTrackerWithResults(tracker, results, `fetch-${new Date().toISOString().slice(0, 10)}`);

      console.log('\n=== 获取结果 ===');
      console.log(`  成功: ${results.success.length}`);
      console.log(`  失败: ${results.failed.length}`);
      console.log(`  跳过: ${results.skipped.length}`);
      console.log(`  报告: ${REPORT_FILE}`);

      if (results.failed.length > 0) {
        console.log('\n未获取到图片的钱币:');
        for (const f of results.failed) {
          console.log(`  - ${f.name} (${f.dynasty})`);
        }
      }
      break;
    }

    case 'fetch-detail': {
      console.log('\n=== 从国家博物馆详情页获取更多图片 ===\n');

      const cache = loadCache();
      let nmCoins = [];
      for (const key of Object.keys(cache)) {
        if (key.startsWith('nm:') && cache[key].detailUrl) {
          nmCoins.push(cache[key]);
        }
      }

      console.log(`有详情页的记录: ${nmCoins.length} 条\n`);

      let detailCount = 0;
      let imageCount = 0;
      let variantImageCount = 0;

      for (const nmCoin of nmCoins) {
        if (!nmCoin.detailUrl) continue;

        const bestMatch = findBestCoinMatch(nmCoin.name, coinsData, dynastyFilter);
        if (!bestMatch) continue;

        const coinDir = path.join(IMAGES_DIR, sanitizeFileName(bestMatch.dynasty), sanitizeFileName(bestMatch.name));
        const mainImagePath = path.join(coinDir, 'main.jpg');

        const hasMain = fs.existsSync(mainImagePath) && fs.statSync(mainImagePath).size > 1000;
        const hasVariants = fs.existsSync(coinDir) && fs.readdirSync(coinDir).some(f => f.startsWith('variant_'));

        if (hasMain && hasVariants && skipExisting) {
          continue;
        }

        detailCount++;
        console.log(`  [${detailCount}] ${nmCoin.name} → 详情页: ${nmCoin.detailUrl}`);

        try {
          const detailImages = await fetchNationalMuseumDetailImages(nmCoin.detailUrl);
          console.log(`    → 找到 ${detailImages.length} 张图片`);

          if (detailImages.length > 0) {
            if (!hasMain) {
              const success = await downloadWithRetry(detailImages[0], mainImagePath);
              if (success) {
                imageCount++;
              }
            }

            if (detailImages.length > 1) {
              const startIdx = hasMain ? 0 : 1;
              for (let i = startIdx; i < Math.min(detailImages.length, 6); i++) {
                const variantPath = path.join(coinDir, `variant_${i - startIdx + 1}.jpg`);
                if (skipExisting && fs.existsSync(variantPath) && fs.statSync(variantPath).size > 1000) {
                  continue;
                }
                const success = await downloadWithRetry(detailImages[i], variantPath);
                if (success) {
                  variantImageCount++;
                }
              }
            }
          }
        } catch (err) {
          console.error(`    ✗ 获取详情页失败: ${err.message}`);
        }

        await delay(REQUEST_DELAY);
      }

      console.log(`\n✓ 处理了 ${detailCount} 个详情页，获取了 ${imageCount} 张主图，${variantImageCount} 张版别图`);
      break;
    }

    case 'status': {
      let total = 0;
      let hasMain = 0;
      let hasVariants = 0;
      let totalVariantImages = 0;
      const missingCoins = [];

      for (const dynasty of coinsData) {
        for (const coin of dynasty.coins) {
          total++;
          const coinDir = path.join(IMAGES_DIR, sanitizeFileName(dynasty.dynasty), sanitizeFileName(coin.name));
          const mainPath = path.join(coinDir, 'main.jpg');
          if (fs.existsSync(mainPath) && fs.statSync(mainPath).size > 1000) {
            hasMain++;
          } else {
            missingCoins.push({ name: coin.name, dynasty: dynasty.dynasty });
          }

          if (fs.existsSync(coinDir)) {
            const files = fs.readdirSync(coinDir).filter(f => f.startsWith('variant_') || f.startsWith('版别'));
            if (files.length > 0) {
              hasVariants++;
              totalVariantImages += files.length;
            }
          }
        }
      }

      console.log('=== 图片状态 ===');
      console.log(`  钱币总数: ${total}`);
      console.log(`  已有主图: ${hasMain} (${((hasMain / total) * 100).toFixed(1)}%)`);
      console.log(`  缺失主图: ${total - hasMain}`);
      console.log(`  已有版别图: ${hasVariants} 枚钱币, 共 ${totalVariantImages} 张`);

      if (missingCoins.length > 0 && missingCoins.length <= 50) {
        console.log('\n缺失主图的钱币:');
        for (const c of missingCoins) {
          console.log(`  - ${c.name} (${c.dynasty})`);
        }
      }
      break;
    }

    case 'report': {
      if (!fs.existsSync(REPORT_FILE)) {
        console.log('报告文件不存在，请先运行 fetch 命令');
        break;
      }
      const report = JSON.parse(fs.readFileSync(REPORT_FILE, 'utf-8'));
      console.log('=== 获取报告 ===');
      console.log(`  成功: ${report.success.length}`);
      console.log(`  失败: ${report.failed.length}`);
      console.log(`  跳过: ${report.skipped.length}`);

      const bySource = {};
      for (const s of report.success) {
        bySource[s.source] = (bySource[s.source] || 0) + 1;
      }
      console.log('\n  按来源统计:');
      for (const [source, count] of Object.entries(bySource)) {
        console.log(`    ${source}: ${count}`);
      }

      if (report.failed.length > 0) {
        console.log('\n  未获取到图片的钱币:');
        for (const f of report.failed) {
          console.log(`    - ${f.name} (${f.dynasty})`);
        }
      }
      break;
    }

    case 'track': {
      if (!fs.existsSync(TRACKER_FILE)) {
        console.log('追踪文件不存在，请先运行 fetch 命令');
        break;
      }
      const tracker = JSON.parse(fs.readFileSync(TRACKER_FILE, 'utf-8'));
      console.log('=== 图片获取进度追踪 ===\n');
      console.log(`  创建时间: ${tracker.createdAt}`);
      console.log(`  最后更新: ${tracker.updatedAt}`);
      console.log(`  钱币总数: ${tracker.summary.totalCoins}`);
      console.log(`  已获取主图: ${tracker.summary.totalAcquired} (${((tracker.summary.totalAcquired / tracker.summary.totalCoins) * 100).toFixed(1)}%)`);
      console.log(`  仍缺失主图: ${tracker.summary.totalMissing}`);
      console.log(`  累计失败: ${tracker.summary.totalFailed}`);
      console.log(`  获取轮次: ${tracker.rounds.length}`);

      if (tracker.rounds.length > 0) {
        console.log('\n  各轮次详情:');
        for (const round of tracker.rounds) {
          console.log(`    [${round.label}] ${round.timestamp.slice(0, 10)} - 获取${round.acquired}, 失败${round.failed}, 跳过${round.skipped}`);
        }
      }

      if (tracker.summary.totalMissing > 0) {
        const missingReport = path.join(ROOT, 'data', 'image-missing-report.json');
        if (fs.existsSync(missingReport)) {
          const report = JSON.parse(fs.readFileSync(missingReport, 'utf-8'));
          console.log('\n  按朝代缺失分布:');
          for (const d of report.byDynasty) {
            if (d.missing > 0) {
              console.log(`    ${d.dynasty}: ${d.missing}/${d.total} 缺失 (${d.coverage} 覆盖率)`);
            }
          }
          console.log('\n  按珍稀度缺失分布:');
          for (const r of report.byRarity) {
            if (r.count > 0) {
              console.log(`    ${r.rarity}: ${r.count}枚`);
            }
          }
        }
      }
      break;
    }

    default: {
      console.log('中国古代钱币图片获取工具\n');
      console.log('用法:');
      console.log('  node scripts/fetch-coin-images.mjs <command> [options]\n');
      console.log('命令:');
      console.log('  scrape-nm      抓取国家博物馆货币馆藏数据');
      console.log('  scrape-nm-pc   抓取国家博物馆PC端货币馆藏数据');
      console.log('  fetch          从官方平台获取钱币图片');
      console.log('  fetch-detail   从国家博物馆详情页获取更多图片');
      console.log('  status         查看图片获取状态');
      console.log('  report         查看上次获取报告');
      console.log('  track          查看进度追踪报告\n');
      console.log('选项:');
      console.log('  --limit N      仅处理前N枚钱币');
      console.log('  --dynasty X    仅处理指定朝代');
      console.log('  --force        强制重新下载已存在的图片\n');
      console.log('数据来源:');
      console.log('  1. 中国国家博物馆 (chnmuseum.cn) - 货币类馆藏');
      console.log('  2. 上海博物馆 (shanghaimuseum.net) - 典藏精选搜索');
      console.log('  3. 故宫博物院 (dpm.org.cn) - 院藏搜索\n');
      console.log('工作流程:');
      console.log('  1. 运行 scrape-nm 抓取国家博物馆数据');
      console.log('  2. 运行 fetch 从官方平台获取图片');
      console.log('  3. 运行 fetch-detail 从详情页获取更多图片');
      console.log('  4. 运行 status 查看获取状态');
      console.log('  5. 运行 track 查看进度追踪');
    }
  }
}

function findBestCoinMatch(nmName, coinsData, dynastyFilter) {
  let bestCoin = null;
  let bestScore = 0;

  for (const dynasty of coinsData) {
    if (dynastyFilter && !dynasty.dynasty.includes(dynastyFilter)) continue;
    for (const coin of dynasty.coins) {
      const score = matchCoins(nmName, coin.name);
      if (score > bestScore) {
        bestScore = score;
        bestCoin = { ...coin, dynasty: dynasty.dynasty };
      }
    }
  }

  return bestScore >= 0.75 ? bestCoin : null;
}

main().catch(console.error);
