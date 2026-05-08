

import React from "react";
import { Scale, Wrench, FileText, UserCheck, FileDown, Users, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";

const featureCards = [
  { title: "Document Simplifier", icon: FileText, desc: "Transform complex legal documents into plain English." },
  { title: "Know Your Rights", icon: UserCheck, desc: "Get instant answers to your legal questions." },
  { title: "Legal Templates", icon: FileDown, desc: "Generate custom legal documents instantly." },
  { title: "Find Lawyers", icon: Users, desc: "Connect with qualified legal professionals." },
];

const securityFeatures = [
  { title: "End-to-end Encryption", icon: Lock },
  { title: "Professional Standards", icon: ShieldCheck },
  { title: "Licensed Attorney Network", icon: Users },
];

// --- Hero Section ---
const Hero = () => (
  <section id="home" className="relative pt-32 pb-32 bg-gray-50 text-center">
    <div className="absolute inset-0 opacity-10 flex justify-center items-center">
      <Scale className="w-1/2 h-full text-indigo-300" />
    </div>

    <div className="relative max-w-4xl mx-auto px-6">
      <div className="flex justify-center space-x-4 mb-6">
        <Scale className="w-10 h-10 text-yellow-600" />
        <Wrench className="w-10 h-10 text-gray-600" />
      </div>

      <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
        Your Rights, Simplified.
      </h1>
      <p className="text-xl text-gray-600 mb-10">
        Navigate the legal world with confidence. Our AI-powered assistant makes complex legal matters accessible to everyone.
      </p>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <button className="px-8 py-3 rounded-full text-white bg-indigo-700 hover:bg-indigo-800">
          Start Legal Chat
        </button>
        <button className="px-8 py-3 rounded-full border border-indigo-700 text-indigo-700 hover:bg-indigo-50">
          Simplify Document
        </button>
      </div>
    </div>
  </section>
);

// --- Features Section ---
const FeaturesSection = () => (
  <section className="py-20 bg-white">
    <div className="max-w-7xl mx-auto px-6 text-center">
      <h2 className="text-4xl font-extrabold mb-2">Powerful Legal Tools</h2>
      <p className="text-xl text-gray-600 mb-12">
        Everything you need to understand and navigate legal matters with confidence
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {featureCards.map((card) => (
          <div key={card.title} className="p-6 rounded-xl shadow-lg hover:shadow-2xl border">
            <div className="p-3 mb-4 inline-flex rounded-full bg-indigo-50 text-indigo-600">
              <card.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold">{card.title}</h3>
            <p className="text-gray-600">{card.desc}</p>
            <a href="#" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-800">
              Explore <ArrowRight className="w-4 h-4 ml-1" />
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// --- Security Section ---
const SecuritySection = () => (
  <section className="py-20 bg-gray-50 border-t text-center">
    <Scale className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
    <h2 className="text-3xl font-bold mb-4">Trusted & Secure</h2>
    <p className="text-lg text-gray-600 mb-10 max-w-3xl mx-auto">
      Your legal information is protected with enterprise-grade security. Our AI provides guidance, but always consult with qualified attorneys for legal advice.
    </p>
    <div className="flex flex-col sm:flex-row justify-center gap-6">
      {securityFeatures.map((f) => (
        <div key={f.title} className="flex items-center gap-2 text-gray-700">
          <f.icon className="w-5 h-5 text-indigo-600" />
          <span>{f.title}</span>
        </div>
      ))}
    </div>
  </section>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <main>
        <Hero />
        <FeaturesSection />
        <SecuritySection />
      </main>
      <Footer />
    </div>
  );
}
