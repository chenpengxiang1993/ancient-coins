import { useState, useEffect, useCallback, useRef } from 'react';
import type { CoinDetail } from '../types';

const cache = new Map<number, Record<string, CoinDetail>>();
const inflightRequests = new Map<number, Promise<Record<string, CoinDetail>>>();

async function fetchDynastyDetail(idx: number): Promise<Record<string, CoinDetail>> {
  const cached = cache.get(idx);
  if (cached) return cached;

  const inflight = inflightRequests.get(idx);
  if (inflight) return inflight;

  const promise = fetch(`/data/detail/${idx}.json`)
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: Record<string, CoinDetail>) => {
      cache.set(idx, data);
      inflightRequests.delete(idx);
      return data;
    })
    .catch((err) => {
      inflightRequests.delete(idx);
      throw err;
    });

  inflightRequests.set(idx, promise);
  return promise;
}

export function useCoinDetail(dynastyIndex: number, coinId: string, hasDetail: boolean) {
  const [detail, setDetail] = useState<CoinDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!hasDetail || !coinId) {
      setDetail(null);
      setLoading(false);
      setError(false);
      return;
    }

    const cached = cache.get(dynastyIndex);
    if (cached && cached[coinId]) {
      setDetail(cached[coinId]);
      setLoading(false);
      setError(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(false);

    fetchDynastyDetail(dynastyIndex)
      .then((data) => {
        if (cancelled || !mountedRef.current) return;
        setDetail(data[coinId] ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled || !mountedRef.current) return;
        setDetail(null);
        setLoading(false);
        setError(true);
      });

    return () => {
      cancelled = true;
    };
  }, [dynastyIndex, coinId, hasDetail]);

  const retry = useCallback(() => {
    setError(false);
    setLoading(true);
    fetchDynastyDetail(dynastyIndex)
      .then((data) => {
        if (!mountedRef.current) return;
        setDetail(data[coinId] ?? null);
        setLoading(false);
      })
      .catch(() => {
        if (!mountedRef.current) return;
        setDetail(null);
        setLoading(false);
        setError(true);
      });
  }, [dynastyIndex, coinId]);

  const prefetchDynasty = useCallback(async (idx: number) => {
    try {
      await fetchDynastyDetail(idx);
    } catch {
      // prefetch failure is non-critical
    }
  }, []);

  return { detail, loading, error, retry, prefetchDynasty };
}
