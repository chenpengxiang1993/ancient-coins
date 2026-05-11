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
      searchText: [
        coin.name,
        coin.dynasty,
        coin.summary.historicalPeriod,
        coin.summary.ruler,
        coin.summary.coreFeatures,
        coin.summary.estimatedValue,
        coin.summary.rarity,
      ]
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
    else if (entry.coin.dynasty.toLowerCase().includes(kw)) matchField = '朝代';
    else if (entry.coin.summary.rarity.toLowerCase().includes(kw)) matchField = '稀有度';

    results.push({ coin: entry.coin, matchField });
  }

  return results;
}

export function warmupSearchIndex(allData: DynastyData[]): void {
  requestIdleCallback(() => buildSearchIndex(allData));
}
