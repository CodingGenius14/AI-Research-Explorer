import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const { user } = useAuth();

  // If user is authenticated, redirect to home
  if (user) {
    return <Navigate to="/home" replace />;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center px-6 max-w-2xl">
        <h1 className="text-6xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-linear-to-r from-blue-500 to-purple-500">
          AI Research Explorer
        </h1>
        <p className="text-xl text-gray-400 mb-8">
          Discover, organize, and explore the latest in artificial intelligence
          research.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/login"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-semibold rounded-lg transition border border-gray-700"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
