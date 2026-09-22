import React, { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const SignUp: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    /*
     * Connect your backend here.
     *
     * Example:
     *
     * const response = await fetch(
     *   "http://localhost:8000/auth/register",
     *   {
     *     method: "POST",
     *     headers: {
     *       "Content-Type": "application/json",
     *     },
     *     body: JSON.stringify({
     *       name: formData.name,
     *       email: formData.email,
     *       password: formData.password,
     *     }),
     *   }
     * );
     *
     * const data = await response.json();
     */

    console.log("Sign up:", formData);

    // Temporary navigation
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left section */}
        <div className="relative hidden overflow-hidden bg-slate-900 lg:flex">
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl" />

          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between p-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
                <Brain size={23} />
              </div>

              <span className="text-xl font-bold">
                Cogni<span className="text-indigo-400">Lens</span>
              </span>
            </Link>

            <div className="max-w-lg">
              <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-indigo-400">
                Welcome to CogniLens
              </p>

              <h1 className="text-5xl font-bold leading-tight">
                Learn from your
                <span className="text-indigo-400"> knowledge.</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-slate-400">
                Build your personal AI-powered knowledge workspace and
                interact with your documents in a completely new way.
              </p>

              <div className="mt-8 space-y-4">
                <Benefit text="Upload and analyze documents" />
                <Benefit text="Chat with your knowledge base" />
                <Benefit text="Generate AI-powered quizzes" />
                <Benefit text="Search your documents intelligently" />
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Your intelligent learning companion.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate("/")}
              className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to home
            </button>

            {/* Mobile logo */}
            <div className="mb-8 lg:hidden">
              <Link to="/" className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
                  <Brain size={22} />
                </div>

                <span className="text-xl font-bold">
                  Cogni<span className="text-indigo-400">Lens</span>
                </span>
              </Link>
            </div>

            <h2 className="text-3xl font-bold">Create your account</h2>

            <p className="mt-2 text-slate-400">
              Start exploring your knowledge with CogniLens.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Name */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Full name
                </label>

                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

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
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm password
                </label>

                <div className="relative">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                  />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-12 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <label className="flex items-start gap-3 text-sm text-slate-400">
                <input
                  type="checkbox"
                  required
                  className="mt-1 h-4 w-4 accent-indigo-600"
                />

                <span>
                  I agree to the Terms of Service and Privacy Policy.
                </span>
              </label>

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold transition hover:bg-indigo-500"
              >
                Create Account
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const Benefit: React.FC<{ text: string }> = ({ text }) => {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
        <Check size={14} />
      </div>

      <span>{text}</span>
    </div>
  );
};

export default SignUp;