import { useAuth } from "../contexts/AuthContext";
import { useMemo, useCallback } from "react";

export function useFeatures() {
  const { user } = useAuth();

  const features = useMemo(() => {
    if (!user || !user.features) return [];
    return Array.isArray(user.features) ? user.features : [];
  }, [user]);

  const featureSet = useMemo(() => new Set(features), [features]);

  const has = useCallback(
    (name) => {
      return featureSet.has(name);
    },
    [featureSet],
  );

  return {
    features,
    has,
    crmConnected: false,
    loading: false,
    error: null,
  };
}
