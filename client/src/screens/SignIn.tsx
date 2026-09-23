import React, { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Eye,
  EyeOff,
  Lock,
  Mail,
  KeyRound,
  ShieldCheck,
  X,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { apiClient } from "../services/apiClient";

const SignIn: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useApp();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState("");
  const [devCodeNotice, setDevCodeNotice] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const auth = await apiClient.login(formData.email, formData.password);
      await login(auth.user.email, auth.user.fullName, auth.access_token, auth.user);
      navigate("/app");
    } catch (err: any) {
      // Check if backend offline
      const online = await apiClient.isServerOnline();
      if (!online) {
        // Fallback for offline local development
        await login(formData.email);
        navigate("/app");
      } else {
        setError(err.message || "Invalid email or password. Please verify your credentials.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Forgot Password Step 1: Request Code ──
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotError("Please enter your registered email address.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      const res = await apiClient.forgotPassword(forgotEmail);
      setForgotSuccessMsg(res.message || "A 6-digit verification code has been dispatched via Brevo SMTP.");
      if (res.dev_code) {
        setDevCodeNotice(res.dev_code);
      }
      setForgotStep(2);
    } catch (err: any) {
      setForgotError(err.message || "Failed to dispatch verification code. Please check your email.");
    } finally {
      setForgotLoading(false);
    }
  };

  // ── Forgot Password Step 2: Verify Code and Reset Password ──
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetCode.trim()) {
      setForgotError("Please enter the 6-digit verification code.");
      return;
    }
    if (newPassword.length < 6) {
      setForgotError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError("Passwords do not match.");
      return;
    }

    setForgotLoading(true);
    setForgotError("");

    try {
      await apiClient.resetPassword({
        email: forgotEmail,
        code: resetCode,
        newPassword,
      });
      setForgotStep(3);
    } catch (err: any) {
      setForgotError(err.message || "Invalid or expired verification code.");
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setIsForgotOpen(false);
    setForgotStep(1);
    setForgotError("");
    setForgotSuccessMsg("");
    setDevCodeNotice(null);
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left panel */}
        <div className="relative hidden overflow-hidden bg-blue-600 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-950" />

          <div className="relative z-10 flex flex-col justify-between p-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-md">
                <Brain size={23} />
              </div>

              <span className="text-xl font-bold">
                Cogni<span className="text-blue-200">Lens</span>
              </span>
            </Link>

            <div className="max-w-lg">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3.5 py-1 text-xs font-semibold text-blue-200 backdrop-blur">
                <Sparkles size={14} className="text-blue-300" />
                <span>Azure Cloud Grounded Intelligence</span>
              </div>

              <h1 className="text-5xl font-bold leading-tight">
                Your knowledge.
                <br />
                <span className="text-blue-200">Made intelligent.</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-blue-100">
                Upload documents, practice with AI tutors, generate quizzes and
                track your learning progress with personal persistence on Azure Database.
              </p>

              <div className="mt-8 space-y-4">
                <Benefit text="AI-powered document understanding & semantic search" />
                <Benefit text="Strictly isolated, personalized student workspace" />
                <Benefit text="Brevo SMTP secure password recovery" />
                <Benefit text="Active recall quizzes & automated study plans" />
              </div>
            </div>

            <p className="text-sm text-blue-200">
              AI-powered learning with CogniLens &bull; Azure Cloud Grounding
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate("/")}
              className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
            >
              <ArrowLeft size={16} />
              Back to home
            </button>

            <div className="mb-8 lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
                  <Brain size={22} />
                </div>

                <span className="text-xl font-bold">
                  Cogni<span className="text-blue-400">Lens</span>
                </span>
              </Link>
            </div>

            <div>
              <h2 className="text-3xl font-bold">Welcome back</h2>
              <p className="mt-2 text-slate-400">
                Sign in to continue to your personalized CogniLens workspace.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Email */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Email address
                </label>

                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-300">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(formData.email);
                      setIsForgotOpen(true);
                    }}
                    className="text-sm font-medium text-blue-400 hover:text-blue-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 outline-none transition placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400 flex items-start gap-2.5">
                  <div className="mt-0.5">&bull;</div>
                  <div>{error}</div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold transition hover:bg-blue-500 shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>

            <div className="my-7 flex items-center gap-4">
              <div className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-slate-600">OR</span>
              <div className="h-px flex-1 bg-white/10" />
            </div>

            <p className="text-center text-sm text-slate-400">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="font-semibold text-blue-400 hover:text-blue-300 transition"
              >
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* FORGOT PASSWORD MODAL (Brevo SMTP 2-Step Verification)                */}
      {/* ==================================================================== */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-slate-900 p-7 shadow-2xl shadow-blue-950/50">
            {/* Close button */}
            <button
              onClick={closeForgotModal}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <KeyRound size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Reset Password</h3>
                <p className="text-xs text-slate-400">
                  Brevo SMTP Secure Verification
                </p>
              </div>
            </div>

            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-6">
              <div className={`h-1.5 flex-1 rounded-full ${forgotStep >= 1 ? 'bg-blue-500' : 'bg-white/10'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${forgotStep >= 2 ? 'bg-blue-500' : 'bg-white/10'}`} />
              <div className={`h-1.5 flex-1 rounded-full ${forgotStep === 3 ? 'bg-emerald-500' : 'bg-white/10'}`} />
            </div>

            {/* Error banner */}
            {forgotError && (
              <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
                {forgotError}
              </div>
            )}

            {/* ==================== STEP 1: Enter Email ==================== */}
            {forgotStep === 1 && (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Enter your registered account email address. We will dispatch a 6-digit verification code to your inbox.
                </p>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setForgotError(""); }}
                      placeholder="student@example.com"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {forgotLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Sending code via Brevo SMTP...</span>
                    </>
                  ) : (
                    <span>Send Verification Code</span>
                  )}
                </button>
              </form>
            )}

            {/* ==================== STEP 2: Code & New Password ==================== */}
            {forgotStep === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                {forgotSuccessMsg && (
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                    {forgotSuccessMsg}
                  </div>
                )}

                {devCodeNotice && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center justify-between">
                    <span>Developer Verification Code:</span>
                    <strong className="font-mono text-sm tracking-widest text-emerald-200">{devCodeNotice}</strong>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <ShieldCheck size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => { setResetCode(e.target.value); setForgotError(""); }}
                      placeholder="123456"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 font-mono text-lg tracking-widest text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    New Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setForgotError(""); }}
                      placeholder="Enter new password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-300">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => { setConfirmNewPassword(e.target.value); setForgotError(""); }}
                      placeholder="Confirm new password"
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-300 hover:bg-white/10 transition"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/30 hover:bg-blue-500 transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {forgotLoading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <span>Reset Password</span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ==================== STEP 3: Success ==================== */}
            {forgotStep === 3 && (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <CheckCircle2 size={30} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">Password Updated!</h4>
                  <p className="mt-1 text-sm text-slate-300">
                    Your password has been securely updated. You can now sign in with your new credentials.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, email: forgotEmail, password: "" }));
                    closeForgotModal();
                  }}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Benefit: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex items-center gap-3 text-blue-100">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
        ✓
      </div>
      <span>{text}</span>
    </div>
  );
};

export default SignIn;