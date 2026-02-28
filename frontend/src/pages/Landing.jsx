import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";

const features = [
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
        />
      </svg>
    ),
    title: "Smart Search",
    description:
      "Search through thousands of arXiv papers with intelligent keyword matching and instant results.",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
        />
      </svg>
    ),
    title: "Save & Organize",
    description:
      "Build your personal research library. Save papers instantly and access them anytime from any device.",
  },
  {
    icon: (
      <svg
        className="w-8 h-8"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
        />
      </svg>
    ),
    title: "AI Recommendations",
    description:
      "Get personalized paper recommendations powered by machine learning, based on your research interests.",
  },
];

const stats = [
  { value: "100K+", label: "Papers Indexed" },
  { value: "384-dim", label: "Embedding Vectors" },
  { value: "< 1s", label: "Search Speed" },
];

// Floating particles background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: Math.random() * 4 + 2,
            height: Math.random() * 4 + 2,
            background: `rgba(108, 99, 255, ${Math.random() * 0.3 + 0.1})`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: Math.random() * 4 + 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-surface relative overflow-hidden">
      {/* Gradient blobs */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
      <div className="absolute top-40 -right-40 w-96 h-96 bg-accent/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <FloatingParticles />

      {/* Nav */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
        <span className="font-heading text-xl font-bold gradient-text">
          AI Research Explorer
        </span>
        <div className="flex gap-3">
          <Link
            to="/login"
            className="px-5 py-2 text-sm text-text-secondary hover:text-text-primary transition font-medium"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-5 py-2 text-sm bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-wide uppercase bg-primary/10 text-primary-light border border-primary/20 rounded-full">
            Powered by Machine Learning
          </span>
          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold font-heading leading-[1.05] mb-6">
            <span className="text-text-primary">Discover the </span>
            <span className="gradient-text">Future of AI</span>
            <span className="text-text-primary"> Research</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
            Search, save, and get personalized recommendations from thousands of
            cutting-edge AI research papers — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition shadow-lg shadow-primary/25 hover:shadow-primary/40 text-lg"
            >
              Start Exploring — It's Free
            </Link>
            <Link
              to="/login"
              className="px-8 py-4 glass-card hover:bg-surface-lighter text-text-primary font-semibold rounded-xl transition text-lg"
            >
              Sign In
            </Link>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="flex justify-center gap-12 mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold font-heading gradient-text">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-text-muted mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary mb-3">
            Everything You Need
          </h2>
          <p className="text-text-secondary text-lg">
            A complete toolkit for navigating AI research
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-card rounded-2xl p-8 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary-light flex items-center justify-center mb-5 group-hover:bg-primary/20 transition">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold font-heading text-text-primary mb-3">
                {feature.title}
              </h3>
              <p className="text-text-secondary leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="glass-card rounded-2xl p-12 text-center border-primary/20"
        >
          <h2 className="text-3xl sm:text-4xl font-bold font-heading text-text-primary mb-4">
            Ready to Dive In?
          </h2>
          <p className="text-text-secondary text-lg mb-8 max-w-xl mx-auto">
            Join researchers who use AI Research Explorer to stay ahead of the
            curve.
          </p>
          <Link
            to="/signup"
            className="inline-block px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition shadow-lg shadow-primary/25 text-lg"
          >
            Create Free Account
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-8 text-center text-text-muted text-sm">
        © 2026 AI Research Explorer. Built with React, FastAPI & ONNX.
      </footer>
    </div>
  );
}
