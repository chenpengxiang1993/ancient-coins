import { memo, useMemo } from 'react';
import type { Coin, CoinDetail as CoinDetailType, VariantTableRow } from '../../types';
import { formatContent } from '../../utils/format';
import { getRarityLevel, isTop50Rare } from '../../utils/rarity';
import styles from './index.module.scss';

interface CoinDetailProps {
  coin: Coin;
  detail: CoinDetailType | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}

export default memo(function CoinDetail({ coin, detail, loading, error, onRetry }: CoinDetailProps) {
  const rarityLevel = useMemo(() => getRarityLevel(coin.summary.rarity), [coin.summary.rarity]);
  const formattedSummary = useMemo(() => formatContent(coin.summary.coreFeatures), [coin.summary.coreFeatures]);

  return (
    <div className={styles.coinDetail}>
      <div className={styles.coinDetailScroll} key={coin.id}>
        <div className={styles.coinDetailHeader}>
          <h1 className={styles.coinDetailTitle}>{coin.name}</h1>
          <div className={styles.coinDetailTags}>
            <span className={styles.coinDetailTag}>{coin.dynasty}</span>
            <span className={styles.coinDetailTag}>{coin.summary.historicalPeriod}</span>
            {isTop50Rare(coin.id) && <span className={styles.coinDetailTop50Badge}>五十大珍</span>}
            <span className={styles.coinDetailRarityBadge} data-rarity={rarityLevel}>
              {coin.summary.rarity}
            </span>
          </div>
        </div>

        <div className={styles.coinDetailSummaryGrid}>
          <div className={styles.coinDetailSummaryCard}>
            <span className={styles.coinDetailSummaryLabel}>帝王/铸主</span>
            <span className={styles.coinDetailSummaryValue}>{coin.summary.ruler}</span>
          </div>
          <div className={styles.coinDetailSummaryCard}>
            <span className={styles.coinDetailSummaryLabel}>预估价值</span>
            <span className={`${styles.coinDetailSummaryValue} ${styles.coinDetailSummaryValuePrice}`}>
              {coin.summary.estimatedValue}
            </span>
          </div>
        </div>

        <div className={styles.coinDetailSection}>
          <div className={`${styles.coinDetailSectionTitle} ${styles.coinDetailSectionTitleFeatures}`}>
            核心特征
          </div>
          <div
            className={styles.coinDetailSectionContent}
            dangerouslySetInnerHTML={{ __html: formattedSummary }}
          />
        </div>

        {loading && (
          <div className={styles.coinDetailLoading} role="status" aria-live="polite">加载详情中…</div>
        )}

        {error && (
          <div className={styles.coinDetailError} role="alert">
            加载失败，<button className={styles.coinDetailRetryBtn} onClick={onRetry}>点击重试</button>
          </div>
        )}

        {detail && (
          <>
            <DetailSection title="铸造时间" content={detail.castingTime} icon="🕐" />
            <DetailSection title="材质成分" content={detail.material} icon="⚗" />
            <DetailSection title="尺寸重量" content={detail.dimensions} icon="📏" />
            <DetailSection title="面特征" content={detail.obverseFeatures} icon="🔍" />
            <DetailSection title="背特征" content={detail.reverseFeatures} icon="🔎" />
            <DetailSection title="铸造工艺" content={detail.castingCraft} icon="⚒" />
            <DetailSection title="核心背景" content={detail.coreBackground} icon="📜" />
            <VariantsSection table={detail.variantsTable} />
          </>
        )}

        <div className={styles.coinDetailDisclaimer}>
          价格数据仅供参考，实际价格受品相、版别、存世量的影响。
        </div>
      </div>
    </div>
  );
});

interface DetailSectionProps {
  title: string;
  content: string;
  icon: string;
}

const DetailSection = memo(function DetailSection({ title, content, icon }: DetailSectionProps) {
  if (!content) return null;
  const html = useMemo(() => formatContent(content), [content]);
  return (
    <div className={styles.coinDetailSection}>
      <div className={styles.coinDetailSectionTitle}>
        <span className={styles.coinDetailSectionIcon}>{icon}</span>
        {title}
      </div>
      <div className={styles.coinDetailSectionContent} dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
});

interface VariantsSectionProps {
  table: VariantTableRow[];
}

const VariantsSection = memo(function VariantsSection({ table }: VariantsSectionProps) {
  if (!table || table.length === 0) return null;

  const groupedRows = useMemo(() => {
    const groups: { variant: string; descriptionHtml: string; rows: { grade: string; priceRange: string; notes: string }[] }[] = [];
    for (const row of table) {
      const last = groups[groups.length - 1];
      if (last && last.variant === row.variant) {
        last.rows.push({ grade: row.grade, priceRange: row.priceRange, notes: row.notes });
      } else {
        groups.push({
          variant: row.variant,
          descriptionHtml: formatContent(row.description),
          rows: [{ grade: row.grade, priceRange: row.priceRange, notes: row.notes }],
        });
      }
    }
    return groups;
  }, [table]);

  return (
    <div className={styles.coinDetailSection}>
      <div className={styles.coinDetailSectionTitle}>
        <span className={styles.coinDetailSectionIcon}>🏷</span>
        版别体系
      </div>
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
                        dangerouslySetInnerHTML={{ __html: formatContent(group.variant) }}
                      />
                      <td
                        className={styles.coinDetailDescCell}
                        rowSpan={group.rows.length}
                        dangerouslySetInnerHTML={{ __html: group.descriptionHtml }}
                      />
                    </>
                  )}
                  <td className={styles.coinDetailGradeCell}>{row.grade}</td>
                  <td className={styles.coinDetailPrice}>{row.priceRange}</td>
                  <td>{row.notes}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
