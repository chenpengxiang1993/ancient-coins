export type RarityLevel = '1' | '2' | '3' | '4' | '5' | '6' | 'default';

export interface CoinImage {
  src: string;
  alt: string;
  label?: string;
}

export interface CoinImages {
  main: string;
  variants: CoinImage[];
}

export interface CoinSummary {
  name: string;
  historicalPeriod: string;
  ruler: string;
  coreFeatures: string;
  estimatedValue: string;
  rarity: string;
  thumbnail: string;
}

export interface VariantTableRow {
  variant: string;
  description: string;
  grade: string;
  priceRange: string;
  notes: string;
}

export interface CoinDetail {
  castingTime: string;
  material: string;
  dimensions: string;
  obverseFeatures: string;
  reverseFeatures: string;
  castingCraft: string;
  coreBackground: string;
  variantsTable: VariantTableRow[];
  images: CoinImages;
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
  dynastyPeriod: string;
  dynastyStartYear: number | null;
  dynastyEndYear: number | null;
  coins: Coin[];
}

export interface SearchResult {
  coin: Coin;
  matchField: string;
}
