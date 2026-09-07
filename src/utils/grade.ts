import type { ConditionLevel, RarityLevel } from '../types';

/**
 * grade.ts
 * 品相等级字符串解析：如「八级（较多） 美品」拆为
 * 稀有度等级（八级（较多））+ 品相（美品）两部分，供标签化展示。
 */

const CN_LEVEL_RANKS: Record<string, Exclude<RarityLevel, 'default' | 'doubt'>> = {
  '一': '1',
  '二': '2',
  '三': '3',
  '四': '4',
  '五': '5',
  '六': '6',
  '七': '7',
  '八': '8',
  '九': '9',
  '十': '10',
};

const CONDITION_RANKS: Record<string, ConditionLevel> = {
  '极美品': 'supreme',
  '美品以上': 'fineplus',
  '美品': 'fine',
  '普品': 'common',
};

/** 谱外/存疑文本特征（如「谱外存疑」），自成语义标签，不参与等级归一 */
const DOUBT_PATTERN = /谱外|存疑/;

const CN_LEVEL_RE = /([一二三四五六七八九十])级/;

/** 紧凑等级式：恰好一档等级（括号式「八级（较多）」或空格式「十级 多泛」），无其他修饰文字 */
const COMPACT_LEVEL_RE = /^[一二三四五六七八九十]级(?:（[^（）]*）| ?[^\s（）至/]*)?$/;

/** 标准等级词表（AGENTS.md §1.4 马定祥十级制），UI 层归一展示的唯一词源 */
export const STANDARD_RARITY_LABELS: Record<Exclude<RarityLevel, 'default' | 'doubt'>, string> = {
  '1': '大珍',
  '2': '珍',
  '3': '罕贵',
  '4': '珍罕',
  '5': '稀贵',
  '6': '稀',
  '7': '甚少',
  '8': '少',
  '9': '较多',
  '10': '多泛',
};

/**
 * 从任意含「X级」的文本中提取稀有度级别（一至十级）；
 * 谱外/存疑文本返回 'doubt'，其余未识别返回 'default'。
 */
export function parseGradeLevel(text: string): RarityLevel {
  if (DOUBT_PATTERN.test(text)) return 'doubt';
  const match = text.match(CN_LEVEL_RE);
  return match ? CN_LEVEL_RANKS[match[1]] : 'default';
}

/**
 * 等级文本归一：把 0—19 卷旧括号词表（如「八级（较多）」，括号标签多有错位）
 * 统一为标准标签「八级 少」。数据层不改，仅展示层归一。
 * 谱外/存疑文本原样返回；「X级（…）至Y级（…）」区间与「X级（…）/Y级（…）」双值
 * 在各段均为紧凑等级式时逐段归一；其余非紧凑文本（含说明性长句）原样返回，绝不截断。
 */
export function standardizeRarityText(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return text;
  if (DOUBT_PATTERN.test(trimmed)) return trimmed;

  if (trimmed.includes('至') || trimmed.includes('/')) {
    const sep = trimmed.includes('至') ? '至' : '/';
    const halves = trimmed.split(sep).map((h) => h.trim());
    if (halves.length >= 2 && halves.every((h) => COMPACT_LEVEL_RE.test(h))) {
      return halves.map((h) => standardizeRarityText(h)).join(sep);
    }
    return trimmed;
  }

  if (!COMPACT_LEVEL_RE.test(trimmed)) return trimmed;
  const levelMatch = trimmed.match(CN_LEVEL_RE);
  if (!levelMatch) return trimmed;
  const label = STANDARD_RARITY_LABELS[CN_LEVEL_RANKS[levelMatch[1]]];
  return label ? `${levelMatch[0]} ${label}` : trimmed;
}

export interface VariantGradeInfo {
  /** 稀有度等级文本（已归一），如「八级 少」「七级 甚少」「谱外存疑」 */
  levelText: string;
  levelRank: RarityLevel;
  /** 品相文本，如「美品」，无品相词时为空 */
  conditionText: string;
  conditionRank: ConditionLevel | null;
}

/**
 * 解析版别表品相等级字符串。
 * 品相词（极美品/美品以上/美品/普品）在尾部提取，其余整体作为稀有度等级文本。
 * 空字符串返回 null。
 */
export function parseVariantGrade(grade: string): VariantGradeInfo | null {
  const trimmed = grade.trim();
  if (!trimmed) return null;

  // 交替顺序保证「美品以上」优先于「美品」、「极美品」优先于「美品」
  const conditionMatch = trimmed.match(/(极美品|美品以上|美品|普品)\s*$/);
  const conditionText = conditionMatch?.[1] ?? '';
  const rawLevelText = conditionMatch
    ? trimmed.slice(0, trimmed.length - conditionMatch[0].length).trim()
    : trimmed;

  return {
    levelText: standardizeRarityText(rawLevelText),
    levelRank: parseGradeLevel(rawLevelText),
    conditionText,
    conditionRank: conditionText ? CONDITION_RANKS[conditionText] : null,
  };
}
