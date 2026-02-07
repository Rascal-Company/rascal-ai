import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch
global.fetch = vi.fn();

describe("validate-sheet API endpoint", () => {
  let handler;
  let mockReq;
  let mockRes;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Setup mock request and response
    mockReq = {
      method: "POST",
      body: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
      end: vi.fn().mockReturnThis(),
    };

    // Import handler after mocks are set up
    const module = await import("../../api/integrations/validate-sheet.js");
    handler = module.default || module;
  });

  describe("HTTP methods", () => {
    it("should return 200 for OPTIONS request (CORS preflight)", async () => {
      mockReq.method = "OPTIONS";

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.end).toHaveBeenCalled();
    });

    it("should return 405 for GET request", async () => {
      mockReq.method = "GET";

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(405);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Vain POST-metodit sallittu",
      });
    });

    it("should set CORS headers for all requests", async () => {
      await handler(mockReq, mockRes);

      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Origin",
        "http://localhost:5173",
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS",
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        "Access-Control-Allow-Headers",
        "Content-Type",
      );
    });
  });

  describe("Input validation", () => {
    it("should return 400 if sheetUrl is missing", async () => {
      mockReq.body = { user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Google Sheets URL on pakollinen",
      });
    });

    it("should return 400 if sheetUrl is empty string", async () => {
      mockReq.body = { sheetUrl: "   ", user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Google Sheets URL on pakollinen",
      });
    });

    it("should return 400 if sheetUrl is not a valid Google Sheets URL", async () => {
      mockReq.body = {
        sheetUrl: "https://example.com/invalid",
        user_id: "user-123",
      };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error:
          "Virheellinen Google Sheets URL. URL:n tulee olla muotoa: https://docs.google.com/spreadsheets/d/[ID]",
      });
    });
  });

  describe("Phone number validation with international support", () => {
    const VALID_SHEET_URL =
      "https://docs.google.com/spreadsheets/d/test-sheet-id/edit";

    it("should accept Finnish numbers with leading 0", async () => {
      const CSV_DATA = "phone\n0501234567";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 1,
          invalidCount: 0,
        }),
      );
    });

    it("should accept Finnish numbers with +358", async () => {
      const CSV_DATA = "phone\n+358501234567";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 1,
          invalidCount: 0,
        }),
      );
    });

    it("should accept Swedish numbers with +46", async () => {
      const CSV_DATA = "phone\n+46701234567";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 1,
          invalidCount: 0,
        }),
      );
    });

    it("should accept Norwegian numbers with +47", async () => {
      const CSV_DATA = "phone\n+47123456789";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 1,
          invalidCount: 0,
        }),
      );
    });

    it("should accept US numbers with +1", async () => {
      const CSV_DATA = "phone\n+12125551234";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 1,
          invalidCount: 0,
        }),
      );
    });

    it("should reject numbers without country code (not starting with 0)", async () => {
      const CSV_DATA = "phone\n501234567";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 0,
          invalidCount: 1,
        }),
      );
    });

    it("should handle mixed valid and invalid numbers", async () => {
      const CSV_DATA =
        "phone\n0501234567\n+46701234567\n501234567\n+358401234567\ninvalid";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 3, // 0501234567, +46701234567, +358401234567
          invalidCount: 2, // 501234567, invalid
          totalRows: 5,
        }),
      );
    });
  });

  // NOTE: Google Sheets error handling (403, 404, timeout) is complex to mock
  // due to the candidateUrls loop in validate-sheet.js. These cases are
  // better tested manually or with E2E tests. The core phone normalization
  // logic is thoroughly tested in normalizePhone.spec.js

  describe("Phone column detection", () => {
    const VALID_SHEET_URL =
      "https://docs.google.com/spreadsheets/d/test-sheet-id/edit";

    it('should detect phone column with "phone" header', async () => {
      const CSV_DATA = "name,phone,email\nJohn,0501234567,john@test.com";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 1,
        }),
      );
    });

    it('should detect phone column with "puhelinnumero" header', async () => {
      const CSV_DATA =
        "nimi,puhelinnumero,sähköposti\nJohn,0501234567,john@test.com";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          phoneCount: 1,
        }),
      );
    });

    it("should return error if no phone column detected", async () => {
      const CSV_DATA = "name,email\nJohn,john@test.com";

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: {
          get: () => "text/csv",
        },
        text: () => Promise.resolve(CSV_DATA),
      });

      mockReq.body = { sheetUrl: VALID_SHEET_URL, user_id: "user-123" };

      await handler(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining("Puhelinnumerosarakkeita ei löytynyt"),
        }),
      );
    });
  });
});
