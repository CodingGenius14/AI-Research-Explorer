import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn(email, password);
      navigate("/home");
    } catch (err) {
      setError(
        err.message || "Failed to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 -left-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block font-heading font-bold text-xl gradient-text mb-6"
          >
            AI Research Explorer
          </Link>
          <h1 className="text-4xl font-bold font-heading text-text-primary mb-2">
            Welcome Back
          </h1>
          <p className="text-text-secondary">Sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-8 space-y-5"
        >
          {error && (
            <div className="p-4 bg-danger/10 border border-danger/30 rounded-xl">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface-light border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-dark disabled:bg-surface-lighter disabled:text-text-muted text-white font-semibold rounded-xl transition shadow-lg shadow-primary/20"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-text-secondary mt-6">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-primary-light hover:text-primary font-medium"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
