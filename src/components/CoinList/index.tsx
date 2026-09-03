import { memo, useRef, useEffect, useMemo, useState, useCallback } from 'react';
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
  const showSubGroupHeaders = groups.length > 1;

  // 手风琴展开状态：仅记录用户手动切换过的分组，未记录的走自动规则
  const [toggled, setToggled] = useState<Record<string, boolean>>({});

  // 切换朝代标签（分组集合变化）时清空手动状态，避免跨类目残留
  useEffect(() => {
    setToggled({});
  }, [groups]);

  // 自动展开规则：选中币所在组展开，其余默认仅第一组展开
  const isAutoOpen = useCallback(
    (group: CoinGroup): boolean =>
      group.coins.some((coin) => coin.id === selectedCoinId) || group === groups[0],
    [groups, selectedCoinId]
  );

  const isExpanded = useCallback(
    (group: CoinGroup): boolean => {
      if (!showSubGroupHeaders) return true;
      return group.dynasty in toggled ? toggled[group.dynasty] : isAutoOpen(group);
    },
    [showSubGroupHeaders, toggled, isAutoOpen]
  );

  const handleGroupToggle = useCallback(
    (group: CoinGroup) => {
      setToggled((prev) => ({ ...prev, [group.dynasty]: !isExpanded(group) }));
    },
    [isExpanded]
  );

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

  return (
    <div className={styles.coinList}>
      <div className={styles.coinListHeader}>
        <span className={styles.coinListTotal}>共 {total} 枚</span>
      </div>
      <div className={styles.coinListItems} ref={itemsRef} role="listbox" aria-label="钱币列表">
        {groups.map((group) => {
          const expanded = isExpanded(group);
          return (
            <div key={group.dynasty} className={styles.coinSubGroup}>
              {showSubGroupHeaders && (
                <button
                  type="button"
                  className={styles.coinSubGroupHeader}
                  aria-expanded={expanded}
                  onClick={() => handleGroupToggle(group)}
                >
                  <span className={styles.coinSubGroupName}>{group.dynasty}</span>
                  <span className={styles.coinSubGroupMeta}>
                    <span className={styles.coinSubGroupCount}>{group.coins.length}</span>
                    <span
                      className={`${styles.coinSubGroupChevron} ${expanded ? styles.coinSubGroupChevronOpen : ''}`}
                      aria-hidden="true"
                    />
                  </span>
                </button>
              )}
              {expanded &&
                group.coins.map((coin) => (
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
          );
        })}
      </div>
    </div>
  );
});
