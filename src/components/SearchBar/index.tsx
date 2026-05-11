import { memo, useState, useRef, useEffect, useCallback } from 'react';
import type { DynastyData, SearchResult } from '../../types';
import { searchCoins } from '../../utils/search';
import { useDebounce } from '../../hooks/useDebounce';
import styles from './index.module.scss';

interface SearchBarProps {
  allData: DynastyData[];
  onSelectResult: (dynastyIndex: number, coinId: string) => void;
}

export default memo(function SearchBar({ allData, onSelectResult }: SearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback((kw: string) => {
    if (!kw.trim()) {
      setResults([]);
      setTotalCount(0);
      setIsOpen(false);
      return;
    }
    const searchResults = searchCoins(allData, kw);
    setTotalCount(searchResults.length);
    setResults(searchResults.slice(0, 20));
    setIsOpen(searchResults.length > 0);
    setHighlightIndex(-1);
  }, [allData]);

  const debouncedSearch = useDebounce(doSearch, 200);

  const handleInputChange = useCallback((value: string) => {
    setKeyword(value);
    if (!value.trim()) {
      setResults([]);
      setTotalCount(0);
      setIsOpen(false);
      return;
    }
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleSelect = useCallback((result: SearchResult) => {
    onSelectResult(result.coin.dynastyIndex, result.coin.id);
    setKeyword('');
    setResults([]);
    setTotalCount(0);
    setIsOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.blur();
  }, [onSelectResult]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }, [isOpen, results, highlightIndex, handleSelect]);

  return (
    <div className={styles.searchBar} ref={wrapperRef}>
      <div className={styles.searchBarInputWrapper}>
        <svg className={styles.searchBarIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          className={styles.searchBarInput}
          type="text"
          role="combobox"
          aria-label="搜索钱币"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-activedescendant={highlightIndex >= 0 ? `search-result-${highlightIndex}` : undefined}
          placeholder="搜索钱币名称、朝代、特征…"
          value={keyword}
          onChange={e => handleInputChange(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
        />
        {keyword && (
          <button className={styles.searchBarClear} onClick={() => { setKeyword(''); setResults([]); setTotalCount(0); setIsOpen(false); }} aria-label="清除搜索">
            ✕
          </button>
        )}
      </div>
      {isOpen && results.length > 0 && (
        <div className={styles.searchBarDropdown} ref={listRef} role="listbox" aria-label="搜索结果">
          <div className={styles.searchBarDropdownHeader}>
            找到 {totalCount} 枚相关钱币{totalCount > 20 ? '，显示前 20 枚' : ''}
          </div>
          {results.map((result, idx) => (
            <button
              key={result.coin.id}
              id={`search-result-${idx}`}
              role="option"
              aria-selected={idx === highlightIndex}
              className={`${styles.searchBarResult} ${idx === highlightIndex ? styles.searchBarResultHighlight : ''}`}
              onClick={() => handleSelect(result)}
            >
              <div className={styles.searchBarResultName}>{result.coin.name}</div>
              <div className={styles.searchBarResultMeta}>
                <span className={styles.searchBarResultDynasty}>{result.coin.dynasty}</span>
                <span className={styles.searchBarResultField}>匹配: {result.matchField}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
});
