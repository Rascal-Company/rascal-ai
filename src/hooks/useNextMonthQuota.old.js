import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { getUserOrgId } from "../lib/getUserOrgId";
import {
  findNextMonthStrategy,
  calculateMonthlyLimit,
} from "../utils/strategyHelpers";

export const useNextMonthQuota = () => {
  const [quotaData, setQuotaData] = useState({
    nextMonthCount: 0,
    nextMonthLimit: 30,
    nextMonthRemaining: 30,
    subscriptionStatus: "free",
    isUnlimited: false,
    loading: false,
    error: null,
  });

  const { user } = useAuth();

  const fetchSubscriptionStatus = async (userId) => {
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("subscription_status")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      throw new Error("Käyttäjän tietoja ei löytynyt");
    }

    return userData.subscription_status;
  };

  const fetchUserStrategies = async (userId) => {
    const { data: strategies, error: strategyErr } = await supabase
      .from("content_strategy")
      .select("id, month")
      .eq("user_id", userId);

    if (strategyErr) {
      console.error("Error fetching strategies:", strategyErr);
      return [];
    }

    return strategies || [];
  };

  const findNextMonthStrategyForUser = async (userId) => {
    const strategies = await fetchUserStrategies(userId);
    if (strategies.length === 0) {
      return null;
    }

    const now = new Date();
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonth = nextMonthDate.getMonth();
    const nextYear = nextMonthDate.getFullYear();

    return findNextMonthStrategy(strategies, nextMonth, nextYear);
  };

  const countGeneratedContent = async (userId, strategyId) => {
    const { count, error: cntErr } = await supabase
      .from("content")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("strategy_id", strategyId)
      .eq("is_generated", true);

    if (cntErr) {
      console.error("Error counting next month generated content:", cntErr);
      return 0;
    }

    return count || 0;
  };

  const checkNextMonthQuota = async () => {
    if (!user?.id) return;

    setQuotaData((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const userId = await getUserOrgId(user.id);

      if (!userId) {
        throw new Error("Käyttäjän ID ei löytynyt");
      }

      const [subscriptionStatus, nextMonthStrategy] = await Promise.all([
        fetchSubscriptionStatus(userId),
        findNextMonthStrategyForUser(userId),
      ]);

      const monthlyLimit = calculateMonthlyLimit(subscriptionStatus);

      let nextMonthCount = 0;
      if (nextMonthStrategy?.id) {
        nextMonthCount = await countGeneratedContent(
          userId,
          nextMonthStrategy.id,
        );
      }

      const isUnlimited = monthlyLimit >= 999999;
      const nextMonthRemaining = isUnlimited
        ? Infinity
        : Math.max(0, monthlyLimit - nextMonthCount);

      setQuotaData({
        nextMonthCount,
        nextMonthLimit: monthlyLimit,
        nextMonthRemaining,
        subscriptionStatus,
        isUnlimited,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error checking next month quota:", error);
      setQuotaData((prev) => ({
        ...prev,
        loading: false,
        error: error.message,
      }));
    }
  };

  useEffect(() => {
    checkNextMonthQuota();
  }, [user?.id]);

  return {
    ...quotaData,
    refresh: checkNextMonthQuota,
  };
};
