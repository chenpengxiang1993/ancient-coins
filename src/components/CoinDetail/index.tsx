import { memo, useMemo } from 'react';
import type { Coin, CoinDetail as CoinDetailType, ValueTableRow } from '../../types';
import { formatContent } from '../../utils/format';
import { getRarityLevel } from '../../utils/rarity';
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
            <DetailSection title="面背特征" content={detail.obverseFeatures} icon="🔍" />
            <DetailSection title="铸造工艺" content={detail.castingCraft} icon="⚒" />
            <DetailSection title="核心背景" content={detail.coreBackground} icon="📜" />
            <DetailSection title="版别体系" content={detail.variants} icon="🏷" />
            <ValueSection text={detail.valueReference} table={detail.valueTable} />
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

interface ValueSectionProps {
  text: string;
  table: ValueTableRow[];
}

const ValueSection = memo(function ValueSection({ text, table }: ValueSectionProps) {
  if (!text && (!table || table.length === 0)) return null;
  const html = useMemo(() => formatContent(text), [text]);
  const formattedRows = useMemo(
    () => table.map(row => ({ ...row, variantHtml: formatContent(row.variant) })),
    [table]
  );

  return (
    <div className={styles.coinDetailSection}>
      <div className={styles.coinDetailSectionTitle}>
        <span className={styles.coinDetailSectionIcon}>💰</span>
        价值参考
      </div>
      {text && (
        <div className={styles.coinDetailSectionContent} dangerouslySetInnerHTML={{ __html: html }} />
      )}
      {formattedRows.length > 0 && (
        <div className={styles.coinDetailTableWrapper}>
          <table className={styles.coinDetailTable}>
            <thead>
              <tr>
                <th>版别</th>
                <th>品相等级</th>
                <th>参考价格区间</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {formattedRows.map((row, idx) => (
                <tr key={idx}>
                  <td dangerouslySetInnerHTML={{ __html: row.variantHtml }} />
                  <td>{row.grade}</td>
                  <td className={styles.coinDetailPrice}>{row.priceRange}</td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});
