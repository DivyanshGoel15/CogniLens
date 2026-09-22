import React, { useState } from "react";
import {
  ArrowLeft,
  Brain,
  Eye,
  EyeOff,
  Lock,
  Mail,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const SignIn: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    /*
     * Connect your backend here.
     *
     * Example:
     *
     * const response = await fetch("http://localhost:8000/auth/login", {
     *   method: "POST",
     *   headers: {
     *     "Content-Type": "application/json",
     *   },
     *   body: JSON.stringify(formData),
     * });
     *
     * const data = await response.json();
     *
     * localStorage.setItem("token", data.access_token);
     */

    console.log("Sign in:", formData);

    // Temporary navigation until backend authentication is connected
    navigate("/app");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left panel */}
        <div className="relative hidden overflow-hidden bg-indigo-600 lg:flex">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-950" />

          <div className="relative z-10 flex flex-col justify-between p-12">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                <Brain size={23} />
              </div>

              <span className="text-xl font-bold">
                Cogni<span className="text-indigo-200">Lens</span>
              </span>
            </Link>

            <div className="max-w-lg">
              <h1 className="text-5xl font-bold leading-tight">
                Your knowledge.
                <br />
                <span className="text-indigo-200">Made intelligent.</span>
              </h1>

              <p className="mt-6 text-lg leading-8 text-indigo-100">
                Upload documents, ask questions, generate quizzes and
                explore your knowledge with AI.
              </p>

              <div className="mt-8 space-y-4">
                <Benefit text="AI-powered document understanding" />
                <Benefit text="Context-aware conversations" />
                <Benefit text="Smart quiz generation" />
              </div>
            </div>

            <p className="text-sm text-indigo-200">
              AI-powered learning with CogniLens
            </p>
          </div>
        </div>

        {/* Right panel */}
        <div className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <button
              onClick={() => navigate("/")}
              className="mb-8 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
            >
              <ArrowLeft size={16} />
              Back to home
            </button>

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

            <div>
              <h2 className="text-3xl font-bold">Welcome back</h2>

              <p className="mt-2 text-slate-400">
                Sign in to continue to your CogniLens workspace.
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
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-11 pr-4 outline-none transition placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                    className="text-sm text-indigo-400 hover:text-indigo-300"
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
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
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

              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold transition hover:bg-indigo-500"
              >
                Sign In
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
                className="font-semibold text-indigo-400 hover:text-indigo-300"
              >
                Create one
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
    <div className="flex items-center gap-3 text-indigo-100">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
        ✓
      </div>

      <span>{text}</span>
    </div>
  );
};

export default SignIn;