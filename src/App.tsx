import { useState, useCallback, useEffect } from 'react';
import type { Coin, DynastyData } from './types';
import DynastyTabs from './components/DynastyTabs';
import CoinList from './components/CoinList';
import CoinDetail from './components/CoinDetail';
import SearchBar from './components/SearchBar';
import { useCoinDetail } from './hooks/useCoinDetail';
import { warmupSearchIndex } from './utils/search';
import summaryData from '../data/coins-summary.json';
import styles from './App.module.scss';

const allData: DynastyData[] = summaryData as DynastyData[];

export default function App() {
  const [activeDynastyIndex, setActiveDynastyIndex] = useState(0);
  const [selectedCoin, setSelectedCoin] = useState<Coin>(() => allData[0].coins[0]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeDynasty = allData[activeDynastyIndex];

  const { detail, loading, error, retry, prefetchDynasty } = useCoinDetail(
    selectedCoin.dynastyIndex,
    selectedCoin.id,
    true
  );

  useEffect(() => {
    prefetchDynasty(activeDynastyIndex);
  }, [activeDynastyIndex, prefetchDynasty]);

  useEffect(() => {
    warmupSearchIndex(allData);
  }, []);

  const handleDynastySelect = useCallback((index: number) => {
    setActiveDynastyIndex(index);
    setSelectedCoin(allData[index].coins[0]);
  }, []);

  const handleCoinSelect = useCallback((coin: Coin) => {
    setSelectedCoin(coin);
    setSidebarOpen(false);
  }, []);

  const handleSearchSelect = useCallback((dynastyIndex: number, coinId: string) => {
    setActiveDynastyIndex(dynastyIndex);
    const dynasty = allData[dynastyIndex];
    const coin = dynasty.coins.find(c => c.id === coinId);
    if (coin) {
      setSelectedCoin(coin);
    }
  }, []);

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
            >
              <span className={styles.sidebarToggleIcon} />
            </button>
            <h1 className={styles.appTitle}>中国古代钱币图鉴</h1>
          </div>
          <SearchBar allData={allData} onSelectResult={handleSearchSelect} />
        </div>
        <span className={styles.appSubtitle}>先秦至清代 · 金属铸币全集</span>
      </header>

      <DynastyTabs
        dynasties={allData}
        activeDynastyIndex={activeDynastyIndex}
        onSelect={handleDynastySelect}
      />

      <main className={styles.appContent}>
        <div
          className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.sidebarOverlayVisible : ''}`}
          onClick={() => setSidebarOpen(false)}
        />
        <nav className={`${styles.appSidebar} ${sidebarOpen ? styles.appSidebarOpen : ''}`} aria-label="钱币列表">
          <CoinList
            coins={activeDynasty.coins}
            selectedCoinId={selectedCoin?.id ?? null}
            onSelect={handleCoinSelect}
          />
        </nav>
        <section className={styles.appDetail} id="coin-detail">
          <CoinDetail coin={selectedCoin} detail={detail} loading={loading} error={error} onRetry={retry} />
        </section>
      </main>
    </div>
  );
}
