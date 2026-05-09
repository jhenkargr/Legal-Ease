import React, { useState,useEffect,useCallback } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { 
  Scale, SlidersHorizontal, MapPin, Globe, Briefcase, Search, 
  ShieldCheck, Star, Phone, Clock, Mail, Link
} from 'lucide-react';


// Define the custom gold and blue colors for consistency
const primaryGold = 'text-yellow-600';
const buttonGold = 'bg-yellow-600 hover:bg-yellow-700';
const buttonDark = 'bg-slate-800 hover:bg-slate-700';
const buttonOutline = 'border-yellow-600 text-yellow-600 hover:bg-yellow-50';

// Mock data for dropdowns
const caseTypes = ['All Specialties', 'Personal Injury', 'Family Law', 'Real Estate', 'Criminal Defense', 'Corporate Law'];
const languages = ['Any Language', 'English', ' Hindi', ' Kannada', ' Tamil', ' Marathi'];



const FindLawyers = () => {
  const [caseType, setCaseType] = useState(caseTypes[0]);
  const [cityState, setCityState] = useState("");
  const [language, setLanguage] = useState(languages[0]);
  // State to control the view: 'landing' or 'results'
  const [view, setView] = useState('landing');
  
  // State to hold search results (can be filtered later)
  const [lawyerResults, setLawyerResults] = useState([]);

   const EXPRESS_API_URL = import.meta.env.VITE_EXPRESS_API_URL || "http://localhost:5000";

  // Handler for the main search button
  const handleSearch = () => {
    const params = new URLSearchParams();

if (caseType && caseType !== "All Specialties")
  params.append("specialization", caseType);

if (cityState && cityState !== "e.g., New York, NY")
  params.append("city", cityState.toLowerCase());

if (language && language !== "Any Language")
  params.append("language", language);

fetch(`${EXPRESS_API_URL}/lawyer/lawyers?${params.toString()}`)
  .then((res) => res.json())
  .then((data) => {
    if (!Array.isArray(data)) return;
    
    setLawyerResults(
      data.map((lawyer) => ({
        id: lawyer.lawyer_id,
        name: `${lawyer.first_name} ${lawyer.last_name}`,
        specialty: lawyer.specialization,
        location: `${lawyer.city}, ${lawyer.state}`,
        experience: lawyer.experience_years,
        rating: lawyer.rating || 0,
        reviews: Math.floor(Math.random() * 100),
        rate: `${lawyer.hourly_rate}/hr`,
        description: lawyer.bio,
        languages: lawyer.languages?.split(",") || [],
        phone: lawyer.phone,
        email: lawyer.email,
        website: lawyer.website_url,
      }))
    );

    setView("results");
  })
  .catch((err) => console.error("API Error:", err));



  };
  
  // Fetch lawyers from backend API


const handleCityStateChange = useCallback((value) => {
  setCityState(value)
}, [])




  // Custom Select Input Component
  const SelectFilter = ({ icon: Icon, label, value, onChange, options }) => (
    <div className="flex flex-col space-y-1 w-full">
      <label className="flex items-center text-sm text-gray-700 font-medium">
        <Icon size={14} className={`mr-2 ${primaryGold}`} />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm py-2 px-3 border transition duration-150 ease-in-out"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );

  
  // --- Lawyer Result Card Component ---
  const LawyerResultCard = ({ lawyer }) => {
    const renderStars = (rating) => {
      const fullStars = Math.floor(rating);
      const stars = [];
      for (let i = 0; i < 5; i++) {
        stars.push(
          <Star 
            key={i} 
            size={16} 
            fill={i < fullStars ? 'rgb(251 191 36)' : 'currentColor'} // yellow-400
            className={`mr-0.5 ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`} 
          />
        );
      }
      return <div className="flex items-center">{stars}</div>;
    };

    const handleContact = (name) => {
      // Replace with actual modal logic
      // Using console.log instead of alert
      console.log(`Contacting ${name}. A message form would open here.`);
    }

    const handleViewProfile = (name) => {
      // Replace with actual navigation logic
      // Using console.log instead of alert
      console.log(`Viewing profile for ${name}.`);
    }

    return (
      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-200 relative overflow-hidden">
        {/* Faded Scale Icon in the corner */}
        <Scale size={80} className={`${primaryGold} opacity-10 absolute right-[-20px] top-[-10px]`} />

        <div className="flex flex-col md:flex-row justify-between">
          {/* Left Column: Lawyer Details */}
          <div className="md:w-3/5 space-y-3 pr-4">
            <h2 className="text-xl font-bold text-gray-800">{lawyer.name}</h2>
            
            {/* Metadata (Specialty, Location, Experience) */}
            <div className="flex items-center flex-wrap text-sm text-gray-500 space-x-4">
              <span className="flex items-center">
                <Briefcase size={14} className="mr-1 text-gray-400" />
                {lawyer.specialty}
              </span>
              <span className="flex items-center">
                <MapPin size={14} className="mr-1 text-gray-400" />
                {lawyer.location}
              </span>
              <span className="flex items-center">
                <Clock size={14} className="mr-1 text-gray-400" />
                {lawyer.experience} years experience
              </span>
            </div>

            {/* Rating */}
            <div className="flex items-center space-x-2">
              {renderStars(lawyer.rating)}
              <span className="text-sm font-semibold text-gray-800">{lawyer.rating}</span>
              <span className="text-sm text-gray-500">({lawyer.reviews} reviews)</span>
            </div>

            <p className="text-gray-600 pt-2 pb-3">{lawyer.description}</p>
            
            {/* Languages */}
            <div className="flex space-x-2">
              {lawyer.languages.map(lang => (
                <span key={lang} className="text-xs bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full font-medium border border-yellow-200">
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Right Column: Rate & Contact */}
          <div className="md:w-2/5 flex flex-col pt-4 md:pt-0">
            <div className="flex justify-between items-start mb-4">
              <p className="text-lg font-bold text-yellow-600">{lawyer.rate}</p>
              <p className="text-base font-semibold text-gray-700 whitespace-nowrap">Contact Information</p>
            </div>
            
            <div className="space-y-2 mb-4 text-sm text-gray-600">
              <p className="flex items-center">
                <Phone size={14} className="mr-2 text-gray-500" />
                {lawyer.phone}
              </p>
              <p className="flex items-center">
                <Mail size={14} className="mr-2 text-gray-500" />
                {lawyer.email}
              </p>
              <p className="flex items-center">
                <Link size={14} className="mr-2 text-gray-500" />
                <a href={`http://${lawyer.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {lawyer.website}
                </a>
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => handleContact(lawyer.name)}
                className={`w-full py-2 text-white font-semibold rounded-lg shadow-sm transition duration-150 ease-in-out ${buttonDark}`}
              >
                Contact Lawyer
              </button>
              <button
                onClick={() => handleViewProfile(lawyer.name)}
                className={`w-full py-2 font-semibold rounded-lg border-2 transition duration-150 ease-in-out ${buttonOutline}`}
              >
                View Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Feature Card Component 
  const FeatureCard = ({ icon: Icon, title, description }) => (
    <div className="p-6 text-center flex flex-col items-center">
      <Icon size={30} className={`${primaryGold} mb-3`} />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
  );


  return (
    <div className="min-h-screen bg-gray-50 font-inter p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section (Always Visible, Adjusted for both views) */}
        <header className="text-center pt-8 pb-12">
          {/* Header Title and Subtitle for Landing Page */}
          
            <>
              <Scale size={36} className={`${primaryGold} mx-auto mb-3`} />
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
                Find Qualified Lawyers
              </h1>
              <p className="text-gray-500 max-w-lg mx-auto">
                Connect with experienced attorneys in your area who specialize in your legal needs
              </p>
            </>
          

          
        </header>

        {/* Search Filters Card (Always Visible) */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-200 mb-12">
          <div className="flex items-center text-gray-600 mb-6">
            <SlidersHorizontal size={18} className="mr-2" />
            <span className="font-semibold text-sm uppercase tracking-wider">Search Filters</span>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-end">
            
            {/* Case Type Filter */}
            <SelectFilter
              icon={Briefcase}
              label="Case Type"
              value={caseType}
              onChange={setCaseType}
              options={caseTypes}
            />

            {/* City/State Filter */}
            <TextInputFilter
              icon={MapPin}
              label="City/State"
              value={cityState}
              onChange={handleCityStateChange}
            />

            {/* Language Filter */}
            <SelectFilter
              icon={Globe}
              label="Language"
              value={language}
              onChange={setLanguage}
              options={languages}
            />
            
            {/* Search Button */}
            <button
              onClick={handleSearch}
              className={`w-full lg:w-auto h-[42px] px-6 py-2.5 text-white font-semibold rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center ${buttonGold} whitespace-nowrap`}
            >
              <Search size={18} className="mr-2" />
              Find Lawyers
            </button>
          </div>
        </div>

        {/* Conditional Content Block (This is the section that changes) */}
        {view === 'landing' ? (
          <>
            {/* Placeholder/Secondary CTA Card */}
            <div className="bg-white p-12 text-center rounded-xl shadow-lg border border-gray-200 mb-12">
              <Scale size={36} className={`${primaryGold} mx-auto mb-4 opacity-70`} />
              <h2 className="text-xl font-bold text-gray-700 mb-2">
                Find Your Legal Expert
              </h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">
                Use the search filters above to find qualified attorneys in your area
              </p>
              <button
                onClick={handleSearch}
                className={`px-8 py-3 text-white font-medium rounded-lg shadow-lg transition duration-300 ease-in-out ${buttonGold} flex items-center justify-center mx-auto`}
              >
                <Search size={18} className="mr-2" />
                Search All Lawyers
              </button>
            </div>

            
          </>
        ) : (
            <>
            {/* Header for Search Results (Only show results info if not landing) */}
            
            <div className="flex justify-between items-baseline mb-6 border-b pb-2 max-w-lg mx-auto md:max-w-none">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Search Results</h1>
              <p className="text-sm text-gray-500">{lawyerResults.length} lawyers found</p>
            </div>
          
          {/* Search Results Section */}
          <div className="space-y-6 pb-12">
            {lawyerResults.map(lawyer => (
              <LawyerResultCard key={lawyer.id} lawyer={lawyer} />
            ))}
          </div>
          </>
        )}

        {/* Feature Cards Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6 pb-12">
              <FeatureCard
                icon={ShieldCheck}
                title="Verified Professionals"
                description="All attorneys are licensed and verified by their respective bar associations."
              />
              <FeatureCard
                icon={Star}
                title="Client Reviews"
                description="Read authentic reviews from previous clients to make informed decisions."
              />
              <FeatureCard
                icon={Phone}
                title="Direct Contact"
                description="Connect directly with attorneys for consultations and case discussions."
              />
            </div>

      </div>
    </div>
  );
};

// Custom Text Input Component
  const TextInputFilter = ({ icon: Icon, label, value, onChange }) => (
    <div className="flex flex-col space-y-1 w-full">
      <label className="flex items-center text-sm text-gray-700 font-medium">
        <Icon size={14} className={`mr-2 ${primaryGold}`} />
        {label}
      </label>
      <input
      type="text"
      placeholder="City/State"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-yellow-500 focus:ring-yellow-500 text-sm py-2 px-3 border transition duration-150 ease-in-out"
    />

    </div>
  );
  

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />
      <main>
        <FindLawyers />
      </main>
      <Footer />
    </div>
  );
}
