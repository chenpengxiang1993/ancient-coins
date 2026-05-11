export type RarityLevel = '1' | '2' | '3' | '4' | '5' | '6' | 'default';

export interface CoinSummary {
  name: string;
  historicalPeriod: string;
  ruler: string;
  coreFeatures: string;
  estimatedValue: string;
  rarity: string;
}

export interface ValueTableRow {
  variant: string;
  grade: string;
  priceRange: string;
  notes: string;
}

export interface CoinDetail {
  castingTime: string;
  material: string;
  dimensions: string;
  obverseFeatures: string;
  coreBackground: string;
  variants: string;
  valueReference: string;
  valueTable: ValueTableRow[];
}

export interface Coin {
  id: string;
  name: string;
  dynasty: string;
  dynastyIndex: number;
  summary: CoinSummary;
  detail: CoinDetail | null;
}

export interface DynastyData {
  dynasty: string;
  dynastyIndex: number;
  coins: Coin[];
}

export interface SearchResult {
  coin: Coin;
  matchField: string;
}
