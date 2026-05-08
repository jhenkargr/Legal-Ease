import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./Components/Navbar";
import Footer from "./Components/Footer";
import Home from "./Components/Home";
import MessageBubble from "./Components/MessageBubble"; 
import Message from "./Components/Meaasage";
import DocumentSimple from "./Components/DocumentSimple"; // Simplify Documents page
import Template from "./Components/Template";
import FindLawyers from "./Components/Lawyer";


import "./App.css";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="pt-20"> {/* prevents content from hiding behind fixed Navbar */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rights" element={<Message />} />
          <Route path="/simplifier" element={<DocumentSimple />} />
          <Route path="/templates" element={<Template />} />
          <Route path="/lawyers" element={<FindLawyers />} />
        
          {/* You can add more routes later like: */}
          {/* <Route path="/simplify" element={<SimplifyDocs />} /> */}
          {/* <Route path="/templates" element={<Templates />} /> */}
          {/* <Route path="/lawyers" element={<FindLawyers />} /> */}
        </Routes>
      </div>
      
    </Router>
  );
}

export default App;
