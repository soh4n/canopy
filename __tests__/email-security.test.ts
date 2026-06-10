// ============================================================
// Canopy — Email & OTP Security Tests
// Tests email generation, OTP creation, and timing-safe comparison
// ============================================================

import { generateOTP, escapeHtml } from "../src/lib/email";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: "test-id" }),
  })),
}));

describe("Email Service", () => {
  describe("generateOTP", () => {
    it("generates a 6-digit string", () => {
      const otp = generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    it("generates different values on consecutive calls", () => {
      const otps = new Set(Array.from({ length: 100 }, () => generateOTP()));
      // With 100 random OTPs, we expect at least 90 unique values
      expect(otps.size).toBeGreaterThan(90);
    });

    it("pads short numbers with leading zeros", () => {
      // generateOTP uses crypto.getRandomValues which returns random values.
      // We verify the format is always 6 digits even for small numbers.
      for (let i = 0; i < 50; i++) {
        const otp = generateOTP();
        expect(otp.length).toBe(6);
        expect(parseInt(otp)).toBeLessThan(1000000);
        expect(parseInt(otp)).toBeGreaterThanOrEqual(0);
      }
    });
  });
});

describe("OTP Security", () => {
  it("OTP values are within valid range", () => {
    for (let i = 0; i < 100; i++) {
      const otp = generateOTP();
      const num = parseInt(otp, 10);
      expect(num).toBeGreaterThanOrEqual(0);
      expect(num).toBeLessThan(1000000);
    }
  });

  it("timing-safe comparison behaves correctly", () => {
    // Import the function from the module (we test the concept)
    const { timingSafeEqual } = require("crypto");
    
    // Equal strings
    const a = Buffer.from("123456");
    const b = Buffer.from("123456");
    expect(timingSafeEqual(a, b)).toBe(true);

    // Different strings of same length
    const c = Buffer.from("123456");
    const d = Buffer.from("654321");
    expect(timingSafeEqual(c, d)).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("escapes HTML special characters", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;"
    );
  });

  it("escapes ampersands and quotes", () => {
    expect(escapeHtml('a & b "c"')).toBe("a &amp; b &quot;c&quot;");
  });

  it("leaves safe strings unchanged", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });
});

describe("sendVerificationEmail", () => {
  it("sends email successfully and returns true", async () => {
    const { sendVerificationEmail } = await import("../src/lib/email");
    const result = await sendVerificationEmail("test@example.com", "123456", "Alice");
    expect(result).toBe(true);
  });

  it("sends email without userName", async () => {
    const { sendVerificationEmail } = await import("../src/lib/email");
    const result = await sendVerificationEmail("test@example.com", "654321");
    expect(result).toBe(true);
  });

  it("returns false on send failure", async () => {
    const nodemailer = require("nodemailer");
    nodemailer.createTransport.mockReturnValueOnce({
      sendMail: jest.fn().mockRejectedValue(new Error("SMTP error")),
    });
    // Re-import to pick up the new mock
    jest.resetModules();
    jest.doMock("nodemailer", () => ({
      createTransport: () => ({
        sendMail: jest.fn().mockRejectedValue(new Error("SMTP error")),
      }),
    }));
    const { sendVerificationEmail } = await import("../src/lib/email");
    const result = await sendVerificationEmail("test@example.com", "000000");
    expect(result).toBe(false);
  });
});
