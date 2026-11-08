import { useCallback, useEffect, useRef, useState } from "react";
import { reportsErrorMessage } from "../../api/reports";
import type { ReportFilterState } from "./reportConstants";

export function useReportQuery<T>(
  draftFilters: ReportFilterState,
  fetcher: (filters: ReportFilterState) => Promise<T>,
  isEmpty: (data: T) => boolean = () => false,
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (filters: ReportFilterState) => {
      const id = ++requestId.current;
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher(filters);
        if (id !== requestId.current) return;
        setData(result);
      } catch (err) {
        if (id !== requestId.current) return;
        setData(null);
        setError(reportsErrorMessage(err));
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    },
    [fetcher],
  );

  useEffect(() => {
    void load(draftFilters);
    // Initial load only; Apply uses latest draft via `apply`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  const apply = useCallback(() => {
    void load(draftFilters);
  }, [draftFilters, load]);

  const empty = !loading && !error && data !== null && isEmpty(data);

  return { data, loading, error, apply, empty };
}
