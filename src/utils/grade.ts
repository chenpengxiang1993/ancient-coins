import type { ConditionLevel, RarityLevel } from '../types';

/**
 * grade.ts
 * 品相等级字符串解析：如「八级（较多） 美品」拆为
 * 稀有度等级（八级（较多））+ 品相（美品）两部分，供标签化展示。
 */

const CN_LEVEL_RANKS: Record<string, RarityLevel> = {
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

/** 从任意含「X级」的文本中提取稀有度级别（一至十级），未识别返回 'default' */
export function parseGradeLevel(text: string): RarityLevel {
  const match = text.match(/([一二三四五六七八九十])级/);
  return match ? CN_LEVEL_RANKS[match[1]] : 'default';
}

export interface VariantGradeInfo {
  /** 稀有度等级文本，如「八级（较多）」「七级 甚少」 */
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
  const levelText = conditionMatch
    ? trimmed.slice(0, trimmed.length - conditionMatch[0].length).trim()
    : trimmed;

  return {
    levelText,
    levelRank: parseGradeLevel(levelText),
    conditionText,
    conditionRank: conditionText ? CONDITION_RANKS[conditionText] : null,
  };
}
