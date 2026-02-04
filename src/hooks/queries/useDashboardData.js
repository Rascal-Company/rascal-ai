import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { useOrgId } from "./useOrgId";

/**
 * Success stats query - with days filter
 */
export function useSuccessStats(days = 30) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["successStats", days],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) return null;

      const res = await fetch(
        `/api/analytics/success?days=${encodeURIComponent(days)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch success stats");
      return res.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: { today: 0, thisWeek: 0, thisMonth: 0, trend: 0 },
  });
}

/**
 * Dashboard stats query
 */
export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboardStats", user?.id],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) return null;

      const res = await fetch("/api/analytics/dashboard-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      return res.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: {
      upcomingCount: 0,
      monthlyCount: 0,
      totalCallPrice: 0,
      totalMessagePrice: 0,
      features: [],
      aiUsage: 0,
    },
  });
}

/**
 * Google Analytics visitors query - with days filter
 */
export function useGAVisitors(days = 7) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["gaVisitors", days],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) return null;

      const res = await fetch(
        `/api/analytics/visitors?days=${encodeURIComponent(days)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) {
        // If 404, GA not connected
        if (res.status === 404) return { connected: false };
        throw new Error("Failed to fetch GA visitors");
      }

      return res.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: { connected: false, visitors: 0, trend: 0 },
  });
}

/**
 * Call price query - for current month
 */
export function useCallPrice() {
  const { orgId, isLoading: orgLoading } = useOrgId();

  return useQuery({
    queryKey: ["callPrice", orgId],
    queryFn: async () => {
      if (!orgId) return 0;

      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from("call_logs")
        .select("price")
        .eq("user_id", orgId)
        .gte("created_at", firstDay.toISOString())
        .lte("created_at", lastDay.toISOString());

      if (error || !data) return 0;
      return data.reduce((acc, row) => acc + (parseFloat(row.price) || 0), 0);
    },
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: false,
    placeholderData: 0,
  });
}

/**
 * Dashboard posts query
 */
export function useDashboardPosts() {
  const { orgId, isLoading: orgLoading } = useOrgId();

  return useQuery({
    queryKey: ["dashboardPosts", orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("content")
        .select("*")
        .eq("user_id", orgId)
        .order("publish_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId && !orgLoading,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: [],
  });
}

/**
 * Mixpost analytics query - with time filter
 */
export function useMixpostAnalytics(timeFilter = "all") {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["mixpostAnalytics", timeFilter],
    queryFn: async () => {
      const session = await supabase.auth.getSession();
      const token = session?.data?.session?.access_token;
      if (!token) return null;

      const now = new Date();
      let fromDate = null;
      let toDate = now.toISOString().split("T")[0];

      if (timeFilter === "week") {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      } else if (timeFilter === "month") {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];
      }

      const url = `/api/analytics/social-stats${fromDate ? `?from=${fromDate}&to=${toDate}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch Mixpost analytics");
      return res.json();
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    placeholderData: null,
  });
}
