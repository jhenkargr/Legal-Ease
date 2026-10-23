import React from "react";
import { useNavigate } from "react-router-dom";
import { Scale, Wrench, FileText, UserCheck, FileDown, Users, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import Footer from "./Footer";

const featureCards = [
  {
    title: "Document Simplifier",
    icon: FileText,
    desc: "Transform convoluted legal documents and agreements into clear, plain English summaries with risk warnings.",
    to: "/simplifier",
  },
  {
    title: "Know Your Rights",
    icon: UserCheck,
    desc: "Get instant, authoritative answers to your tenancy and civil rights questions powered by legal RAG AI.",
    to: "/rights",
  },
  {
    title: "Legal Templates",
    icon: FileDown,
    desc: "Access and customize standardized legal documents (NDAs, rental deeds, contracts) instantly.",
    to: "/templates",
  },
  {
    title: "Find Lawyers",
    icon: Users,
    desc: "Connect with verified, licensed legal practitioners categorized by domain, city, and jurisdiction.",
    to: "/lawyers",
  },
];

const securityFeatures = [
  { title: "End-to-End Encryption", icon: Lock },
  { title: "Professional Standards", icon: ShieldCheck },
  { title: "Licensed Attorney Network", icon: Users },
];

// --- Hero Section ---
const Hero = () => {
  const navigate = useNavigate();

  return (
    <section id="home" className="relative pt-20 pb-28 bg-gray-50 text-center overflow-hidden">
      {/* Decorative Background - Non-blocking pointer events */}
      <div className="absolute inset-0 opacity-10 flex justify-center items-center pointer-events-none select-none">
        <Scale className="w-1/2 h-full text-indigo-300 pointer-events-none" />
      </div>

      <div className="relative max-w-4xl mx-auto px-6 z-10">
        <div className="flex justify-center space-x-4 mb-6">
          <div className="p-3 bg-yellow-50 rounded-2xl border border-yellow-100 shadow-sm">
            <Scale className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm">
            <Wrench className="w-8 h-8 text-indigo-600" />
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-6 tracking-tight">
          Your Rights, <span className="text-indigo-600">Simplified.</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Navigate complex legal instruments with confidence. Our AI-driven assistant demystifies agreements, detects onerous clauses, and provides grounded legal answers.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button
            type="button"
            id="hero-start-chat-btn"
            onClick={() => navigate("/rights")}
            className="px-8 py-4 rounded-full text-white bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            Start Legal Chat <ArrowRight className="w-5 h-5" />
          </button>
          <button
            type="button"
            id="hero-simplify-doc-btn"
            onClick={() => navigate("/simplifier")}
            className="px-8 py-4 rounded-full border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 font-semibold transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2 bg-white"
          >
            Simplify Document
          </button>
        </div>
      </div>
    </section>
  );
};

// --- Features Section ---
const FeaturesSection = () => {
  const navigate = useNavigate();

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">Powerful Legal Tools</h2>
        <p className="text-xl text-gray-600 mb-14 max-w-3xl mx-auto">
          Everything you need to analyze contracts, verify rights, and connect with legal experts
        </p>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {featureCards.map((card) => (
            <div
              key={card.title}
              onClick={() => navigate(card.to)}
              className="p-8 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 bg-white hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-2 cursor-pointer flex flex-col justify-between text-left group"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  navigate(card.to);
                }
              }}
            >
              <div>
                <div className="p-3.5 mb-5 inline-flex rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200 shadow-sm">
                  <card.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">{card.desc}</p>
              </div>
              <div className="mt-8 pt-4 border-t border-gray-100 flex items-center text-sm font-semibold text-indigo-600 group-hover:text-indigo-700">
                Explore Tool <ArrowRight className="w-4 h-4 ml-1.5 transform group-hover:translate-x-1.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Security Section ---
const SecuritySection = () => (
  <section className="py-20 bg-gray-50 border-t border-gray-200 text-center">
    <div className="max-w-4xl mx-auto px-6">
      <div className="w-14 h-14 bg-yellow-100 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm">
        <Scale className="w-8 h-8 text-yellow-700" />
      </div>
      <h2 className="text-3xl font-extrabold text-gray-900 mb-4 tracking-tight">Trusted, Secure & Compliant</h2>
      <p className="text-lg text-gray-600 mb-10 leading-relaxed">
        Your legal instruments and questions are handled through stateless, client-side processing and zero-leak vector pipelines. Always consult licensed counsel for formal representation.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
        {securityFeatures.map((f) => (
          <div key={f.title} className="flex items-center gap-2.5 text-gray-700 font-medium">
            <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
              <f.icon className="w-5 h-5" />
            </div>
            <span>{f.title}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <main>
        <Hero />
        <FeaturesSection />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  );
}
