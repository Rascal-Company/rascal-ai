import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { getUserOrgId } from "../../lib/getUserOrgId";
import { useAuth } from "../../contexts/AuthContext";

/**
 * Shared subscription status query
 * Used by both useMonthlyLimit and useNextMonthQuota
 */
export function useSubscriptionStatus() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["subscriptionStatus", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const userId = await getUserOrgId(user.id);
      if (!userId) throw new Error("User ID not found");

      const { data, error } = await supabase
        .from("users")
        .select("subscription_status")
        .eq("id", userId)
        .single();

      if (error || !data) throw new Error("Subscription status not found");

      return data.subscription_status;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10, // 10 minutes - subscription rarely changes
    placeholderData: "free",
  });
}

/**
 * Shared strategies query
 * Used by both useMonthlyLimit and useNextMonthQuota
 */
export function useUserStrategies() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["userStrategies", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const userId = await getUserOrgId(user.id);
      if (!userId) return [];

      const { data, error } = await supabase
        .from("content_strategy")
        .select("id, month, target_month")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching strategies:", error);
        return [];
      }

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: [],
  });
}
