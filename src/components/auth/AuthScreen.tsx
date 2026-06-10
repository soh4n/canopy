"use client";

// ============================================================
// Canopy — Authentication Screen
// Modern login/register with Google SMTP email verification
// ============================================================

import { useState, FormEvent, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthScreenProps {
  onAuthenticated: (user: AuthUser) => void;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  onboardingComplete: boolean;
  token: string;
}

type AuthStep = "credentials" | "verify_otp";

export function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<AuthStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Handle OTP input
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value[value.length - 1];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    if (pasted.length === 6) {
      otpRefs.current[5]?.focus();
    }
  };

  // Send OTP for registration
  const sendOTP = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_otp", email, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to send verification code");
        return false;
      }

      setSuccess("Verification code sent! Check your email.");
      startResendCountdown();
      return true;
    } catch {
      setError("Network error. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const startResendCountdown = () => {
    setResendCountdown(60);
    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Verify OTP and complete registration
  const verifyOTPAndRegister = async () => {
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the full 6-digit code");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Verify OTP
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify_otp", email, otp: otpCode }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setError(verifyData.error || "Verification failed");
        return;
      }

      // OTP verified — now register the user
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "register",
          email,
          password,
          name,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      localStorage.setItem("canopy_token", data.token);
      localStorage.setItem("canopy_user", JSON.stringify(data.user));
      onAuthenticated({ ...data.user, token: data.token });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === "login") {
      // Direct login (no OTP needed)
      setLoading(true);
      try {
        const res = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "login", email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Something went wrong");
          return;
        }

        localStorage.setItem("canopy_token", data.token);
        localStorage.setItem("canopy_user", JSON.stringify(data.user));
        onAuthenticated({ ...data.user, token: data.token });
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    } else {
      // Registration: send OTP first
      const sent = await sendOTP();
      if (sent) {
        setStep("verify_otp");
      }
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "google_oauth" }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Google sign-in unavailable");
        return;
      }

      if (data.authUrl) {
        window.location.href = data.authUrl;
        return;
      }

      if (data.user && data.token) {
        localStorage.setItem("canopy_token", data.token);
        localStorage.setItem("canopy_user", JSON.stringify(data.user));
        onAuthenticated({ ...data.user, token: data.token });
      }
    } catch {
      setError("Google sign-in failed. Try email login.");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-oat via-white to-sage/10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sage to-sage-dark shadow-lg shadow-sage/20 mb-4"
          >
            <span className="text-3xl" role="img" aria-label="Canopy logo">🌱</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-navy">Welcome to Canopy</h1>
          <p className="text-sm text-navy/60 mt-1">
            Understand, track &amp; reduce your carbon footprint
          </p>
        </div>

        <AnimatePresence mode="wait">
          {step === "credentials" ? (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: 0 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Google Sign-In Button */}
              <button
                onClick={handleGoogleAuth}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 rounded-xl bg-white border-2 border-oat-dark py-3 px-4 text-sm font-medium text-navy hover:border-navy/20 hover:shadow-md transition-all focus-visible:ring-2 focus-visible:ring-sage disabled:opacity-50 mb-4"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {googleLoading ? "Connecting..." : "Continue with Google"}
              </button>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-oat-dark"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-gradient-to-br from-oat via-white to-sage/10 px-3 text-xs text-navy/40">
                    or continue with email
                  </span>
                </div>
              </div>

              {/* Tab Switcher */}
              <div className="flex rounded-xl bg-oat p-1 mb-5" role="tablist">
                <button
                  role="tab"
                  aria-selected={mode === "login"}
                  onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === "login"
                      ? "bg-white text-navy shadow-sm"
                      : "text-navy/50 hover:text-navy"
                  }`}
                >
                  Log In
                </button>
                <button
                  role="tab"
                  aria-selected={mode === "register"}
                  onClick={() => { setMode("register"); setError(null); setSuccess(null); }}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    mode === "register"
                      ? "bg-white text-navy shadow-sm"
                      : "text-navy/50 hover:text-navy"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                className="space-y-4 bg-white rounded-2xl border border-oat-dark p-6 shadow-sm"
                aria-label={mode === "login" ? "Log in to your account" : "Create a new account"}
              >
                <AnimatePresence mode="wait">
                  {mode === "register" && (
                    <motion.div
                      key="name-field"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <label htmlFor="auth-name" className="block text-xs font-medium text-navy/70 mb-1.5">
                        Full Name
                      </label>
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        autoComplete="name"
                        className="w-full rounded-xl border border-oat-dark bg-oat/50 px-4 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label htmlFor="auth-email" className="block text-xs font-medium text-navy/70 mb-1.5">
                    Email Address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-xl border border-oat-dark bg-oat/50 px-4 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="auth-password" className="block text-xs font-medium text-navy/70 mb-1.5">
                    Password
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Min 8 chars, upper+lower+number" : "Your password"}
                    required
                    minLength={mode === "register" ? 8 : 1}
                    autoComplete={mode === "register" ? "new-password" : "current-password"}
                    className="w-full rounded-xl border border-oat-dark bg-oat/50 px-4 py-2.5 text-sm text-navy placeholder:text-navy/35 focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
                  />
                  {mode === "register" && (
                    <p className="text-[10px] text-navy/45 mt-1.5">
                      Must contain uppercase, lowercase, and a number.
                    </p>
                  )}
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="p-3 rounded-xl bg-terracotta/10 border border-terracotta/20 text-sm text-terracotta"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white hover:bg-navy-light transition-all focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "login"
                    ? "Log In"
                    : "Send Verification Code"}
                </button>

                {mode === "register" && (
                  <p className="text-[10px] text-center text-navy/40">
                    A 6-digit code will be sent to your email via Google SMTP
                  </p>
                )}
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="verify_otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* OTP Verification Step */}
              <div className="bg-white rounded-2xl border border-oat-dark p-6 shadow-sm">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-sage/10 mb-3">
                    <svg className="w-6 h-6 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-navy">Check your email</h2>
                  <p className="text-xs text-navy/50 mt-1">
                    We sent a 6-digit code to <span className="font-medium text-navy/70">{email}</span>
                  </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-2 mb-6" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className="w-11 h-12 text-center text-lg font-bold rounded-xl border-2 border-oat-dark bg-oat/30 text-navy focus:border-sage focus:ring-2 focus:ring-sage/20 transition-all"
                      aria-label={`Digit ${i + 1}`}
                    />
                  ))}
                </div>

                {success && (
                  <p className="text-xs text-sage-dark text-center mb-4 font-medium">
                    ✓ {success}
                  </p>
                )}

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    role="alert"
                    className="p-3 rounded-xl bg-terracotta/10 border border-terracotta/20 text-sm text-terracotta mb-4"
                  >
                    {error}
                  </motion.div>
                )}

                <button
                  onClick={verifyOTPAndRegister}
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full rounded-xl bg-navy py-3 text-sm font-semibold text-white hover:bg-navy-light transition-all focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {loading ? "Verifying..." : "Verify & Create Account"}
                </button>

                <div className="flex items-center justify-between mt-4">
                  <button
                    onClick={() => { setStep("credentials"); setError(null); setSuccess(null); setOtp(["", "", "", "", "", ""]); }}
                    className="text-xs text-navy/50 hover:text-navy transition-colors"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={sendOTP}
                    disabled={resendCountdown > 0 || loading}
                    className="text-xs text-sage-dark hover:text-sage disabled:text-navy/30 transition-colors font-medium"
                  >
                    {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : "Resend code"}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Demo mode option */}
        <p className="text-center text-xs text-navy/40 mt-5">
          <button
            onClick={() =>
              onAuthenticated({
                id: "demo-user",
                email: "demo@canopy.app",
                name: "Demo User",
                onboardingComplete: false,
                token: "demo-token",
              })
            }
            className="underline hover:text-navy transition-colors"
          >
            Try demo mode without an account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
