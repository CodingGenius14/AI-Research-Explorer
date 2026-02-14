import React from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Home() {
  const { user } = useAuth();

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Stats Cards */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Total Papers</p>
            <p className="text-3xl font-bold text-blue-500">0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Bookmarked</p>
            <p className="text-3xl font-bold text-purple-500">0</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Read</p>
            <p className="text-3xl font-bold text-green-500">0</p>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            Recent Activity
          </h2>
          <p className="text-gray-400">
            No activity yet. Start exploring AI research papers to build your
            collection.
          </p>
        </div>
      </main>
    </div>
  );
}
