import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";

export default function Library() {
  const { user } = useAuth();
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");

  // Load user's saved papers
  useEffect(() => {
    if (!user) return;

    const loadSavedPapers = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch saved papers with paper details
        const { data, error: fetchError } = await supabase
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
          .order("saved_at", { ascending: false });

        if (fetchError) throw fetchError;

        // Map the nested data structure
        const papersWithDetails = data
          ?.map((item) => ({
            ...item.papers,
            savedNotes: item.notes,
          }))
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

  // Filter papers based on search query
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

  const removePaper = async (paperId) => {
    try {
      const { error } = await supabase
        .from("saved_papers")
        .delete()
        .eq("user_id", user.id)
        .eq("paper_id", paperId);

      if (error) throw error;

      // Remove from local state
      setPapers((prev) => prev.filter((p) => p.id !== paperId));
    } catch (err) {
      console.error("Error removing paper:", err);
      setError("Failed to remove paper");
    }
  };

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Research Library
          </h1>
          <p className="text-xl text-gray-400">
            Your collection of saved papers and research
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search papers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading papers...</p>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">
              {papers.length === 0
                ? "No papers saved yet"
                : "No papers match your search"}
            </p>
            <p className="text-gray-500">
              {papers.length === 0
                ? "Start by exploring and saving research papers to your library"
                : "Try a different search query"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPapers.map((paper) => (
              <div
                key={paper.id}
                className="bg-gray-900 border border-gray-800 rounded-lg p-6 hover:border-gray-700 transition"
              >
                <div className="flex justify-between items-start gap-4 mb-3">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white mb-1">
                      {paper.title || "Untitled"}
                    </h2>
                    <p className="text-sm text-gray-400 mb-1">
                      {getAuthors(paper.authors)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {paper.year ? `Published: ${paper.year}` : "Year unknown"}
                    </p>
                  </div>
                  <button
                    onClick={() => removePaper(paper.id)}
                    className="px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700"
                  >
                    Remove
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
        )}
      </main>
    </div>
  );
}
