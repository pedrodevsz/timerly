"use client";

import { useCallback, useEffect, useState } from "react";

export function useResource<T>(loader: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => { setLoading(true); setError(null); try { setData(await loader()); } catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível carregar os dados."); } finally { setLoading(false); } }, [loader]);
  useEffect(() => {
    let active = true;
    loader().then((value) => { if (active) setData(value); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Não foi possível carregar os dados."); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [loader]);
  return { data, setData, loading, error, reload: load };
}
