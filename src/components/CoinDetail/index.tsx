import { memo, useMemo, useState, useCallback, useRef, useEffect } from 'react';
import type { Coin, CoinDetail as CoinDetailType, FeaturesGroup, VariantTableRow } from '../../types';
import CoinImage from '../CoinImage';
import { formatContent } from '../../utils/format';
import { parseVariantGrade, standardizeRarityText } from '../../utils/grade';
import { getRarityLevel, isTop50Rare } from '../../utils/rarity';
import styles from './index.module.scss';

interface CoinDetailProps {
  coin: Coin;
  detail: CoinDetailType | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  prevCoin: Coin | null;
  nextCoin: Coin | null;
  onNavigate: (coin: Coin) => void;
}

/** 详情加载骨架（图片块 + 文本行） */
function DetailSkeleton() {
  return (
    <div className={styles.detailSkeleton} role="status" aria-label="详情加载中">
      <div className={`${styles.skel} ${styles.skelImage}`} />
      <div className={`${styles.skel} ${styles.skelLine}`} style={{ width: '28%' }} />
      <div className={`${styles.skel} ${styles.skelLine}`} style={{ width: '92%' }} />
      <div className={`${styles.skel} ${styles.skelLine}`} style={{ width: '86%' }} />
      <div className={`${styles.skel} ${styles.skelLine}`} style={{ width: '60%' }} />
    </div>
  );
}

export default memo(function CoinDetail({
  coin,
  detail,
  loading,
  error,
  onRetry,
  prevCoin,
  nextCoin,
  onNavigate,
}: CoinDetailProps) {
  const rarityLevel = useMemo(() => getRarityLevel(coin.summary.rarity), [coin.summary.rarity]);
  const rarityText = useMemo(() => standardizeRarityText(coin.summary.rarity), [coin.summary.rarity]);
  const formattedSummary = useMemo(() => formatContent(coin.summary.coreFeatures), [coin.summary.coreFeatures]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showBackTop, setShowBackTop] = useState(false);
  const [copied, setCopied] = useState(false);

  // 滚动监听：超过阈值显示「回到顶部」；切换钱币时复位
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowBackTop(false);
    const onScroll = () => setShowBackTop(el.scrollTop > 420);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [coin.id]);

  const handleBackTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleCopyLink = useCallback(async () => {
    const url = window.location.href;
    let ok = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        ok = true;
      }
    } catch {
      ok = false;
    }
    // 降级：非安全上下文或剪贴板 API 不可用时，用隐藏 textarea + execCommand
    if (!ok) {
      try {
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        ok = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch {
        ok = false;
      }
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  }, []);

  return (
    <div className={styles.coinDetail}>
      <div className={styles.coinDetailScroll} key={coin.id} ref={scrollRef}>
        <div className={styles.coinDetailInner}>
          <div className={styles.coinDetailHeader}>
            <div className={styles.coinDetailTitleRow}>
              <h1 className={styles.coinDetailTitle}>{coin.name}</h1>
              <button
                type="button"
                className={`${styles.coinDetailCopyBtn} ${copied ? styles.coinDetailCopyBtnCopied : ''}`}
                onClick={handleCopyLink}
                aria-label="复制当前钱币链接"
                title="复制链接"
              >
                {copied ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                  </svg>
                )}
                {copied && <span className={styles.coinDetailCopyTip}>已复制</span>}
              </button>
            </div>
            <div className={styles.coinDetailTags}>
              <span className={styles.coinDetailTag}>{coin.dynasty}</span>
              <span className={styles.coinDetailTag}>{coin.summary.historicalPeriod}</span>
              {isTop50Rare(coin.id) && <span className={styles.coinDetailTop50Badge}>五十大珍</span>}
              <span className={styles.coinDetailRarityBadge} data-rarity={rarityLevel} title={coin.summary.rarity}>
                {rarityText}
              </span>
            </div>
          </div>

          <div className={styles.coinDetailSummaryGrid}>
            <div className={styles.coinDetailSummaryCard}>
              <span className={styles.coinDetailSummaryLabel}>帝王 / 铸主</span>
              <span className={styles.coinDetailSummaryValue}>{coin.summary.ruler}</span>
            </div>
            <div className={styles.coinDetailSummaryCard}>
              <span className={styles.coinDetailSummaryLabel}>预估价值</span>
              <span className={`${styles.coinDetailSummaryValue} ${styles.coinDetailSummaryValuePrice}`}>
                {coin.summary.estimatedValue}
              </span>
            </div>
          </div>

          <section className={styles.coinDetailSection} aria-label="核心特征">
            <h2 className={`${styles.coinDetailSectionTitle} ${styles.coinDetailSectionTitleFeatures}`}>
              <span className={styles.coinDetailSectionIcon} aria-hidden="true">❖</span>
              核心特征
            </h2>
            <div
              className={styles.coinDetailSectionContent}
              dangerouslySetInnerHTML={{ __html: formattedSummary }}
            />
          </section>

          {loading && <DetailSkeleton />}

          {error && (
            <div className={styles.coinDetailError} role="alert">
              详情加载失败，
              <button className={styles.coinDetailRetryBtn} onClick={onRetry}>点击重试</button>
            </div>
          )}

          {detail && (
            <>
              {detail.images.main && <CoinImage coinName={coin.name} images={detail.images} />}
              <DetailSection title="铸造时间" content={detail.castingTime} icon="🕐" />
              <DetailSection title="材质成分" content={detail.material} icon="⚗" />
              <DetailSection title="尺寸重量" content={detail.dimensions} icon="📏" />
              <FeaturesGroupSection featuresGroup={detail.featuresGroup} />
              <DetailSection title="铸造工艺" content={detail.castingCraft} icon="⚒" />
              <DetailSection title="核心背景" content={detail.coreBackground} icon="📜" />
              <VariantsSection table={detail.variantsTable} coinId={coin.id} />
            </>
          )}

          <div className={styles.coinDetailDisclaimer}>
            <span className={styles.coinDetailDisclaimerIcon} aria-hidden="true">ℹ</span>
            价格数据仅供参考，实际价格受品相、版别、存世量的影响。
          </div>

          <nav className={styles.coinDetailNav} aria-label="上一枚 / 下一枚钱币">
            {prevCoin ? (
              <button
                type="button"
                className={`${styles.coinDetailNavBtn} ${styles.coinDetailNavPrev}`}
                onClick={() => onNavigate(prevCoin)}
              >
                <span className={styles.coinDetailNavArrow} aria-hidden="true">←</span>
                <span className={styles.coinDetailNavBody}>
                  <span className={styles.coinDetailNavLabel}>上一枚</span>
                  <span className={styles.coinDetailNavName}>{prevCoin.name}</span>
                </span>
              </button>
            ) : (
              <span className={styles.coinDetailNavBtnDisabled} />
            )}
            {nextCoin ? (
              <button
                type="button"
                className={`${styles.coinDetailNavBtn} ${styles.coinDetailNavNext}`}
                onClick={() => onNavigate(nextCoin)}
              >
                <span className={styles.coinDetailNavBody}>
                  <span className={styles.coinDetailNavLabel}>下一枚</span>
                  <span className={styles.coinDetailNavName}>{nextCoin.name}</span>
                </span>
                <span className={styles.coinDetailNavArrow} aria-hidden="true">→</span>
              </button>
            ) : (
              <span className={styles.coinDetailNavBtnDisabled} />
            )}
          </nav>
        </div>
      </div>

      {showBackTop && (
        <button
          type="button"
          className={styles.coinDetailBackTop}
          onClick={handleBackTop}
          aria-label="回到顶部"
          title="回到顶部"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path d="M12 19V5" />
            <path d="M5 12l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
});

interface DetailSectionProps {
  title: string;
  content: string;
  icon: string;
}

const DetailSection = memo(function DetailSection({ title, content, icon }: DetailSectionProps) {
  // Hook 须先于判空早退，避免条件 Hook
  const html = useMemo(() => (content ? formatContent(content) : ''), [content]);
  if (!content) return null;
  return (
    <section className={styles.coinDetailSection} aria-label={title}>
      <h2 className={styles.coinDetailSectionTitle}>
        <span className={styles.coinDetailSectionIcon} aria-hidden="true">{icon}</span>
        {title}
      </h2>
      <div className={styles.coinDetailSectionContent} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
});

interface FeaturesGroupSectionProps {
  featuresGroup: FeaturesGroup;
}

const FEATURES_GROUP_ITEMS: { key: keyof FeaturesGroup; label: string; icon: string }[] = [
  { key: 'common', label: '钱币特征', icon: '●' },
  { key: 'obverse', label: '面特征', icon: '◎' },
  { key: 'reverse', label: '背特征', icon: '◉' },
];

const FeaturesGroupSection = memo(function FeaturesGroupSection({ featuresGroup }: FeaturesGroupSectionProps) {
  // 一次遍历完成富文本转换并记忆化（早退判空在 Hook 之后）
  const renderedItems = useMemo(
    () =>
      FEATURES_GROUP_ITEMS.flatMap(({ key, label, icon }) => {
        const content = featuresGroup[key];
        if (!content) return [];
        return [{ key, label, icon, html: formatContent(content) }];
      }),
    [featuresGroup],
  );
  if (renderedItems.length === 0) return null;

  return (
    <section className={styles.coinDetailSection} aria-label="面背特征">
      <h2 className={styles.coinDetailSectionTitle}>
        <span className={styles.coinDetailSectionIcon} aria-hidden="true">🔍</span>
        面背特征
      </h2>
      <div className={styles.featuresGroupContainer}>
        {renderedItems.map(({ key, label, icon, html }) => (
          <div key={key} className={styles.featuresSubSection}>
            <div className={styles.featuresSubTitle}>
              <span className={styles.featuresSubIcon} aria-hidden="true">{icon}</span>
              {label}
            </div>
            <div
              className={styles.featuresSubContent}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </div>
        ))}
      </div>
    </section>
  );
});

interface VariantGradeTagsProps {
  grade: string;
  isTop50: boolean;
}

/** 品相等级标签组：稀有度等级（金属色阶）+ 品相（奖牌色）+ 五十大珍（朱金） */
const VariantGradeTags = memo(function VariantGradeTags({ grade, isTop50 }: VariantGradeTagsProps) {
  const info = useMemo(() => parseVariantGrade(grade), [grade]);
  if (!info) return null;

  return (
    <span className={styles.coinDetailGradeTags}>
      {info.levelText && (
        <span className={styles.coinDetailGradeTag} data-level={info.levelRank}>
          {info.levelText}
        </span>
      )}
      {info.conditionText && (
        <span className={styles.coinDetailGradeTag} data-condition={info.conditionRank}>
          {info.conditionText}
        </span>
      )}
      {isTop50 && <span className={styles.coinDetailGradeTagTop50}>五十大珍</span>}
    </span>
  );
});

interface VariantsSectionProps {
  table: VariantTableRow[];
  coinId: string;
}

const VariantsSection = memo(function VariantsSection({ table, coinId }: VariantsSectionProps) {
  const isTop50 = useMemo(() => isTop50Rare(coinId), [coinId]);

  const groupedRows = useMemo(() => {
    if (!table || table.length === 0) return null;

    const groups: { variant: string; variantHtml: string; descriptionHtml: string; rows: { grade: string; priceRange: string; notes: string }[] }[] = [];
    for (const row of table) {
      const last = groups[groups.length - 1];
      if (last && last.variant === row.variant) {
        last.rows.push({ grade: row.grade, priceRange: row.priceRange, notes: row.notes });
      } else {
        groups.push({
          variant: row.variant,
          variantHtml: formatContent(row.variant),
          descriptionHtml: formatContent(row.description),
          rows: [{ grade: row.grade, priceRange: row.priceRange, notes: row.notes }],
        });
      }
    }
    return groups;
  }, [table]);

  if (!groupedRows) return null;

  return (
    <section className={styles.coinDetailSection} aria-label="版别体系">
      <h2 className={styles.coinDetailSectionTitle}>
        <span className={styles.coinDetailSectionIcon} aria-hidden="true">🏷</span>
        版别体系
      </h2>
      <div className={styles.coinDetailTableWrapper}>
        <table className={`${styles.coinDetailTable} ${styles.coinDetailVariantsTable}`}>
          <thead>
            <tr>
              <th>版别</th>
              <th>特征描述</th>
              <th>品相等级</th>
              <th>参考价格</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {groupedRows.map((group, gi) =>
              group.rows.map((row, ri) => (
                <tr key={`${gi}-${ri}`}>
                  {ri === 0 && (
                    <>
                      <td
                        className={styles.coinDetailVariantCell}
                        rowSpan={group.rows.length}
                        dangerouslySetInnerHTML={{ __html: group.variantHtml }}
                      />
                      <td
                        className={styles.coinDetailDescCell}
                        rowSpan={group.rows.length}
                        dangerouslySetInnerHTML={{ __html: group.descriptionHtml }}
                      />
                    </>
                  )}
                  <td className={styles.coinDetailGradeCell}>
                    <VariantGradeTags grade={row.grade} isTop50={isTop50} />
                  </td>
                  <td className={styles.coinDetailPrice}>{row.priceRange}</td>
                  <td>{row.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
});
