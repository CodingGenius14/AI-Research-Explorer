import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function Home() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
