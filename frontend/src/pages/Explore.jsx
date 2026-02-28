import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function Explore() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState({});
  const [savedPapers, setSavedPapers] = useState(new Set());

  // Load user's saved papers on mount
  useEffect(() => {
    if (!user) return;

    const loadSavedPapers = async () => {
      try {
        const { data } = await supabase
          .from("saved_papers")
          .select("paper_id")
          .eq("user_id", user.id);

        if (data) {
          setSavedPapers(new Set(data.map((p) => p.paper_id)));
        }
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

      // Update local state
      setSavedPapers((prev) => new Set([...prev, paperId]));
    } catch (err) {
      console.error("Save error:", err);
      setError(`Failed to save paper: ${err.message}`);
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

  // Search papers by query and save results to Supabase if not already present
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
          headers: {
            "Content-Type": "application/json",
          },
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

      if ((data.data || []).length === 0) {
        setError("No papers found. Try a different search.");
      }
    } catch (err) {
      setError(err.message || "Failed to search papers. Please try again.");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Explore Research
          </h1>
          <p className="text-xl text-gray-400">
            Discover papers powered by arXiv
          </p>
        </div>

        {/* Render cold start warning for Render.com */}
        {results.length === 0 && !loading && (
          <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg">
            <p className="text-yellow-300 text-sm">
              <strong>Note:</strong> Due to Render's free tier cold start, it
              may take up to 30 seconds for the first search result to appear.
              After that, results will load instantly.
            </p>
          </div>
        )}

        {/* Search Bar */}
        <form onSubmit={searchPapers} className="mb-8">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for papers (e.g., 'transformers', 'AI safety')..."
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Searching papers...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && searchQuery && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No papers found</p>
            <p className="text-gray-500">
              Try searching with different keywords
            </p>
          </div>
        )}

        {/* Results Grid */}
        {!loading && results.length > 0 && (
          <div className="grid gap-4">
            {results.map((paper) => {
              const paperId = getPaperId(paper);
              const isSaved = savedPapers.has(paperId);
              const isSaving = saving[paperId];

              return (
                <div
                  key={paperId}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-white mb-1">
                        {paper.title || "Untitled"}
                      </h2>
                      <p className="text-sm text-gray-400 mb-1">
                        {getAuthors(paper)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {paper.year
                          ? `Published: ${paper.year}`
                          : "Year unknown"}
                      </p>
                    </div>
                    <button
                      onClick={() => savePaper(paper)}
                      disabled={isSaving || isSaved}
                      className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
                        isSaved
                          ? "bg-green-900/30 text-green-400 border border-green-700"
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      } disabled:opacity-50`}
                    >
                      {isSaving ? "Saving..." : isSaved ? "✓ Saved" : "Save"}
                    </button>
                  </div>

                  {/* Abstract */}
                  {paper.abstract && (
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {paper.abstract}
                    </p>
                  )}

                  {/* Link */}
                  <a
                    href={
                      paper.externalIds?.ArXiv
                        ? `https://arxiv.org/abs/${paper.externalIds.ArXiv}`
                        : `https://arxiv.org/`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-blue-500 hover:text-blue-400 text-sm underline"
                  >
                    View Paper →
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {/* Initial State */}
        {!loading && results.length === 0 && !searchQuery && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">Start exploring</p>
            <p className="text-gray-500">
              Search for topics to discover and save research papers
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
