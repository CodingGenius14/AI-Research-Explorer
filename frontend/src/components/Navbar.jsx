import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link to="/home" className="font-bold text-xl text-blue-500">
              AI Research
            </Link>
            <div className="hidden md:flex gap-6">
              <Link
                to="/home"
                className="text-gray-300 hover:text-blue-500 transition"
              >
                Home
              </Link>
              <Link
                to="/explore"
                className="text-gray-300 hover:text-blue-500 transition"
              >
                Explore
              </Link>
              <Link
                to="/library"
                className="text-gray-300 hover:text-blue-500 transition"
              >
                Library
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
