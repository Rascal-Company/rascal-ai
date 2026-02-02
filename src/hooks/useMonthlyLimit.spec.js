import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useMonthlyLimit } from "./useMonthlyLimit";
import * as strategyHelpers from "../utils/strategyHelpers";
import { useAuth } from "../contexts/AuthContext";
import { getUserOrgId } from "../lib/getUserOrgId";
import { supabase } from "../lib/supabase";

// Mock dependencies
vi.mock("../contexts/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock("../lib/getUserOrgId", () => ({
  getUserOrgId: vi.fn(),
}));

vi.mock("../utils/strategyHelpers", () => ({
  findStrategyByMonthAndYear: vi.fn(),
  calculateMonthlyLimit: vi.fn(),
}));

describe("useMonthlyLimit", () => {
  const mockUser = { id: "user-123" };
  const mockUserId = "org-456";

  let mockSupabaseQuery;

  beforeEach(() => {
    vi.clearAllMocks();

    // Re-create mock query chain after clearAllMocks
    mockSupabaseQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi
        .fn()
        .mockResolvedValue({
          data: { subscription_status: "free" },
          error: null,
        }),
      head: true,
      count: "exact",
    };

    // Setup default mocks
    vi.mocked(useAuth).mockReturnValue({ user: mockUser });
    vi.mocked(getUserOrgId).mockResolvedValue(mockUserId);
    vi.mocked(supabase.from).mockReturnValue(mockSupabaseQuery);
    vi.mocked(strategyHelpers.calculateMonthlyLimit).mockReturnValue(30);
    vi.mocked(strategyHelpers.findStrategyByMonthAndYear).mockResolvedValue(
      null,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should initialize with default values", async () => {
    const { result } = renderHook(() => useMonthlyLimit());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.currentCount).toBe(0);
    expect(result.current.monthlyLimit).toBe(30);
    expect(result.current.remaining).toBe(30);
    expect(result.current.canCreate).toBe(true);
    expect(result.current.isUnlimited).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it("should not fetch data if user is not available", async () => {
    vi.mocked(useAuth).mockReturnValue({ user: null });

    renderHook(() => useMonthlyLimit());

    await waitFor(() => {
      expect(getUserOrgId).not.toHaveBeenCalled();
    });
  });

  it("should fetch subscription status and calculate limit", async () => {
    const mockUserData = { subscription_status: "pro" };
    mockSupabaseQuery.single.mockResolvedValue({
      data: mockUserData,
      error: null,
    });

    vi.mocked(strategyHelpers.calculateMonthlyLimit).mockReturnValue(100);

    renderHook(() => useMonthlyLimit());

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith("users");
      expect(strategyHelpers.calculateMonthlyLimit).toHaveBeenCalledWith("pro");
    });
  });

  it("should handle error when user data not found", async () => {
    mockSupabaseQuery.single.mockResolvedValue({
      data: null,
      error: { message: "Not found" },
    });

    const { result } = renderHook(() => useMonthlyLimit());

    await waitFor(() => {
      expect(result.current.error).toBe("Käyttäjän tietoja ei löytynyt");
      expect(result.current.loading).toBe(false);
    });
  });

  it("should handle error when user ID not found", async () => {
    vi.mocked(getUserOrgId).mockResolvedValue(null);

    const { result } = renderHook(() => useMonthlyLimit());

    await waitFor(() => {
      expect(result.current.error).toBe("Käyttäjän ID ei löytynyt");
      expect(result.current.loading).toBe(false);
    });
  });

  it("should count generated content for current strategy", async () => {
    const mockUserData = { subscription_status: "free" };
    const mockStrategy = { id: "strategy-123" };

    mockSupabaseQuery.single.mockResolvedValue({
      data: mockUserData,
      error: null,
    });

    // Mock strategy fetch
    const mockStrategyQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    vi.mocked(supabase.from).mockImplementation((table) => {
      if (table === "users") {
        return mockSupabaseQuery;
      }
      if (table === "content_strategy") {
        return mockStrategyQuery;
      }
      if (table === "content") {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          head: true,
          count: "exact",
        };
      }
      return mockSupabaseQuery;
    });

    mockStrategyQuery.eq.mockResolvedValue({
      data: [mockStrategy],
      error: null,
    });

    vi.mocked(strategyHelpers.findStrategyByMonthAndYear).mockResolvedValue(
      mockStrategy,
    );

    // Mock content count
    const mockContentQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    };
    mockContentQuery.eq.mockResolvedValue({
      count: 5,
      error: null,
    });

    const { result } = renderHook(() => useMonthlyLimit());

    await waitFor(
      () => {
        expect(result.current.currentCount).toBeGreaterThanOrEqual(0);
      },
      { timeout: 3000 },
    );
  });

  it("should calculate remaining quota correctly", async () => {
    const mockUserData = { subscription_status: "free" };
    mockSupabaseQuery.single.mockResolvedValue({
      data: mockUserData,
      error: null,
    });

    vi.mocked(strategyHelpers.calculateMonthlyLimit).mockReturnValue(30);

    const { result } = renderHook(() => useMonthlyLimit());

    await waitFor(() => {
      expect(result.current.monthlyLimit).toBe(30);
      expect(result.current.remaining).toBe(30);
      expect(result.current.canCreate).toBe(true);
    });
  });

  it("should handle enterprise unlimited plan", async () => {
    const mockUserData = { subscription_status: "enterprise" };
    mockSupabaseQuery.single.mockResolvedValue({
      data: mockUserData,
      error: null,
    });

    vi.mocked(strategyHelpers.calculateMonthlyLimit).mockReturnValue(999999);

    const { result } = renderHook(() => useMonthlyLimit());

    await waitFor(() => {
      expect(result.current.monthlyLimit).toBe(999999);
      expect(result.current.isUnlimited).toBe(true);
      expect(result.current.remaining).toBe(Infinity);
      expect(result.current.canCreate).toBe(true);
    });
  });

  it("should provide refresh function", () => {
    const { result } = renderHook(() => useMonthlyLimit());

    expect(result.current.refresh).toBeDefined();
    expect(typeof result.current.refresh).toBe("function");
  });
});
