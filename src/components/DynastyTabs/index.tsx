import { memo, useRef, useEffect } from 'react';
import type { DynastyData } from '../../types';
import styles from './index.module.scss';

interface DynastyTabsProps {
  dynasties: DynastyData[];
  activeDynastyIndex: number;
  onSelect: (index: number) => void;
}

export default memo(function DynastyTabs({ dynasties, activeDynastyIndex, onSelect }: DynastyTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const tab = activeTabRef.current;
      const scrollLeft = tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeDynastyIndex]);

  return (
    <div className={styles.dynastyTabs} ref={tabsRef} role="tablist" aria-label="朝代选择">
      {dynasties.map((d, idx) => (
        <button
          key={d.dynastyIndex}
          ref={idx === activeDynastyIndex ? activeTabRef : null}
          role="tab"
          aria-selected={idx === activeDynastyIndex}
          className={`${styles.dynastyTab} ${idx === activeDynastyIndex ? styles.dynastyTabActive : ''}`}
          onClick={() => onSelect(idx)}
          title={`${d.dynasty} (${d.coins.length}枚)`}
        >
          <span className={styles.dynastyTabName}>{d.dynasty.replace('钱币', '')}</span>
          <span className={styles.dynastyTabCount}>{d.coins.length}</span>
        </button>
      ))}
    </div>
  );
});
