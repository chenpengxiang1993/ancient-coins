import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import type { Coin } from './types';
import DynastyTabs from './components/DynastyTabs';
import type { DynastyTabItem } from './components/DynastyTabs';
import CoinList from './components/CoinList';
import SearchBar from './components/SearchBar';
import { DYNASTY_TAB_LABELS } from './constants/dynastyTabs';
import { useCoinDetail } from './hooks/useCoinDetail';
import { useSummaryData } from './hooks/useSummaryData';
import { useStaleAutoRefresh } from './hooks/useStaleAutoRefresh';
import { encodeCoinPath, parseCoinPath } from './utils/coinRoute';
import { warmupSearchIndex } from './utils/search';
import styles from './App.module.scss';

const CoinDetail = lazy(() => import('./components/CoinDetail'));

/** 应用级骨架屏（首次加载 summary 时展示，替代纯文字「加载中…」） */
function AppSkeleton() {
  return (
    <div className={styles.app} aria-label="正在加载" role="status">
      <div className={styles.appHeader}>
        <div className={styles.appHeaderTop}>
          <div className={styles.appBrand}>
            <span className={styles.appLogo} aria-hidden="true" />
            <div>
              <div className={`${styles.skel} ${styles.skelTitle}`} />
              <div className={`${styles.skel} ${styles.skelSubtitle}`} />
            </div>
          </div>
          <div className={`${styles.skel} ${styles.skelSearch}`} />
        </div>
      </div>
      <div className={styles.skelTabsRow}>
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className={`${styles.skel} ${styles.skelTab}`} />
        ))}
      </div>
      <div className={styles.appContent}>
        <div className={`${styles.appSidebar} ${styles.skelSidebar}`}>
          <div className={`${styles.skel} ${styles.skelListHeader}`} />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skelListItem}>
              <span className={`${styles.skel} ${styles.skelThumb}`} />
              <div className={styles.skelListText}>
                <div className={`${styles.skel} ${styles.skelListName}`} />
                <div className={`${styles.skel} ${styles.skelListFeature}`} />
              </div>
            </div>
          ))}
        </div>
        <div className={`${styles.appDetail} ${styles.skelDetail}`}>
          <div className={`${styles.skel} ${styles.skelDetailTitle}`} />
          <div className={styles.skelDetailTags}>
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`${styles.skel} ${styles.skelDetailTag}`} />
            ))}
          </div>
          <div className={styles.skelDetailGrid}>
            <div className={`${styles.skel} ${styles.skelDetailCard}`} />
            <div className={`${styles.skel} ${styles.skelDetailCard}`} />
          </div>
          <div className={`${styles.skel} ${styles.skelDetailImage}`} />
          <div className={`${styles.skel} ${styles.skelDetailLine}`} />
          <div className={`${styles.skel} ${styles.skelDetailLine}`} />
          <div className={`${styles.skel} ${styles.skelDetailLineShort}`} />
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { data: allData, loading: summaryLoading, error: summaryError } = useSummaryData();
  const [activeDynastyIndex, setActiveDynastyIndex] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 页面空闲超时后切回时自动刷新
  useStaleAutoRefresh();

  const activeDynasty = useMemo(
    () => allData?.[activeDynastyIndex],
    [allData, activeDynastyIndex]
  );

  // 标签列表（label + 该文件钱币总数）
  const tabs = useMemo<DynastyTabItem[]>(() => {
    if (!allData) return [];
    return allData.map((dynasty, idx) => ({
      label: DYNASTY_TAB_LABELS[idx] ?? dynasty.dynasty,
      count: dynasty.coins.length,
    }));
  }, [allData]);

  // 首次加载：优先从 URL 路径恢复刷新前的钱币页面，否则回退到首枚
  useEffect(() => {
    if (allData && !selectedCoin) {
      const restored = parseCoinPath(window.location.pathname, allData);
      if (restored) {
        setActiveDynastyIndex(restored.dynastyIndex);
        setSelectedCoin(restored.coin);
      } else {
        setSelectedCoin(allData[0].coins[0]);
      }
    }
  }, [allData, selectedCoin]);

  // 选中钱币变化时同步到 URL 路径（replaceState 不污染历史记录）
  useEffect(() => {
    if (selectedCoin) {
      window.history.replaceState(null, '', encodeCoinPath(selectedCoin));
    }
  }, [selectedCoin]);

  const { detail, loading, error, retry } = useCoinDetail(
    selectedCoin?.dynastyIndex ?? 0,
    selectedCoin?.id ?? '',
    Boolean(selectedCoin)
  );

  useEffect(() => {
    if (allData) {
      warmupSearchIndex(allData);
    }
  }, [allData]);

  // 当前钱币在朝代内的位置，用于上/下枚导航与键盘 ←/→ 切换
  const coinIndex = useMemo(() => {
    if (!activeDynasty || !selectedCoin) return -1;
    return activeDynasty.coins.findIndex((c) => c.id === selectedCoin.id);
  }, [activeDynasty, selectedCoin]);

  const prevCoin = useMemo(
    () => (coinIndex > 0 && activeDynasty ? activeDynasty.coins[coinIndex - 1] : null),
    [coinIndex, activeDynasty]
  );
  const nextCoin = useMemo(
    () =>
      coinIndex >= 0 && activeDynasty && coinIndex < activeDynasty.coins.length - 1
        ? activeDynasty.coins[coinIndex + 1]
        : null,
    [coinIndex, activeDynasty]
  );

  const handleDynastySelect = useCallback((index: number) => {
    setActiveDynastyIndex(index);
    if (allData) {
      setSelectedCoin(allData[index].coins[0]);
    }
  }, [allData]);

  const handleCoinSelect = useCallback((coin: Coin) => {
    setSelectedCoin(coin);
    setSidebarOpen(false);
  }, []);

  const handleSearchSelect = useCallback((dynastyIndex: number, coinId: string) => {
    setActiveDynastyIndex(dynastyIndex);
    const coin = allData?.[dynastyIndex]?.coins.find(c => c.id === coinId);
    if (coin) {
      setSelectedCoin(coin);
    }
  }, [allData]);

  // 键盘快捷键：/ 聚焦搜索；←/→ 切换上/下一枚钱币（输入状态不拦截）
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName ?? '';
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable === true;
      if (isTyping) return;

      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (!selectedCoin || !activeDynasty) return;
        const coins = activeDynasty.coins;
        const idx = coins.findIndex((c) => c.id === selectedCoin.id);
        if (idx === -1) return;
        const targetCoin = e.key === 'ArrowRight' ? coins[idx + 1] : coins[idx - 1];
        if (targetCoin) {
          e.preventDefault();
          handleCoinSelect(targetCoin);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedCoin, activeDynasty, handleCoinSelect]);

  if (summaryLoading) {
    return <AppSkeleton />;
  }

  if (summaryError || !allData) {
    return (
      <div className={styles.appError}>
        <div className={styles.appErrorInner}>
          <span className={styles.appErrorIcon} aria-hidden="true">⚠</span>
          <p className={styles.appErrorText}>数据加载失败，请刷新页面重试</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <a href="#coin-detail" className={styles.skipLink}>跳转到钱币详情</a>
      <header className={styles.appHeader}>
        <div className={styles.appHeaderTop}>
          <div className={styles.appBrand}>
            <button
              className={styles.sidebarToggle}
              onClick={() => setSidebarOpen(prev => !prev)}
              aria-label={sidebarOpen ? '关闭列表' : '打开列表'}
              aria-expanded={sidebarOpen}
            >
              <span className={styles.sidebarToggleIcon} />
            </button>
            <span className={styles.appLogo} aria-hidden="true" />
            <div className={styles.appBrandText}>
              <h1 className={styles.appTitle}>中国古代钱币图鉴</h1>
              <span className={styles.appSubtitle}>先秦至清代 · 金属铸币全集 · 共 {allData.reduce((n, d) => n + d.coins.length, 0)} 枚</span>
            </div>
          </div>
          <SearchBar allData={allData} onSelectResult={handleSearchSelect} inputRef={searchInputRef} />
        </div>
      </header>

      <DynastyTabs
        tabs={tabs}
        activeIndex={activeDynastyIndex}
        onSelect={handleDynastySelect}
      />

      <main className={styles.appContent}>
        <div
          className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayVisible : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <nav className={`${styles.appSidebar} ${sidebarOpen ? styles.appSidebarOpen : ''}`} aria-label="钱币列表">
          <CoinList
            coins={activeDynasty?.coins ?? []}
            selectedCoinId={selectedCoin?.id ?? null}
            onSelect={handleCoinSelect}
          />
        </nav>
        <section className={styles.appDetail} id="coin-detail">
          {selectedCoin ? (
            <Suspense fallback={<div className={styles.coinDetailLoading}>加载中…</div>}>
              <CoinDetail
                coin={selectedCoin}
                detail={detail}
                loading={loading}
                error={error}
                onRetry={retry}
                prevCoin={prevCoin}
                nextCoin={nextCoin}
                onNavigate={handleCoinSelect}
              />
            </Suspense>
          ) : (
            <div className={styles.coinDetailLoading}>加载中…</div>
          )}
        </section>
      </main>
    </div>
  );
}
