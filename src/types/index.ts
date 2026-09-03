export type RarityLevel = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'default';

/** 品相等级：极美品 / 美品以上 / 美品 / 普品（值与 data-condition 属性一致，小写） */
export type ConditionLevel = 'supreme' | 'fineplus' | 'fine' | 'common';

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

/** 构建期生成的拼音索引（拼音搜索用），旧缓存数据可能缺失 */
export interface CoinPinyin {
  /** 名称全拼，如 kaiyuantongbao */
  name: string;
  /** 名称首字母缩写，如 kytb */
  nameAbbr: string;
  /** 铸主全拼 */
  ruler: string;
  /** 铸主首字母缩写 */
  rulerAbbr: string;
}

export interface VariantTableRow {
  variant: string;
  description: string;
  grade: string;
  priceRange: string;
  notes: string;
}

export interface FeaturesGroup {
  common: string;    // 钱币特征（通用，不特定属于正面或背面）
  obverse: string;   // 面特征（仅与正面相关）
  reverse: string;   // 背特征（仅与背面相关）
}

export interface CoinDetail {
  castingTime: string;
  material: string;
  dimensions: string;
  featuresGroup: FeaturesGroup;
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
  /** 拼音索引（生成于构建期），缺失时拼音搜索自动降级 */
  pinyin?: CoinPinyin;
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
