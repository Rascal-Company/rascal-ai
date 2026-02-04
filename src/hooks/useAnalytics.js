import { useState, useEffect, useCallback } from "react";
import analyticsService from "../services/analyticsApi";

export function useAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await analyticsService.getAnalytics();
      setData(result);
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(err.message);
      // Fallback mock data
      setData(analyticsService.getMockAnalytics());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refresh = useCallback(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const refreshCache = useCallback(async () => {
    try {
      setLoading(true);
      await analyticsService.refreshCache();
      await fetchAnalytics();
    } catch (err) {
      console.error("Cache refresh error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchAnalytics]);

  return {
    data,
    loading,
    error,
    refresh,
    refreshCache,
  };
}
