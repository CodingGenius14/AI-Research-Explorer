import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
        <div className="skeleton h-10 w-24 rounded-lg" />
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
  exit: { opacity: 0, x: -40, transition: { duration: 0.25 } },
};

export default function Library() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    const loadSavedPapers = async () => {
      try {
        setLoading(true);
        setError("");
        const { data, error: fetchError } = await supabase
          .from("saved_papers")
          .select(
            `paper_id, notes, papers (id, title, abstract, authors, url, year)`,
          )
          .eq("user_id", user.id)
          .order("saved_at", { ascending: false });
        if (fetchError) throw fetchError;
        const papersWithDetails = data
          ?.map((item) => ({ ...item.papers, savedNotes: item.notes }))
          .filter((paper) => paper && paper.id);
        setPapers(papersWithDetails || []);
      } catch (err) {
        console.error("Error loading saved papers:", err);
        setError("Failed to load saved papers");
      } finally {
        setLoading(false);
      }
    };
    loadSavedPapers();
  }, [user]);

  const filteredPapers = papers.filter(
    (paper) =>
      paper.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.abstract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      paper.authors?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getAuthors = (author_string) => {
    if (!author_string) return "Unknown authors";
    const authors = author_string.split(",").map((a) => a.trim());
    return (
      authors.slice(0, 3).join(", ") +
      (authors.length > 3 ? ` +${authors.length - 3} more` : "")
    );
  };

  const removePaper = async (paperId, paperTitle) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .delete()
        .eq("user_id", user.id)
        .eq("paper_id", paperId);
      if (error) throw error;
      setPapers((prev) => prev.filter((p) => p.id !== paperId));
      toast.success("Paper removed from library");
    } catch (err) {
      console.error("Error removing paper:", err);
      toast.error("Failed to remove paper");
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold font-heading text-text-primary mb-2">
              Research Library
            </h1>
            <p className="text-lg text-text-secondary">
              {papers.length > 0
                ? `${papers.length} paper${papers.length !== 1 ? "s" : ""} saved`
                : "Your collection of saved papers"}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        {/* Search */}
        {papers.length > 0 && (
          <div className="mb-6 relative">
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
              placeholder="Filter your papers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-surface-light border border-border rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
            />
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && papers.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-xl p-16 text-center"
          >
            <div className="text-6xl mb-5">📚</div>
            <p className="text-text-primary text-xl font-heading font-bold mb-3">
              No papers saved yet
            </p>
            <p className="text-text-secondary text-sm mb-6 max-w-md mx-auto">
              Start by exploring and saving research papers. They'll appear here
              in your personal library.
            </p>
            <Link
              to="/explore"
              className="inline-block px-6 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition shadow-lg shadow-primary/20"
            >
              Start Exploring
            </Link>
          </motion.div>
        )}

        {/* No search results */}
        {!loading && papers.length > 0 && filteredPapers.length === 0 && (
          <div className="glass-card rounded-xl p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-text-primary text-lg font-medium mb-2">
              No papers match your search
            </p>
            <p className="text-text-secondary text-sm">
              Try a different search query
            </p>
          </div>
        )}

        {/* Papers list */}
        {!loading && filteredPapers.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredPapers.map((paper, i) => (
                <motion.div
                  key={paper.id}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  className="group glass-card rounded-xl p-6 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-primary-light transition-colors">
                        {paper.title || "Untitled"}
                      </h2>
                      <p className="text-sm text-text-secondary mb-1">
                        {getAuthors(paper.authors)}
                      </p>
                      <p className="text-xs text-text-muted">
                        {paper.year
                          ? `Published: ${paper.year}`
                          : "Year unknown"}
                      </p>
                    </div>
                    <button
                      onClick={() => removePaper(paper.id, paper.title)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary hover:text-danger hover:bg-danger/10 border border-border hover:border-danger/30 transition-all"
                    >
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
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                      Remove
                    </button>
                  </div>

                  {paper.abstract && (
                    <p className="text-text-secondary text-sm mb-4 line-clamp-3 leading-relaxed">
                      {paper.abstract}
                    </p>
                  )}

                  <a
                    href={paper.url || "https://arxiv.org/"}
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
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
