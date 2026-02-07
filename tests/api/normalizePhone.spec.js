import { describe, it, expect } from "vitest";

// Extract normalizePhone from validate-sheet.js for testing
function normalizePhone(input) {
  if (!input) return null;
  let x = String(input).trim();
  // Poista välilyönnit ja yhdysmerkit
  x = x.replace(/[\s-]/g, "");

  // Lisää +358 vain 0-alkuisiin numeroihin (suomalaiset)
  if (/^0\d+/.test(x)) {
    return "+358" + x.slice(1);
  }

  // Jos alkaa +:lla, palauta sellaisenaan (kansainväliset numerot)
  if (x.startsWith("+")) {
    return x;
  }

  // Kaikki muut hylätään (ei maakoodia)
  return null;
}

describe("normalizePhone", () => {
  // Test parametrit määritelty selkeästi
  const FINNISH_LEADING_ZERO = "0501234567";
  const FINNISH_WITH_COUNTRY_CODE = "+358501234567";
  const SWEDISH_NUMBER = "+46701234567";
  const NORWEGIAN_NUMBER = "+47123456789";
  const US_NUMBER = "+12125551234";
  const NUMBER_NO_COUNTRY_CODE = "501234567";
  const NUMBER_WITH_SPACES = "050 123 4567";
  const NUMBER_WITH_DASHES = "050-123-4567";

  describe("Finnish numbers", () => {
    it("should add +358 to numbers starting with 0", () => {
      const result = normalizePhone(FINNISH_LEADING_ZERO);
      expect(result).toBe("+358501234567");
    });

    it("should preserve Finnish numbers already with country code", () => {
      const result = normalizePhone(FINNISH_WITH_COUNTRY_CODE);
      expect(result).toBe("+358501234567");
    });

    it("should remove spaces from Finnish numbers", () => {
      const result = normalizePhone(NUMBER_WITH_SPACES);
      expect(result).toBe("+358501234567");
    });

    it("should remove dashes from Finnish numbers", () => {
      const result = normalizePhone(NUMBER_WITH_DASHES);
      expect(result).toBe("+358501234567");
    });
  });

  describe("International numbers", () => {
    it("should accept Swedish numbers with country code", () => {
      const result = normalizePhone(SWEDISH_NUMBER);
      expect(result).toBe("+46701234567");
    });

    it("should accept Norwegian numbers with country code", () => {
      const result = normalizePhone(NORWEGIAN_NUMBER);
      expect(result).toBe("+47123456789");
    });

    it("should accept US numbers with country code", () => {
      const result = normalizePhone(US_NUMBER);
      expect(result).toBe("+12125551234");
    });

    it("should preserve international numbers with spaces", () => {
      const result = normalizePhone("+46 70 123 4567");
      expect(result).toBe("+46701234567");
    });

    it("should preserve international numbers with dashes", () => {
      const result = normalizePhone("+46-70-123-4567");
      expect(result).toBe("+46701234567");
    });
  });

  describe("Invalid numbers", () => {
    it("should reject numbers without country code (not starting with 0)", () => {
      const result = normalizePhone(NUMBER_NO_COUNTRY_CODE);
      expect(result).toBeNull();
    });

    it("should reject numbers with only digits (no country code, not Finnish)", () => {
      const result = normalizePhone("123456789");
      expect(result).toBeNull();
    });

    it("should reject empty string", () => {
      const result = normalizePhone("");
      expect(result).toBeNull();
    });

    it("should reject null", () => {
      const result = normalizePhone(null);
      expect(result).toBeNull();
    });

    it("should reject undefined", () => {
      const result = normalizePhone(undefined);
      expect(result).toBeNull();
    });

    it("should reject whitespace-only string", () => {
      const result = normalizePhone("   ");
      expect(result).toBeNull();
    });

    it("should reject non-numeric characters (except + and whitespace)", () => {
      const result = normalizePhone("abc123");
      expect(result).toBeNull();
    });
  });

  describe("Edge cases", () => {
    it("should handle number as Number type", () => {
      const result = normalizePhone(501234567);
      expect(result).toBeNull(); // No country code
    });

    it("should handle very long international numbers", () => {
      const LONG_NUMBER = "+12125551234567890";
      const result = normalizePhone(LONG_NUMBER);
      expect(result).toBe("+12125551234567890");
    });

    it("should handle very short numbers with country code", () => {
      const SHORT_NUMBER = "+1234567";
      const result = normalizePhone(SHORT_NUMBER);
      expect(result).toBe("+1234567");
    });

    it("should handle multiple consecutive spaces", () => {
      const result = normalizePhone("050  123  4567");
      expect(result).toBe("+358501234567");
    });

    it("should handle mixed spaces and dashes", () => {
      const result = normalizePhone("050 - 123 - 4567");
      expect(result).toBe("+358501234567");
    });
  });

  describe("Validation patterns", () => {
    it("should produce valid international format (7-15 digits)", () => {
      const VALID_NUMBERS = [
        "0501234567", // Finnish
        "+358501234567", // Finnish with code
        "+46701234567", // Swedish
        "+47123456789", // Norwegian
        "+12125551234", // US
      ];

      VALID_NUMBERS.forEach((num) => {
        const result = normalizePhone(num);
        expect(result).toMatch(/^\+\d{7,15}$/);
      });
    });
  });
});
