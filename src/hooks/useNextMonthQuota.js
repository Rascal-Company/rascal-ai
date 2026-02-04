import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";
import {
  findNextMonthStrategy,
  calculateMonthlyLimit,
} from "../utils/strategyHelpers";
import {
  useSubscriptionStatus,
  useUserStrategies,
} from "./queries/useSubscription";

export const useNextMonthQuota = () => {
  const { user } = useAuth();

  // Shared queries - cached and reused across hooks
  const subscriptionQuery = useSubscriptionStatus();
  const strategiesQuery = useUserStrategies();

  // Next month's generated content count
  const nextMonthCountQuery = useQuery({
    queryKey: ["nextMonthContentCount", user?.id],
    queryFn: async () => {
      if (!user?.id || !strategiesQuery.data) return 0;

      const userId = await getUserOrgId(user.id);
      if (!userId) return 0;

      // Find next month's strategy
      const now = new Date();
      const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonth = nextMonthDate.getMonth();
      const nextYear = nextMonthDate.getFullYear();

      const nextMonthStrategy = findNextMonthStrategy(
        strategiesQuery.data,
        nextMonth,
        nextYear,
      );

      if (!nextMonthStrategy?.id) return 0;

      // Count generated content for next month's strategy
      const { count, error } = await supabase
        .from("content")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("strategy_id", nextMonthStrategy.id)
        .eq("is_generated", true);

      if (error) {
        console.error("Error counting next month generated content:", error);
        return 0;
      }

      return count || 0;
    },
    enabled:
      !!user?.id &&
      !strategiesQuery.isLoading &&
      !!strategiesQuery.data &&
      strategiesQuery.data.length > 0,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: 0,
  });

  // Compute derived values
  const subscriptionStatus = subscriptionQuery.data || "free";
  const monthlyLimit = calculateMonthlyLimit(subscriptionStatus);
  const nextMonthCount = nextMonthCountQuery.data || 0;
  const isUnlimited = monthlyLimit >= 999999;
  const nextMonthRemaining = isUnlimited
    ? Infinity
    : Math.max(0, monthlyLimit - nextMonthCount);

  const loading =
    subscriptionQuery.isLoading ||
    strategiesQuery.isLoading ||
    nextMonthCountQuery.isLoading;

  const error =
    subscriptionQuery.error ||
    strategiesQuery.error ||
    nextMonthCountQuery.error;

  return {
    nextMonthCount,
    nextMonthLimit: monthlyLimit,
    nextMonthRemaining,
    subscriptionStatus,
    isUnlimited,
    loading,
    error: error?.message || null,
    refresh: () => nextMonthCountQuery.refetch(),
  };
};
