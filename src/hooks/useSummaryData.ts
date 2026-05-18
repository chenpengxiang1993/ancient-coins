import { useState, useEffect } from 'react';
import type { DynastyData } from '../types';

let cachedData: DynastyData[] | null = null;
let fetchPromise: Promise<DynastyData[]> | null = null;

async function fetchSummary(): Promise<DynastyData[]> {
  if (cachedData) return cachedData;
  if (fetchPromise) return fetchPromise;

  fetchPromise = fetch('/data/coins-summary.json')
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((data: DynastyData[]) => {
      cachedData = data;
      fetchPromise = null;
      return data;
    })
    .catch(err => {
      fetchPromise = null;
      throw err;
    });

  return fetchPromise;
}

export function useSummaryData() {
  const [data, setData] = useState<DynastyData[] | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    fetchSummary()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, []);

  return { data, loading, error };
}
