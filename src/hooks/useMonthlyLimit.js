import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";
import {
  findStrategyByMonthAndYear,
  calculateMonthlyLimit,
} from "../utils/strategyHelpers";
import {
  useSubscriptionStatus,
  useUserStrategies,
} from "./queries/useSubscription";

export const useMonthlyLimit = () => {
  const { user } = useAuth();

  // Shared queries - cached and reused across hooks
  const subscriptionQuery = useSubscriptionStatus();
  const strategiesQuery = useUserStrategies();

  // Current month's generated content count
  const contentCountQuery = useQuery({
    queryKey: ["monthlyContentCount", user?.id],
    queryFn: async () => {
      if (!user?.id || !strategiesQuery.data) return 0;

      const userId = await getUserOrgId(user.id);
      if (!userId) return 0;

      // Find current month's strategy
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const currentStrategy = findStrategyByMonthAndYear(
        strategiesQuery.data,
        currentMonth,
        currentYear,
      );

      if (!currentStrategy?.id) return 0;

      // Count generated content for this strategy
      const { count, error } = await supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("strategy_id", currentStrategy.id)
        .eq("is_generated", true);

      if (error) {
        console.error("Error counting current month generated content:", error);
        return 0;
      }

      return count || 0;
    },
    enabled:
      !!user?.id &&
      !strategiesQuery.isLoading &&
      !!strategiesQuery.data &&
      strategiesQuery.data.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes - updates more frequently
    placeholderData: 0,
  });

  // Compute derived values
  const subscriptionStatus = subscriptionQuery.data || "free";
  const monthlyLimit = calculateMonthlyLimit(subscriptionStatus);
  const currentCount = contentCountQuery.data || 0;
  const isUnlimited = monthlyLimit >= 999999;
  const remaining = isUnlimited
    ? Infinity
    : Math.max(0, monthlyLimit - currentCount);
  const canCreate = isUnlimited || currentCount < monthlyLimit;

  const loading =
    subscriptionQuery.isLoading ||
    strategiesQuery.isLoading ||
    contentCountQuery.isLoading;

  const error =
    subscriptionQuery.error || strategiesQuery.error || contentCountQuery.error;

  return {
    currentCount,
    monthlyLimit,
    remaining,
    canCreate,
    isUnlimited,
    loading,
    error: error?.message || null,
    refresh: () => contentCountQuery.refetch(),
  };
};
