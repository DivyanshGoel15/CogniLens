import React from "react";
import {
  Brain,
  FileText,
  MessageSquare,
  ScanEye,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
              <Brain size={23} />
            </div>

            <span className="text-xl font-bold tracking-tight">
              Cogni<span className="text-indigo-400">Lens</span>
            </span>
          </button>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#how-it-works"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              How it works
            </a>

            <button
              onClick={() => navigate("/signin")}
              className="text-sm text-slate-300 hover:text-white"
            >
              Sign in
            </button>

            <button
              onClick={() => navigate("/signup")}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-indigo-500"
            >
              Get Started
            </button>
          </div>

          <button
            onClick={() => navigate("/signup")}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold md:hidden"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-indigo-600/20 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-24 text-center md:pt-32">
          <div className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
            <Sparkles size={16} />
            AI-powered learning & knowledge
          </div>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-7xl">
            Turn your documents into
            <span className="text-indigo-400"> intelligent knowledge</span>
          </h1>

          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-400">
            CogniLens helps you understand documents, ask questions,
            generate quizzes, and interact with your knowledge using
            AI-powered tools.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <button
              onClick={() => navigate("/signup")}
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold transition hover:bg-indigo-500"
            >
              Start Learning
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate("/signin")}
              className="rounded-xl border border-white/10 bg-white/5 px-7 py-3.5 font-semibold transition hover:bg-white/10"
            >
              Sign In
            </button>
          </div>

          {/* Product Preview */}
          <div className="mx-auto mt-20 max-w-5xl">
            <div className="rounded-2xl border border-white/10 bg-slate-900 p-2 shadow-2xl shadow-indigo-950/50">
              <div className="rounded-xl border border-white/5 bg-slate-950 p-8">
                <div className="mb-6 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-yellow-400" />
                  <div className="h-3 w-3 rounded-full bg-green-400" />
                </div>

                <div className="grid gap-5 md:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <FileText className="mb-4 text-indigo-400" />
                    <h3 className="font-semibold">Documents</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Upload and process your learning material.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <MessageSquare className="mb-4 text-indigo-400" />
                    <h3 className="font-semibold">AI Chat</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Ask questions about your documents.
                    </p>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
                    <ScanEye className="mb-4 text-indigo-400" />
                    <h3 className="font-semibold">Multimodal AI</h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Understand text, images and more.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-semibold text-indigo-400">FEATURES</p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              Everything you need to learn smarter
            </h2>

            <p className="mt-4 text-slate-400">
              One intelligent platform for documents, retrieval, AI
              conversations and learning.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<FileText />}
              title="Document Intelligence"
              description="Process PDFs and other documents into searchable knowledge."
            />

            <FeatureCard
              icon={<MessageSquare />}
              title="AI-Powered Chat"
              description="Ask questions and get answers grounded in your own content."
            />

            <FeatureCard
              icon={<Brain />}
              title="Smart Quizzes"
              description="Generate personalized quizzes from your learning material."
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="border-t border-white/10 bg-slate-900/30 py-24"
      >
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <p className="font-semibold text-indigo-400">HOW IT WORKS</p>

            <h2 className="mt-3 text-3xl font-bold md:text-4xl">
              From document to understanding
            </h2>
          </div>

          <div className="mx-auto mt-14 grid max-w-5xl gap-8 md:grid-cols-3">
            <Step
              number="01"
              title="Upload"
              description="Add your documents and learning material."
            />

            <Step
              number="02"
              title="Understand"
              description="CogniLens processes and indexes your content."
            />

            <Step
              number="03"
              title="Interact"
              description="Chat, search, quiz and learn from your knowledge."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/10 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-4xl font-bold">
            Start building your knowledge base
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-slate-400">
            Create your CogniLens account and start exploring your
            documents with AI.
          </p>

          <button
            onClick={() => navigate("/signup")}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-3.5 font-semibold hover:bg-indigo-500"
          >
            Create Free Account
            <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-6 text-sm text-slate-500 md:flex-row">
          <p>© {new Date().getFullYear()} CogniLens. All rights reserved.</p>

          <p>AI-powered knowledge platform</p>
        </div>
      </footer>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
}) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition hover:border-indigo-500/30 hover:bg-white/[0.05]">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
        {icon}
      </div>

      <h3 className="text-xl font-semibold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-400">{description}</p>
    </div>
  );
};

interface StepProps {
  number: string;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ number, title, description }) => {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 font-bold">
        {number}
      </div>

      <h3 className="mt-5 text-xl font-semibold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-400">{description}</p>
    </div>
  );
};

export default LandingPage;