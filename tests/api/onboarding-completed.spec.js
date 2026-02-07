import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSendToN8N = vi.fn();

const mockReq = {
  method: "POST",
  body: {},
  organization: {
    id: "org-123",
    role: "owner",
    data: {
      id: "org-123",
      company_name: "Test Company",
      contact_email: "test@example.com",
    },
  },
  authUser: {
    id: "auth-user-123",
  },
};

const mockRes = {
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
};

vi.mock("../../api/_lib/n8n-client.js", () => ({
  sendToN8N: mockSendToN8N,
}));

vi.mock("../../api/_middleware/with-organization.js", () => ({
  withOrganization: (handler) => handler,
}));

describe("onboarding-completed API endpoint", () => {
  let handler;

  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.N8N_11LABS_ICP_INTERVIEW_URL =
      "https://test-webhook.example.com";

    const module = await import("../../api/organization/onboarding-completed.js");
    handler = module.default || module;
  });

  describe("method validation", () => {
    it("should return 405 for non-POST requests", async () => {
      const req = { ...mockReq, method: "GET" };

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Method not allowed",
      });
    });
  });

  describe("input validation", () => {
    it("should return 400 if conversationId is missing", async () => {
      const req = {
        ...mockReq,
        body: {},
      };

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "conversationId is required",
        }),
      );
    });

    it("should return 400 if conversationId is empty string", async () => {
      const req = {
        ...mockReq,
        body: { conversationId: "   " },
      };

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "conversationId is required",
        }),
      );
    });
  });

  describe("webhook configuration", () => {
    it("should return success message if webhook URL is not configured", async () => {
      delete process.env.N8N_11LABS_ICP_INTERVIEW_URL;

      const req = {
        ...mockReq,
        body: { conversationId: "conv-123" },
      };

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: "Onboarding completed (webhook not configured)",
      });
    });
  });

  describe("successful webhook send", () => {
    it("should send webhook with correct payload when interview completed", async () => {
      mockSendToN8N.mockResolvedValueOnce({ success: true });

      const req = {
        ...mockReq,
        body: {
          conversationId: "conv-123",
          icpData: {
            targetAudience: "B2B SaaS companies",
            painPoints: ["scaling", "automation"],
          },
        },
      };

      await handler(req, mockRes);

      expect(mockSendToN8N).toHaveBeenCalledWith(
        "https://test-webhook.example.com",
        expect.objectContaining({
          conversation_id: "conv-123",
          user_id: "org-123",
          auth_user_id: "auth-user-123",
          user_email: "test@example.com",
          company_name: "Test Company",
          icp_data: expect.objectContaining({
            targetAudience: "B2B SaaS companies",
            painPoints: ["scaling", "automation"],
          }),
          source: "onboarding_modal",
          ended_manually: false,
        }),
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Onboarding completed and webhook sent",
        }),
      );
    });

    it("should send webhook with ended_manually=true when interview ended without data", async () => {
      mockSendToN8N.mockResolvedValueOnce({ success: true });

      const req = {
        ...mockReq,
        body: {
          conversationId: "conv-123",
        },
      };

      await handler(req, mockRes);

      expect(mockSendToN8N).toHaveBeenCalledWith(
        "https://test-webhook.example.com",
        expect.objectContaining({
          conversation_id: "conv-123",
          icp_data: null,
          ended_manually: true,
        }),
      );
    });

    it("should use organization data from middleware", async () => {
      mockSendToN8N.mockResolvedValueOnce({ success: true });

      const req = {
        ...mockReq,
        organization: {
          id: "different-org-id",
          data: {
            company_name: "Different Company",
            contact_email: "different@example.com",
          },
        },
        authUser: {
          id: "different-auth-user",
        },
        body: {
          conversationId: "conv-456",
        },
      };

      await handler(req, mockRes);

      expect(mockSendToN8N).toHaveBeenCalledWith(
        "https://test-webhook.example.com",
        expect.objectContaining({
          user_id: "different-org-id",
          auth_user_id: "different-auth-user",
          company_name: "Different Company",
          user_email: "different@example.com",
        }),
      );
    });
  });

  describe("error handling", () => {
    it("should handle webhook send errors gracefully", async () => {
      mockSendToN8N.mockRejectedValueOnce(new Error("Network error"));

      const req = {
        ...mockReq,
        body: { conversationId: "conv-123" },
      };

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Onboarding completed but webhook failed",
          webhookResponse: expect.objectContaining({
            error: "Webhook request error",
          }),
        }),
      );
    });

    it("should handle unexpected errors", async () => {
      const req = {
        ...mockReq,
        organization: null, // This will cause an error
        body: { conversationId: "conv-123" },
      };

      await handler(req, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Internal server error",
        }),
      );
    });
  });

  describe("organization member scenarios", () => {
    it("should work for owner role", async () => {
      mockSendToN8N.mockResolvedValueOnce({ success: true });

      const req = {
        ...mockReq,
        organization: {
          ...mockReq.organization,
          role: "owner",
        },
        body: { conversationId: "conv-owner" },
      };

      await handler(req, mockRes);

      expect(mockSendToN8N).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("should work for admin role", async () => {
      mockSendToN8N.mockResolvedValueOnce({ success: true });

      const req = {
        ...mockReq,
        organization: {
          ...mockReq.organization,
          role: "admin",
        },
        body: { conversationId: "conv-admin" },
      };

      await handler(req, mockRes);

      expect(mockSendToN8N).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
