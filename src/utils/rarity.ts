import type { RarityLevel } from '../types';

export function getRarityLevel(rarity: string): RarityLevel {
  if (rarity.includes('一级')) return '1';
  if (rarity.includes('二级')) return '2';
  if (rarity.includes('三级')) return '3';
  if (rarity.includes('四级')) return '4';
  if (rarity.includes('五级')) return '5';
  if (rarity.includes('六级')) return '6';
  return 'default';
}
