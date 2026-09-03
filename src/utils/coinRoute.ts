import type { Coin, DynastyData } from '../types';

/**
 * coinRoute.ts
 * 钱币位置的路径编解码，格式：/<dynastyIndex>/<coinId>，如 /20/20-29。
 * 刷新/分享链接后据 pathname 恢复到对应钱币页面（history 路由，无 #）。
 */

export interface CoinLocation {
  dynastyIndex: number;
  coin: Coin;
}

const PATH_PATTERN = /^\/(\d+)\/([\w-]+)$/;

export function encodeCoinPath(coin: Coin): string {
  return `/${coin.dynastyIndex}/${coin.id}`;
}

/** 解析 pathname 并校验钱币存在，无效或不存在返回 null */
export function parseCoinPath(pathname: string, allData: DynastyData[]): CoinLocation | null {
  const match = pathname.match(PATH_PATTERN);
  if (!match) return null;

  const dynastyIndex = Number(match[1]);
  const dynasty = allData[dynastyIndex];
  if (!dynasty) return null;

  const coin = dynasty.coins.find((c) => c.id === match[2]);
  return coin ? { dynastyIndex, coin } : null;
}
