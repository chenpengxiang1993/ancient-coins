import { memo, useRef, useEffect } from 'react';
import type { Coin } from '../../types';
import { getRarityLevel } from '../../utils/rarity';
import styles from './index.module.scss';

interface CoinListProps {
  coins: Coin[];
  selectedCoinId: string | null;
  onSelect: (coin: Coin) => void;
}

export default memo(function CoinList({ coins, selectedCoinId, onSelect }: CoinListProps) {
  const itemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (itemsRef.current) itemsRef.current.scrollTop = 0;
  }, [coins]);

  useEffect(() => {
    if (!selectedCoinId || !itemsRef.current) return;
    const el = itemsRef.current.querySelector(`[data-coin-id="${selectedCoinId}"]`);
    if (el) {
      el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedCoinId]);

  if (coins.length === 0) {
    return (
      <div className={styles.coinList}>
        <div className={styles.coinListEmpty}>暂无钱币数据</div>
      </div>
    );
  }

  return (
    <div className={styles.coinList}>
      <div className={styles.coinListHeader}>
        <span className={styles.coinListTotal}>共 {coins.length} 枚</span>
      </div>
      <div className={styles.coinListItems} ref={itemsRef} role="listbox" aria-label="钱币列表">
        {coins.map(coin => (
          <button
            key={coin.id}
            data-coin-id={coin.id}
            role="option"
            aria-selected={selectedCoinId === coin.id}
            className={`${styles.coinItem} ${selectedCoinId === coin.id ? styles.coinItemActive : ''}`}
            onClick={() => onSelect(coin)}
          >
            <div className={styles.coinItemContent}>
              <div className={styles.coinItemName}>{coin.name}</div>
              <div className={styles.coinItemMeta}>
                <span className={styles.coinItemRarity} data-rarity={getRarityLevel(coin.summary.rarity)}>{coin.summary.rarity}</span>
              </div>
              <div className={styles.coinItemFeatures}>{coin.summary.coreFeatures}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
