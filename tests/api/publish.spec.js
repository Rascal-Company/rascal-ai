import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
const mockSupabase = {
  from: vi.fn(),
};

const mockN8NClient = {
  sendToN8N: vi.fn(),
};

const mockCors = {
  setCorsHeaders: vi.fn(),
  handlePreflight: vi.fn().mockReturnValue(false),
};

// Mock modules
vi.mock("../../api/_lib/cors.js", () => ({
  setCorsHeaders: mockCors.setCorsHeaders,
  handlePreflight: mockCors.handlePreflight,
}));

vi.mock("../../api/_lib/n8n-client.js", () => ({
  sendToN8N: mockN8NClient.sendToN8N,
}));

vi.mock("../../api/_middleware/with-organization.js", () => ({
  withOrganization: (handler) => handler,
}));

describe("blog/publish API endpoint", () => {
  let handler;

  const mockOrgId = "org-123";
  const mockAuthUserId = "auth-456";
  const mockPostId = "post-789";

  const createMockReq = (overrides = {}) => ({
    method: "POST",
    organization: {
      id: mockOrgId,
    },
    authUser: {
      id: mockAuthUserId,
    },
    supabase: mockSupabase,
    body: {
      post_id: mockPostId,
      auth_user_id: mockAuthUserId,
      content: "Test blog content",
      media_urls: [],
      action: "publish",
      post_type: "post",
      ...overrides,
    },
  });

  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    // Set N8N_BLOG_PUBLISH_URL env variable
    process.env.N8N_BLOG_PUBLISH_URL =
      "https://n8n.example.com/webhook/blog-publish";

    // Import handler after mocks are set up
    const module = await import("../../api/content/blog/publish.js");
    handler = module.default || module;
  });

  describe("HTTP method validation", () => {
    it("should return 405 for non-POST requests", async () => {
      const req = createMockReq();
      req.method = "GET";

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Method not allowed",
      });
    });
  });

  describe("request validation", () => {
    it("should return 400 if post_id is missing", async () => {
      const req = createMockReq();
      delete req.body.post_id;

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Missing required fields: post_id",
      });
    });
  });

  describe("blog publish without social accounts", () => {
    it("should successfully publish blog without Mixpost config", async () => {
      const req = createMockReq();

      // Mock Mixpost config query (returns null - no config)
      const mockConfigQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" }, // No rows returned
        }),
      };

      // Mock social accounts query (returns empty)
      const mockAccountsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      // Second .eq() call should return a promise
      mockAccountsQuery.eq.mockImplementation((field, value) => {
        if (field === "is_authorized") {
          return Promise.resolve({ data: [], error: null });
        }
        return mockAccountsQuery;
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === "user_mixpost_config") {
          return mockConfigQuery;
        }
        if (table === "user_social_accounts") {
          return mockAccountsQuery;
        }
        return mockConfigQuery;
      });

      // Mock N8N response
      mockN8NClient.sendToN8N.mockResolvedValue({
        success: true,
        message: "Blog published",
      });

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { success: true, message: "Blog published" },
        message: "Blog published successfully",
      });
    });

    it("should successfully publish blog without social accounts", async () => {
      const req = createMockReq();

      // Mock Mixpost config query (returns valid config)
      const mockConfigQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            mixpost_workspace_uuid: "workspace-123",
            mixpost_api_token: "token-456",
          },
          error: null,
        }),
      };

      // Mock social accounts query (returns empty - no social accounts)
      const mockAccountsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockAccountsQuery.eq.mockImplementation((field, value) => {
        if (field === "is_authorized") {
          return Promise.resolve({ data: [], error: null });
        }
        return mockAccountsQuery;
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === "user_mixpost_config") {
          return mockConfigQuery;
        }
        if (table === "user_social_accounts") {
          return mockAccountsQuery;
        }
        return mockConfigQuery;
      });

      // Mock N8N response
      mockN8NClient.sendToN8N.mockResolvedValue({
        success: true,
        message: "Blog published",
      });

      await handler(req, mockRes);

      // Should succeed without social accounts (critical test for the fix)
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: { success: true, message: "Blog published" },
        message: "Blog published successfully",
      });

      // Verify N8N was called with empty account_ids array
      expect(mockN8NClient.sendToN8N).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook/blog-publish",
        expect.objectContaining({
          data: expect.objectContaining({
            account_ids: [], // No social accounts
          }),
        }),
      );
    });
  });

  describe("blog publish with social accounts", () => {
    it("should use selected social accounts if provided", async () => {
      const selectedAccountId = "account-abc";
      const req = createMockReq({
        selected_accounts: [selectedAccountId],
      });

      // Mock Mixpost config
      const mockConfigQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            mixpost_workspace_uuid: "workspace-123",
            mixpost_api_token: "token-456",
          },
          error: null,
        }),
      };

      // Mock social accounts
      const mockAccountsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockAccountsQuery.eq.mockImplementation((field, value) => {
        if (field === "is_authorized") {
          return Promise.resolve({
            data: [
              {
                mixpost_account_uuid: selectedAccountId,
                provider: "facebook",
                account_name: "Test Page",
              },
            ],
            error: null,
          });
        }
        return mockAccountsQuery;
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === "user_mixpost_config") {
          return mockConfigQuery;
        }
        if (table === "user_social_accounts") {
          return mockAccountsQuery;
        }
        return mockConfigQuery;
      });

      mockN8NClient.sendToN8N.mockResolvedValue({
        success: true,
        message: "Blog published",
      });

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);

      // Verify selected account was used
      expect(mockN8NClient.sendToN8N).toHaveBeenCalledWith(
        "https://n8n.example.com/webhook/blog-publish",
        expect.objectContaining({
          data: expect.objectContaining({
            account_ids: [selectedAccountId],
          }),
        }),
      );
    });
  });

  describe("error handling", () => {
    it("should return 500 if N8N_BLOG_PUBLISH_URL is not set", async () => {
      delete process.env.N8N_BLOG_PUBLISH_URL;

      const req = createMockReq();

      // Mock queries
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.eq.mockImplementation((field, value) => {
        if (field === "is_authorized") {
          return Promise.resolve({ data: [], error: null });
        }
        return mockQuery;
      });

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "N8N_BLOG_PUBLISH_URL ympäristömuuttuja ei ole asetettu",
        hint: "Aseta N8N_BLOG_PUBLISH_URL Vercel-ympäristömuuttujaksi",
      });
    });

    it("should return 500 if N8N webhook fails", async () => {
      const req = createMockReq();

      // Mock successful queries
      const mockConfigQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            mixpost_workspace_uuid: "workspace-123",
            mixpost_api_token: "token-456",
          },
          error: null,
        }),
      };

      const mockAccountsQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };
      mockAccountsQuery.eq.mockImplementation((field, value) => {
        if (field === "is_authorized") {
          return Promise.resolve({ data: [], error: null });
        }
        return mockAccountsQuery;
      });

      mockSupabase.from.mockImplementation((table) => {
        if (table === "user_mixpost_config") {
          return mockConfigQuery;
        }
        if (table === "user_social_accounts") {
          return mockAccountsQuery;
        }
        return mockConfigQuery;
      });

      // Mock N8N failure
      mockN8NClient.sendToN8N.mockRejectedValue(new Error("Network error"));

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: "Blogin julkaisu epäonnistui",
        details: "Network error",
      });
    });

    it("should return 500 if Supabase query throws error", async () => {
      const req = createMockReq();

      // Mock Supabase error
      mockSupabase.from.mockImplementation(() => {
        throw new Error("Database connection failed");
      });

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Supabase virhe",
        details: "Database connection failed",
      });
    });
  });

  describe("CORS handling", () => {
    it("should set CORS headers", async () => {
      const req = createMockReq();

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      };
      mockSupabase.from.mockReturnValue(mockQuery);
      mockQuery.eq.mockImplementation((field, value) => {
        if (field === "is_authorized") {
          return Promise.resolve({ data: [], error: null });
        }
        return mockQuery;
      });

      mockN8NClient.sendToN8N.mockResolvedValue({ success: true });

      await handler(req, mockRes);

      expect(mockCors.setCorsHeaders).toHaveBeenCalledWith(mockRes, [
        "GET",
        "POST",
        "OPTIONS",
      ]);
    });

    it("should handle preflight requests", async () => {
      mockCors.handlePreflight.mockReturnValue(true);

      const req = createMockReq();

      await handler(req, mockRes);

      expect(mockCors.handlePreflight).toHaveBeenCalledWith(req, mockRes);
    });
  });
});
