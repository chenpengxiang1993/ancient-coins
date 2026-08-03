import { memo, useRef, useEffect, useMemo } from 'react';
import type { Coin } from '../../types';
import { getRarityLevel, isTop50Rare } from '../../utils/rarity';
import styles from './index.module.scss';

interface CoinListProps {
  coins: Coin[]; // 当前 tab（文件）的全部钱币，可能含多个子朝代
  selectedCoinId: string | null;
  onSelect: (coin: Coin) => void;
}

interface CoinGroup {
  dynasty: string;
  coins: Coin[];
}

// 按子朝代（coin.dynasty）分组，保持出现顺序
function groupByDynasty(coins: Coin[]): CoinGroup[] {
  const groups: CoinGroup[] = [];
  const index = new Map<string, number>();
  for (const coin of coins) {
    let gi = index.get(coin.dynasty);
    if (gi === undefined) {
      gi = groups.length;
      index.set(coin.dynasty, gi);
      groups.push({ dynasty: coin.dynasty, coins: [] });
    }
    groups[gi].coins.push(coin);
  }
  return groups;
}

export default memo(function CoinList({ coins, selectedCoinId, onSelect }: CoinListProps) {
  const itemsRef = useRef<HTMLDivElement>(null);
  const groups = useMemo(() => groupByDynasty(coins), [coins]);
  const total = coins.length;

  useEffect(() => {
    if (itemsRef.current) itemsRef.current.scrollTop = 0;
  }, [coins]);

  useEffect(() => {
    if (!selectedCoinId || !itemsRef.current) return;
    const el = itemsRef.current.querySelector(`[data-coin-id="${selectedCoinId}"]`);
    if (el) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [selectedCoinId]);

  if (total === 0) {
    return (
      <div className={styles.coinList}>
        <div className={styles.coinListEmpty}>暂无钱币数据</div>
      </div>
    );
  }

  const showSubGroupHeaders = groups.length > 1;

  return (
    <div className={styles.coinList}>
      <div className={styles.coinListHeader}>
        <span className={styles.coinListTotal}>共 {total} 枚</span>
      </div>
      <div className={styles.coinListItems} ref={itemsRef} role="listbox" aria-label="钱币列表">
        {groups.map((group) => (
          <div key={group.dynasty} className={styles.coinSubGroup}>
            {showSubGroupHeaders && (
              <div className={styles.coinSubGroupHeader}>
                <span className={styles.coinSubGroupName}>{group.dynasty}</span>
                <span className={styles.coinSubGroupCount}>{group.coins.length}</span>
              </div>
            )}
            {group.coins.map((coin) => (
              <button
                key={coin.id}
                data-coin-id={coin.id}
                role="option"
                aria-selected={selectedCoinId === coin.id}
                className={`${styles.coinItem} ${selectedCoinId === coin.id ? styles.coinItemActive : ''}`}
                onClick={() => onSelect(coin)}
              >
                <div className={styles.coinItemContent}>
                  <div className={styles.coinItemNameRow}>
                    <span className={styles.coinItemName}>{coin.name}</span>
                    {isTop50Rare(coin.id) && <span className={styles.coinItemTop50}>五十大珍</span>}
                  </div>
                  <div className={styles.coinItemMeta}>
                    <span className={styles.coinItemRarity} data-rarity={getRarityLevel(coin.summary.rarity)}>{coin.summary.rarity}</span>
                  </div>
                  <div className={styles.coinItemFeatures}>{coin.summary.coreFeatures}</div>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
});
