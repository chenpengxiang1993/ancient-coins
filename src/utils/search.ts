import type { DynastyData, Coin, SearchResult } from '../types';

interface SearchIndexEntry {
  coin: Coin;
  searchText: string;
}

let indexCache: SearchIndexEntry[] | null = null;

function buildSearchIndex(allData: DynastyData[]): SearchIndexEntry[] {
  if (indexCache) return indexCache;
  indexCache = allData.flatMap((dynasty) =>
    dynasty.coins.map((coin) => ({
      coin,
      // 汉字关键词命中前两项，拼音关键词（全拼/首字母）命中 pinyin 各项；
      // filter 防止缺 pinyin 字段的旧数据把 undefined 拼入可搜文本
      searchText: [
        coin.name,
        coin.summary.ruler,
        coin.pinyin?.name,
        coin.pinyin?.nameAbbr,
        coin.pinyin?.ruler,
        coin.pinyin?.rulerAbbr,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    }))
  );
  return indexCache;
}

export function searchCoins(allData: DynastyData[], keyword: string): SearchResult[] {
  if (!keyword.trim()) return [];

  const kw = keyword.trim().toLowerCase();
  const index = buildSearchIndex(allData);
  const results: SearchResult[] = [];

  for (const entry of index) {
    if (entry.searchText.indexOf(kw) === -1) continue;

    let matchField = '综合';
    if (entry.coin.name.toLowerCase().includes(kw)) matchField = '名称';
    else if (entry.coin.summary.ruler.toLowerCase().includes(kw)) matchField = '铸主';
    else if (
      entry.coin.pinyin?.name.includes(kw) ||
      entry.coin.pinyin?.nameAbbr.includes(kw)
    ) matchField = '拼音';
    else if (entry.coin.pinyin?.ruler.includes(kw)) matchField = '铸主拼音';

    results.push({ coin: entry.coin, matchField });
  }

  return results;
}

export function warmupSearchIndex(allData: DynastyData[]): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => buildSearchIndex(allData));
  } else {
    setTimeout(() => buildSearchIndex(allData), 1);
  }
}
