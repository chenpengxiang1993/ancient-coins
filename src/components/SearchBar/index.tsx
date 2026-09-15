import { memo, useState, useRef, useEffect, useCallback } from "react";
import type { Ref } from "react";
import type { DynastyData, SearchResult } from "../../types";
import { searchCoins } from "../../utils/search";
import { getRarityLevel, isTop50Rare } from "../../utils/rarity";
import { standardizeRarityText } from "../../utils/grade";
import { IRON_CATEGORY_INDEX } from "../../constants/dynastyTabs";
import { useDebounce } from "../../hooks/useDebounce";
import styles from "./index.module.scss";

interface SearchBarProps {
  allData: DynastyData[];
  onSelectResult: (dynastyIndex: number, coinId: string) => void;
  /** 外部（App）持有的输入框 ref，用于全局键盘快捷键聚焦 */
  inputRef?: Ref<HTMLInputElement>;
}

/** 对匹配子串做 <mark> 高亮（已做 HTML 转义，避免注入） */
function highlightName(text: string, keyword: string): string {
  const kw = keyword.trim().toLowerCase();
  if (!kw || !text) return text;
  const idx = text.toLowerCase().indexOf(kw);
  if (idx === -1) return text;
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return (
    escaped.slice(0, idx) +
    `<mark>${escaped.slice(idx, idx + kw.length)}</mark>` +
    escaped.slice(idx + kw.length)
  );
}

export default memo(function SearchBar({
  allData,
  onSelectResult,
  inputRef,
}: SearchBarProps) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // 合并外部与内部 ref（RefObject 的 current 为只读，需经可变对象断言赋值）
  const setInputRef = useCallback(
    (node: HTMLInputElement | null) => {
      internalInputRef.current = node;
      if (typeof inputRef === "function") {
        inputRef(node);
      } else if (inputRef && "current" in inputRef) {
        (inputRef as { current: HTMLInputElement | null }).current = node;
      }
    },
    [inputRef],
  );

  const doSearch = useCallback(
    (kw: string) => {
      if (!kw.trim()) {
        setResults([]);
        setTotalCount(0);
        setIsOpen(false);
        return;
      }
      const searchResults = searchCoins(allData, kw);
      setTotalCount(searchResults.length);
      setResults(searchResults.slice(0, 20));
      setIsOpen(true);
      setHighlightIndex(-1);
    },
    [allData],
  );

  const debouncedSearch = useDebounce(doSearch, 200);

  const handleInputChange = useCallback(
    (value: string) => {
      setKeyword(value);
      if (!value.trim()) {
        setResults([]);
        setTotalCount(0);
        setIsOpen(false);
        return;
      }
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const handleSelect = useCallback(
    (result: SearchResult) => {
      onSelectResult(result.coin.dynastyIndex, result.coin.id);
      setKeyword("");
      setResults([]);
      setTotalCount(0);
      setIsOpen(false);
      setHighlightIndex(-1);
      internalInputRef.current?.blur();
    },
    [onSelectResult],
  );

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(document.activeElement)
      ) {
        setIsOpen(false);
      }
    }, 150);
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const items = listRef.current.children;
      if (items[highlightIndex]) {
        items[highlightIndex].scrollIntoView({ block: "nearest" });
      }
    }
  }, [highlightIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        setIsOpen(false);
        internalInputRef.current?.blur();
        return;
      }

      if (results.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && highlightIndex >= 0) {
        e.preventDefault();
        handleSelect(results[highlightIndex]);
      }
    },
    [isOpen, results, highlightIndex, handleSelect],
  );

  return (
    <div className={styles.searchBar} ref={wrapperRef}>
      <div className={styles.searchBarInputWrapper}>
        <svg
          className={styles.searchBarIcon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={setInputRef}
          className={styles.searchBarInput}
          type="text"
          role="combobox"
          aria-label="搜索钱币"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-activedescendant={
            highlightIndex >= 0 ? `search-result-${highlightIndex}` : undefined
          }
          placeholder="输入名称、铸主或拼音（kytb）搜索"
          value={keyword}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            if (results.length > 0 || (keyword.trim() && totalCount === 0))
              setIsOpen(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            handleBlur();
          }}
          onKeyDown={handleKeyDown}
        />
        {keyword ? (
          <button
            className={styles.searchBarClear}
            onClick={() => {
              setKeyword("");
              setResults([]);
              setTotalCount(0);
              setIsOpen(false);
            }}
            aria-label="清除搜索"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        ) : (
          !isFocused && (
            <kbd className={styles.searchBarShortcut} aria-hidden="true">/</kbd>
          )
        )}
      </div>
      {isOpen && (
        <div
          className={styles.searchBarDropdown}
          ref={listRef}
          role="listbox"
          aria-label="搜索结果"
        >
          {results.length > 0 ? (
            <>
              <div className={styles.searchBarDropdownHeader}>
                找到 {totalCount} 枚相关钱币
                {totalCount > 20 ? "，显示前 20 枚" : ""}
                <span className={styles.searchBarDropdownHint}>↑↓ 选择 · Enter 打开</span>
              </div>
              {results.map((result, idx) => (
                <button
                  key={result.coin.id}
                  id={`search-result-${idx}`}
                  role="option"
                  aria-selected={idx === highlightIndex}
                  className={`${styles.searchBarResult} ${idx === highlightIndex ? styles.searchBarResultHighlight : ""}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(result)}
                >
                  <img
                    src={result.coin.summary.thumbnail}
                    alt=""
                    className={styles.searchBarResultThumb}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div className={styles.searchBarResultMain}>
                    <div className={styles.searchBarResultName}>
                      <span
                        dangerouslySetInnerHTML={{ __html: highlightName(result.coin.name, keyword) }}
                      />
                      {result.coin.dynastyIndex === IRON_CATEGORY_INDEX && (
                        <span className={styles.searchBarResultIron}>铁钱</span>
                      )}
                      {isTop50Rare(result.coin.id) && (
                        <span className={styles.searchBarResultTop50}>五十大珍</span>
                      )}
                    </div>
                    <div className={styles.searchBarResultMeta}>
                      <span className={styles.searchBarResultDynasty}>
                        {result.coin.dynasty}
                      </span>
                      <span className={styles.searchBarResultField}>
                        匹配：{result.matchField}
                      </span>
                    </div>
                  </div>
                  <div className={styles.searchBarResultSide}>
                    <span className={styles.searchBarResultRarity} data-rarity={getRarityLevel(result.coin.summary.rarity)} title={result.coin.summary.rarity}>
                      {standardizeRarityText(result.coin.summary.rarity)}
                    </span>
                    <span className={styles.searchBarResultRuler}>
                      {result.coin.summary.ruler}
                    </span>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <div className={styles.searchBarEmpty}>
              <span className={styles.searchBarEmptyIcon} aria-hidden="true">⌕</span>
              未找到相关钱币，试试名称、铸主或拼音
            </div>
          )}
        </div>
      )}
    </div>
  );
});
