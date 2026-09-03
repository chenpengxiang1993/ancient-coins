import { useEffect } from 'react';

/**
 * useStaleAutoRefresh
 * 防呆机制：页面空闲超过阈值（1 小时）后，用户切回该标签页时自动刷新，
 * 保证看到的是最新数据。刷新后由 URL hash 恢复原浏览位置。
 */

/** 空闲阈值 */
const STALE_THRESHOLD_MS = 60 * 60 * 1000;

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'touchstart', 'scroll'] as const;

// 模块级时间戳：页面加载即视为活跃，避免刷新后立刻再次触发刷新形成循环
let lastActiveAt = Date.now();

export function useStaleAutoRefresh(): void {
  useEffect(() => {
    lastActiveAt = Date.now();

    const markActive = (): void => {
      lastActiveAt = Date.now();
    };

    const reloadIfStale = (): void => {
      if (Date.now() - lastActiveAt > STALE_THRESHOLD_MS) {
        window.location.reload();
      }
    };

    const handleVisibilityChange = (): void => {
      if (document.visibilityState === 'visible') reloadIfStale();
    };

    const handlePageShow = (e: PageTransitionEvent): void => {
      // bfcache 恢复的页面同样按空闲策略处理
      if (e.persisted) reloadIfStale();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, markActive, { passive: true });
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, markActive);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);
}
