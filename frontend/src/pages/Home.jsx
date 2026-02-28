import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";

function SkeletonCard({ tall }) {
  return (
    <div className="rounded-xl border border-border p-5 bg-surface-light">
      <div className="skeleton h-5 w-3/4 mb-3" />
      <div className="skeleton h-3 w-1/2 mb-4" />
      {tall && <div className="skeleton h-3 w-full mb-2" />}
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
    transition: { duration: 0.4, delay: i * 0.08, ease: "easeOut" },
  }),
};

export default function Home() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsMessage, setRecsMessage] = useState("");

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    supabase
      .from("saved_papers")
      .select(
        `paper_id, notes, papers (id, title, abstract, authors, url, year)`,
      )
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        const papersWithDetails = data
          ?.map((item) => ({ ...item.papers, savedNotes: item.notes }))
          .filter((paper) => paper && paper.id);
        setPapers(papersWithDetails || []);
      })
      .catch(() => {
        setError("Failed to load your saved papers");
        setPapers([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setRecsLoading(true);
    setRecsMessage("");
    fetch(
      `${import.meta.env.VITE_API_URL}/api/recommendations/${user.id}?limit=6`,
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.status === "not_enough_data") {
          setRecsMessage(data.message);
          setRecommendations([]);
        } else if (data.status === "success") {
          setRecommendations(data.recommendations || []);
        } else {
          setRecsMessage("Unable to load recommendations right now.");
        }
      })
      .catch(() => setRecsMessage("Unable to load recommendations right now."))
      .finally(() => setRecsLoading(false));
  }, [user]);

  const savedCount = papers.length;
  const neededForRecs = Math.max(0, 5 - savedCount);

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-bold font-heading text-text-primary mb-2">
            Welcome back,{" "}
            <span className="gradient-text">{user?.email?.split("@")[0]}</span>
          </h1>
          <p className="text-lg text-text-secondary">
            Your AI research dashboard
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Saved Papers", value: savedCount, icon: "📄" },
            {
              label: "Recommendations",
              value: recommendations.length,
              icon: "✨",
            },
            {
              label: "Top Match",
              value: recommendations[0]
                ? `${Math.round(recommendations[0].similarity * 100)}%`
                : "—",
              icon: "🎯",
            },
            {
              label: "Status",
              value: savedCount >= 5 ? "Active" : `${neededForRecs} more`,
              icon: savedCount >= 5 ? "🟢" : "🟡",
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="glass-card rounded-xl p-5"
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold font-heading text-text-primary">
                {stat.value}
              </div>
              <div className="text-xs text-text-muted mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Recommendations Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold font-heading text-text-primary">
                Recommended For You
              </h2>
              <p className="text-sm text-text-muted mt-1">
                Based on your saved papers
              </p>
            </div>
            {recommendations.length > 0 && (
              <Link
                to="/explore"
                className="text-sm text-primary-light hover:text-primary transition font-medium"
              >
                Discover more →
              </Link>
            )}
          </div>

          {/* Loading skeletons */}
          {recsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Not enough data — progress bar */}
          {!recsLoading && recsMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-8 text-center border-primary/20"
            >
              <div className="text-5xl mb-4">🔬</div>
              <p className="text-text-primary text-lg font-medium mb-2">
                Unlock Recommendations
              </p>
              <p className="text-text-secondary text-sm mb-5 max-w-md mx-auto">
                {recsMessage}
              </p>
              {neededForRecs > 0 && (
                <div className="max-w-xs mx-auto mb-5">
                  <div className="flex justify-between text-xs text-text-muted mb-1.5">
                    <span>{savedCount} / 5 papers saved</span>
                    <span>{neededForRecs} more needed</span>
                  </div>
                  <div className="w-full h-2 bg-surface-lighter rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(savedCount / 5) * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>
              )}
              <Link
                to="/explore"
                className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition"
              >
                Explore Papers
              </Link>
            </motion.div>
          )}

          {/* Recommendation cards */}
          {!recsLoading && recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((paper, i) => (
                <motion.div
                  key={paper.id || i}
                  custom={i}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  className="group glass-card rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 cursor-default"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-text-primary leading-snug line-clamp-2 group-hover:text-primary-light transition-colors">
                      {paper.title || "Untitled"}
                    </h3>
                    {paper.similarity != null && (
                      <span className="shrink-0 text-xs font-semibold bg-primary/15 text-primary-light border border-primary/25 px-2.5 py-0.5 rounded-full">
                        {Math.round(paper.similarity * 100)}%
                      </span>
                    )}
                  </div>
                  <p className="text-text-muted text-xs mb-4 line-clamp-3 leading-relaxed">
                    {paper.abstract || "No abstract available."}
                  </p>
                  <a
                    href={`https://arxiv.org/abs/${paper.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary-light hover:text-primary text-xs font-medium transition"
                  >
                    Read on arXiv
                    <svg
                      className="w-3 h-3"
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
            </div>
          )}
        </div>

        {/* Saved Papers Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold font-heading text-text-primary mb-6">
            Your Saved Papers
          </h2>

          {loading && (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} tall />
              ))}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-danger/10 border border-danger/30 rounded-xl">
              <p className="text-danger text-sm">{error}</p>
            </div>
          )}

          {!loading && papers.length === 0 && !error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card rounded-xl p-12 text-center"
            >
              <div className="text-5xl mb-4">📚</div>
              <p className="text-text-primary text-lg font-medium mb-2">
                No papers saved yet
              </p>
              <p className="text-text-secondary text-sm mb-5">
                Start by exploring and saving research papers to your library
              </p>
              <Link
                to="/explore"
                className="inline-block px-6 py-2.5 bg-primary hover:bg-primary-dark text-white text-sm font-semibold rounded-lg transition"
              >
                Start Exploring
              </Link>
            </motion.div>
          )}

          <div className="space-y-3">
            {papers.map((paper, i) => (
              <motion.div
                key={paper.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="group glass-card rounded-xl p-6 hover:border-primary/20 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold text-text-primary mb-1 group-hover:text-primary-light transition-colors">
                  {paper.title || "Untitled"}
                </h3>
                <p className="text-sm text-text-secondary mb-1">
                  {paper.authors}
                </p>
                <p className="text-xs text-text-muted mb-3">
                  {paper.year ? `Published: ${paper.year}` : "Year unknown"}
                </p>
                <p className="text-text-secondary text-sm mb-3 line-clamp-3 leading-relaxed">
                  {paper.abstract}
                </p>
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
          </div>
        </div>
      </main>
    </div>
  );
}
