import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border p-6 bg-surface-light">
      <div className="flex justify-between items-start gap-4 mb-3">
        <div className="flex-1">
          <div className="skeleton h-5 w-3/4 mb-2" />
          <div className="skeleton h-3 w-1/2 mb-2" />
          <div className="skeleton h-3 w-1/4" />
        </div>
        <div className="skeleton h-10 w-20 rounded-lg" />
      </div>
      <div className="skeleton h-3 w-full mb-2" />
      <div className="skeleton h-3 w-5/6 mb-2" />
      <div className="skeleton h-3 w-2/3" />
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: "easeOut" },
  }),
};

export default function Explore() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState({});
  const [savedPapers, setSavedPapers] = useState(new Set());

  useEffect(() => {
    if (!user) return;
    const loadSavedPapers = async () => {
      try {
        const { data } = await supabase
          .from("saved_papers")
          .select("paper_id")
          .eq("user_id", user.id);
        if (data) setSavedPapers(new Set(data.map((p) => p.paper_id)));
      } catch (err) {
        console.error("Error loading saved papers:", err);
      }
    };
    loadSavedPapers();
  }, [user]);

  const savePaper = async (paper) => {
    if (!user) return;
    const paperId =
      paper.paperId || paper.title.toLowerCase().replace(/\s+/g, "-");

    if (savedPapers.has(paperId)) {
      toast("Already in your library", { icon: "📌" });
      return;
    }

    setSaving((prev) => ({ ...prev, [paperId]: true }));
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/save-paper`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paper, user_id: user.id }),
        },
      );
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to save paper");
      }
      setSavedPapers((prev) => new Set([...prev, paperId]));
      toast.success("Paper saved to your library!");
    } catch (err) {
      console.error("Save error:", err);
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving((prev) => ({ ...prev, [paperId]: false }));
    }
  };

  const getAuthors = (paper) => {
    if (!paper.authors || paper.authors.length === 0) return "Unknown authors";
    return (
      paper.authors
        .slice(0, 3)
        .map((a) => a.name)
        .join(", ") +
      (paper.authors.length > 3 ? ` +${paper.authors.length - 3} more` : "")
    );
  };

  const getPaperId = (paper) =>
    paper.paperId || paper.title.toLowerCase().replace(/\s+/g, "-");

  const searchPapers = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/search-papers`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        },
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.detail || errorData.error || "Failed to search papers",
        );
      }
      const data = await response.json();
      setResults(data.data || []);
      if ((data.data || []).length === 0)
        setError("No papers found. Try a different search.");
    } catch (err) {
      setError(err.message || "Failed to search papers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-text-primary mb-2">
            Explore Research
          </h1>
          <p className="text-lg text-text-secondary">
            Discover papers powered by arXiv
          </p>
        </div>

        {/* Cold start warning */}
        {results.length === 0 && !loading && (
          <div className="mb-6 p-4 glass-card rounded-xl border-warning/20">
            <p className="text-warning text-sm">
              <strong>Note:</strong> First search may take up to 30 seconds due
              to server cold start. After that, results load instantly.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={searchPapers} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for papers (e.g., 'transformers', 'AI safety')..."
                className="w-full pl-12 pr-4 py-3.5 bg-surface-light border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3.5 bg-primary hover:bg-primary-dark disabled:bg-surface-lighter disabled:text-text-muted text-white font-semibold rounded-xl transition shadow-lg shadow-primary/20 hover:shadow-primary/30"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {/* Error */}
        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty */}
        {!loading && results.length === 0 && searchQuery && !error && (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-text-primary text-lg font-medium mb-2">
              No papers found
            </p>
            <p className="text-text-secondary text-sm">
              Try searching with different keywords
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-3">
            {results.map((paper, i) => {
              const paperId = getPaperId(paper);
              const isSaved = savedPapers.has(paperId);
              const isSaving = saving[paperId];

              return (
                <motion.div
                  key={paperId}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="group glass-card rounded-xl p-6 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-primary-light transition-colors">
                        {paper.title || "Untitled"}
                      </h2>
                      <p className="text-sm text-text-secondary mb-1">
                        {getAuthors(paper)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {paper.year
                          ? `Published: ${paper.year}`
                          : "Year unknown"}
                      </p>
                    </div>
                    <button
                      onClick={() => savePaper(paper)}
                      disabled={isSaving || isSaved}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm whitespace-nowrap transition-all ${
                        isSaved
                          ? "bg-success/10 text-success border border-success/30"
                          : "bg-primary hover:bg-primary-dark text-white shadow-md shadow-primary/20"
                      } disabled:opacity-60`}
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving
                        </>
                      ) : isSaved ? (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4.5 12.75l6 6 9-13.5"
                            />
                          </svg>
                          Saved
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                            />
                          </svg>
                          Save
                        </>
                      )}
                    </button>
                  </div>

                  {paper.abstract && (
                    <p className="text-text-secondary text-sm mb-4 line-clamp-3 leading-relaxed">
                      {paper.abstract}
                    </p>
                  )}

                  <a
                    href={
                      paper.externalIds?.ArXiv
                        ? `https://arxiv.org/abs/${paper.externalIds.ArXiv}`
                        : "https://arxiv.org/"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-light hover:text-primary text-sm font-medium transition"
                  >
                    Read on arXiv
                    <svg
                      className="w-3.5 h-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                      />
                    </svg>
                  </a>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Initial State */}
        {!loading && results.length === 0 && !searchQuery && (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">🚀</div>
            <p className="text-text-primary text-lg font-medium mb-2">
              Start exploring
            </p>
            <p className="text-text-secondary text-sm">
              Search for topics to discover and save research papers
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
