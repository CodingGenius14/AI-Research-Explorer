import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function Home() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(true);
  const [recsMessage, setRecsMessage] = useState("");

  // Load saved papers
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError("");
    supabase
      .from("saved_papers")
      .select(
        `
        paper_id,
        notes,
        papers (
          id,
          title,
          abstract,
          authors,
          url,
          year
        )
      `,
      )
      .eq("user_id", user.id)
      .order("saved_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) throw error;
        const papersWithDetails = data
          ?.map((item) => ({
            ...item.papers,
            savedNotes: item.notes,
          }))
          .filter((paper) => paper && paper.id);
        setPapers(papersWithDetails || []);
      })
      .catch((err) => {
        setError("Failed to load your saved papers");
        setPapers([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Load recommendations
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
        } else if (data.detail) {
          setRecsMessage("Unable to load recommendations right now.");
        }
      })
      .catch(() => {
        setRecsMessage("Unable to load recommendations right now.");
      })
      .finally(() => setRecsLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Welcome, {user?.email?.split("@")[0]}
          </h1>
          <p className="text-xl text-gray-400">
            Explore and manage your AI research collection
          </p>
        </div>

        {/* Recommendations Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Recommended For You
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Based on your saved papers
              </p>
            </div>
            {recommendations.length > 0 && (
              <Link
                to="/explore"
                className="text-sm text-blue-500 hover:text-blue-400 transition"
              >
                Discover more →
              </Link>
            )}
          </div>

          {recsLoading && (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-400 text-sm">
                Generating recommendations...
              </p>
            </div>
          )}

          {!recsLoading && recsMessage && (
            <div className="bg-linear-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/40 rounded-xl p-8 text-center">
              <div className="text-4xl mb-3">🔬</div>
              <p className="text-gray-300 text-lg mb-2">{recsMessage}</p>
              <Link
                to="/explore"
                className="inline-block mt-3 px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition"
              >
                Explore Papers
              </Link>
            </div>
          )}

          {!recsLoading && recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendations.map((paper, index) => (
                <div
                  key={paper.id || index}
                  className="group bg-linear-to-br from-gray-900 to-gray-900 border border-gray-800 rounded-xl p-5 hover:border-purple-700/50 hover:shadow-lg hover:shadow-purple-900/10 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
                      {paper.title || "Untitled"}
                    </h3>
                    {paper.similarity != null && (
                      <span className="shrink-0 text-xs font-medium bg-purple-900/40 text-purple-300 border border-purple-800/50 px-2 py-0.5 rounded-full">
                        {Math.round(paper.similarity * 100)}% match
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs mb-3 line-clamp-3">
                    {paper.abstract || "No abstract available."}
                  </p>
                  <a
                    href={`https://arxiv.org/abs/${paper.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-purple-400 hover:text-purple-300 text-xs font-medium transition"
                  >
                    View Paper →
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Papers Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Your Saved Papers
          </h2>
          {loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading your papers...</p>
            </div>
          )}
          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {!loading && papers.length === 0 && !error && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 text-center">
              <p className="text-gray-400 text-lg mb-2">No papers saved yet</p>
              <p className="text-gray-500">
                Start by exploring and saving research papers to your library
              </p>
            </div>
          )}
          <div className="grid gap-4">
            {papers.map((paper) => (
              <div
                key={paper.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
              >
                <h3 className="text-lg font-semibold text-white mb-1">
                  {paper.title || "Untitled"}
                </h3>
                <p className="text-sm text-gray-400 mb-1">{paper.authors}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {paper.year ? `Published: ${paper.year}` : "Year unknown"}
                </p>
                <p className="text-gray-300 text-sm mb-2 line-clamp-3">
                  {paper.abstract}
                </p>
                <a
                  href={paper.url || "https://arxiv.org/"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-blue-500 hover:text-blue-400 text-sm underline"
                >
                  View Paper →
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
