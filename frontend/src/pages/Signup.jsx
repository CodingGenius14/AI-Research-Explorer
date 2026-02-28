import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password);
      setSuccess("Account created! Check your email to confirm your account.");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      // Redirect to login after a brief delay
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-0 -right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link
            to="/"
            className="inline-block font-heading font-bold text-xl gradient-text mb-6"
          >
            AI Research Explorer
          </Link>
          <h1 className="text-4xl font-bold font-heading text-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-text-secondary">Join us to explore AI research</p>
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

          {success && (
            <div className="p-4 bg-success/10 border border-success/30 rounded-xl">
              <p className="text-success text-sm">{success}</p>
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

          <div>
            <label className="block text-text-secondary text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center text-text-secondary mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary-light hover:text-primary font-medium"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
