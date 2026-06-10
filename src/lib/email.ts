// ============================================================
// Canopy — Email Service
// Sends verification emails via Google SMTP (nodemailer)
// ============================================================

import nodemailer from "nodemailer";

/** Escape HTML special characters to prevent XSS in emails */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // STARTTLS
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Send a 6-digit OTP verification email
 */
export async function sendVerificationEmail(
  to: string,
  otp: string,
  userName?: string
): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "Canopy App <noreply@canopy.app>",
      to,
      subject: "🌱 Canopy — Verify Your Email",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #F5F0E8; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <span style="font-size: 48px;">🌱</span>
            <h1 style="color: #1B2A4A; font-size: 24px; margin: 12px 0 4px;">Welcome to Canopy</h1>
            <p style="color: #1B2A4A; opacity: 0.6; font-size: 14px; margin: 0;">
              ${userName ? `Hi ${escapeHtml(userName)}, v` : "V"}erify your email to get started
            </p>
          </div>
          <div style="background: white; border-radius: 12px; padding: 32px; text-align: center; border: 1px solid #E8DFD0;">
            <p style="color: #1B2A4A; font-size: 14px; margin: 0 0 16px;">Your verification code:</p>
            <div style="background: #F5F0E8; border-radius: 8px; padding: 16px; margin: 0 auto; display: inline-block;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1B2A4A;">${otp}</span>
            </div>
            <p style="color: #1B2A4A; opacity: 0.5; font-size: 12px; margin: 16px 0 0;">
              This code expires in 10 minutes. Don't share it with anyone.
            </p>
          </div>
          <p style="color: #1B2A4A; opacity: 0.4; font-size: 11px; text-align: center; margin-top: 24px;">
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
      text: `Your Canopy verification code is: ${otp}\n\nThis code expires in 10 minutes.`,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send verification email:", error);
    return false;
  }
}

/**
 * Generate a cryptographically random 6-digit OTP
 */
export function generateOTP(): string {
  const array = new Uint32Array(1);
  globalThis.crypto.getRandomValues(array);
  return String(array[0] % 1000000).padStart(6, "0");
}
