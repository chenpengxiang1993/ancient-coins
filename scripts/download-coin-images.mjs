import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const INPUT = path.join(ROOT, 'data', 'coins.json');
const IMAGES_DIR = path.join(ROOT, 'public', 'images', 'coins');
const URL_MAP_FILE = path.join(ROOT, 'data', 'image-url-map.json');

function sanitizeFileName(name) {
  return name.replace(/[\/\\:*?"<>|]/g, '-').replace(/\s+/g, '');
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(destPath);
    protocol.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
        return;
      }
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

function generateUrlMap(data) {
  const urlMap = {};
  for (const dynasty of data) {
    const dynastyDir = sanitizeFileName(dynasty.dynasty);
    for (const coin of dynasty.coins) {
      const coinDir = sanitizeFileName(coin.name);
      const basePath = `${dynastyDir}/${coinDir}`;
      const entry = {
        main: {
          path: `${basePath}/main.jpg`,
          url: '',
        },
        variants: [],
      };
      if (coin.detail?.images?.variants) {
        for (const v of coin.detail.images.variants) {
          const variantFileName = sanitizeFileName(v.label) + '.jpg';
          entry.variants.push({
            path: `${basePath}/${variantFileName}`,
            url: '',
            label: v.label,
          });
        }
      }
      urlMap[coin.id] = entry;
    }
  }
  return urlMap;
}

function checkExistingImages(urlMap) {
  let existing = 0;
  let missing = 0;
  for (const [coinId, entry] of Object.entries(urlMap)) {
    const mainPath = path.join(IMAGES_DIR, entry.main.path);
    if (fs.existsSync(mainPath) && fs.statSync(mainPath).size > 0) {
      existing++;
    } else {
      missing++;
    }
  }
  return { existing, missing };
}

async function downloadFromMap(urlMap, concurrency = 3) {
  const tasks = [];
  for (const [, entry] of Object.entries(urlMap)) {
    if (entry.main.url) {
      const destPath = path.join(IMAGES_DIR, entry.main.path);
      if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
        tasks.push({ url: entry.main.url, destPath, label: entry.main.path });
      }
    }
    for (const v of entry.variants) {
      if (v.url) {
        const destPath = path.join(IMAGES_DIR, v.path);
        if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
          tasks.push({ url: v.url, destPath, label: v.path });
        }
      }
    }
  }

  if (tasks.length === 0) {
    console.log('没有需要下载的图片（所有图片已存在或未配置URL）');
    return;
  }

  console.log(`\n开始下载 ${tasks.length} 张图片（并发数: ${concurrency}）...\n`);

  let completed = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const results = await Promise.allSettled(
      batch.map(async (task) => {
        fs.mkdirSync(path.dirname(task.destPath), { recursive: true });
        await downloadFile(task.url, task.destPath);
        completed++;
        console.log(`  ✓ [${completed + failed}/${tasks.length}] ${task.label}`);
      })
    );
    for (const r of results) {
      if (r.status === 'rejected') {
        failed++;
        console.log(`  ✗ 下载失败: ${r.reason?.message || r.reason}`);
      }
    }
  }

  console.log(`\n下载完成: 成功 ${completed}, 失败 ${failed}`);
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (!fs.existsSync(INPUT)) {
    console.error('错误: data/coins.json 不存在，请先运行 node scripts/parse-coins-data.mjs');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));

  switch (command) {
    case 'generate-map': {
      const urlMap = generateUrlMap(data);
      fs.writeFileSync(URL_MAP_FILE, JSON.stringify(urlMap, null, 2), 'utf-8');
      const { existing, missing } = checkExistingImages(urlMap);
      console.log(`✓ 图片URL映射文件已生成: ${URL_MAP_FILE}`);
      console.log(`  已有图片: ${existing}, 缺失图片: ${missing}`);
      console.log('\n请编辑 image-url-map.json，为每张图片填写 url 字段，然后运行:');
      console.log('  node scripts/download-coin-images.mjs download');
      break;
    }

    case 'download': {
      if (!fs.existsSync(URL_MAP_FILE)) {
        console.error('错误: data/image-url-map.json 不存在，请先运行:');
        console.error('  node scripts/download-coin-images.mjs generate-map');
        process.exit(1);
      }
      const urlMap = JSON.parse(fs.readFileSync(URL_MAP_FILE, 'utf-8'));
      const concurrency = parseInt(args[1] || '3', 10);
      downloadFromMap(urlMap, concurrency).catch(console.error);
      break;
    }

    case 'status': {
      const urlMap = generateUrlMap(data);
      const { existing, missing } = checkExistingImages(urlMap);
      const totalCoins = data.reduce((sum, d) => sum + d.coins.length, 0);
      console.log(`钱币总数: ${totalCoins}`);
      console.log(`已有主图: ${existing}`);
      console.log(`缺失主图: ${missing}`);
      console.log(`完成率: ${((existing / totalCoins) * 100).toFixed(1)}%`);
      break;
    }

    case 'mkdir': {
      let count = 0;
      for (const dynasty of data) {
        for (const coin of dynasty.coins) {
          const coinDir = path.join(IMAGES_DIR, sanitizeFileName(dynasty.dynasty), sanitizeFileName(coin.name));
          fs.mkdirSync(coinDir, { recursive: true });
          count++;
        }
      }
      console.log(`✓ 已创建 ${count} 个钱币图片目录: ${IMAGES_DIR}`);
      break;
    }

    default: {
      console.log('中国古代钱币图片下载工具\n');
      console.log('用法:');
      console.log('  node scripts/download-coin-images.mjs <command>\n');
      console.log('命令:');
      console.log('  generate-map    生成图片URL映射文件 (data/image-url-map.json)');
      console.log('  download        根据映射文件下载图片 (可指定并发数，默认3)');
      console.log('  status          查看图片下载状态');
      console.log('  mkdir           仅创建图片目录结构\n');
      console.log('工作流程:');
      console.log('  1. 运行 generate-map 生成映射文件');
      console.log('  2. 编辑 data/image-url-map.json，填写每张图片的 url');
      console.log('  3. 运行 download 下载图片到 public/images/coins/');
      console.log('\n图片目录结构:');
      console.log('  public/images/coins/{朝代}/{钱币名称}/main.jpg       主图');
      console.log('  public/images/coins/{朝代}/{钱币名称}/{版别名}.jpg   版别图');
    }
  }
}

main();
