'use client';
import { useCallback, useEffect, useState } from 'react';
import { commerceRequest } from './commerce-api';
export function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    let active = true;
    commerceRequest<T>(path).then(value => { if (active) { setData(value); setError(''); } }).catch(e => { if(active) setError(e.message); }).finally(() => { if(active) setLoading(false); });
    return () => { active = false; };
  }, [path, version]);
  return { data, error, loading, reload };
}
