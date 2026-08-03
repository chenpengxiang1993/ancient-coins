import { memo, useRef, useEffect } from 'react';
import styles from './index.module.scss';

export interface DynastyTabItem {
  label: string;
  count: number;
}

interface DynastyTabsProps {
  tabs: DynastyTabItem[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export default memo(function DynastyTabs({ tabs, activeIndex, onSelect }: DynastyTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (activeTabRef.current && tabsRef.current) {
      const container = tabsRef.current;
      const tab = activeTabRef.current;
      const scrollLeft = tab.offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [activeIndex]);

  return (
    <div className={styles.dynastyTabs} ref={tabsRef} role="tablist" aria-label="历史时期选择">
      {tabs.map((tab, idx) => (
        <button
          key={`${tab.label}-${idx}`}
          ref={idx === activeIndex ? activeTabRef : null}
          role="tab"
          aria-selected={idx === activeIndex}
          className={`${styles.dynastyTab} ${idx === activeIndex ? styles.dynastyTabActive : ''}`}
          onClick={() => onSelect(idx)}
          title={`${tab.label} (${tab.count}枚)`}
        >
          <span className={styles.dynastyTabName}>{tab.label}</span>
          <span className={styles.dynastyTabCount}>{tab.count}</span>
        </button>
      ))}
    </div>
  );
});
