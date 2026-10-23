import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Scale, Mic, Menu, X } from "lucide-react";

const navLinks = [
  { name: "Home", to: "/" },
  { name: "Simplify Docs", to: "/simplifier" },
  { name: "Know Your Rights", to: "/rights" },
  { name: "Templates", to: "/templates" },
  { name: "Find Lawyers", to: "/lawyers" },
];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center h-20">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2.5 cursor-pointer group">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md group-hover:bg-indigo-700 transition-colors">
            <Scale className="w-6 h-6" />
          </div>
          <span className="text-2xl font-extrabold text-gray-900 tracking-tight">LegalEase</span>
        </Link>

        {/* Desktop Nav + Action */}
        <div className="hidden md:flex items-center space-x-6">
          <nav className="flex space-x-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.name}
                  to={link.to}
                  className={`text-sm font-semibold px-3.5 py-2 rounded-lg transition-all ${
                    isActive
                      ? "text-indigo-600 bg-indigo-50"
                      : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* Action Button: Navigate to Rights Voice Assistant */}
          <button
            onClick={() => navigate("/rights")}
            className="inline-flex items-center px-4 py-2 rounded-full shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            <Mic className="w-4 h-4 mr-2" />
            AI Assistant
          </button>
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-6 pt-2 pb-5 space-y-2 shadow-xl animate-in slide-in-from-top duration-200">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.name}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-base font-semibold px-4 py-2.5 rounded-lg transition-all ${
                  isActive
                    ? "text-indigo-600 bg-indigo-50"
                    : "text-gray-700 hover:text-indigo-600 hover:bg-gray-50"
                }`}
              >
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate("/rights");
              }}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-xl shadow-sm text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4 mr-2" />
              AI Assistant
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;