import React from "react";
import { Link } from "react-router-dom";
import { Scale, Mic } from "lucide-react";

const navLinks = [
  { name: "Home", to: "/" },
  { name: "Simplify Docs", to: "/simplifier" },  // ✅ fixed route
  { name: "Know Your Rights", to: "/rights" },
  { name: "Templates", to: "/templates" },
  { name: "Find Lawyers", to: "/lawyers" },
];

const Navbar = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Scale className="w-7 h-7 text-indigo-700" />
          <span className="text-2xl font-bold text-gray-800">LegalEase</span>
        </div>

        {/* Desktop Nav + Button (Right aligned) */}
        <div className="hidden lg:flex items-center space-x-6">
          <nav className="flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className="text-sm font-medium text-gray-600 hover:text-indigo-700 flex items-center p-2 rounded-lg hover:bg-indigo-50 transition-all"
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Action Button (Voice Demo Placeholder) */}
          <button
            onClick={() => alert("Voice demo coming soon 🎤")}
            className="inline-flex items-center px-4 py-2 rounded-full shadow-md text-white bg-indigo-700 hover:bg-indigo-800 transition-all"
          >
            <Mic className="w-4 h-4 mr-2" />
            Voice Demo
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;