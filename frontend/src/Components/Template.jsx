import React, { useState, useCallback, useMemo, useEffect } from 'react';
import templates from '../Templates'; // single import for all agreements

export default function App() {
  const [currentPage, setCurrentPage] = useState('list');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null); // moved here

  const template = templates.find(t => t.id === selectedTemplateId);
  const totalSteps = template ? template.steps.length : 0;
  const isFinalStep = currentStepIndex === totalSteps - 1;

  const showEditor = useCallback((id) => {
  const selected = templates.find(t => t.id === id);
  const initial = selected.steps.flatMap(s => s.fields)
    .reduce((acc, f) => ({ ...acc, [f.id]: f.default }), {});

  // Generate initial PDF immediately
  let initialPdfUrl = null;
  if (selected?.generatePDF) {
    const pdf = selected.generatePDF(initial);
    const blob = pdf.output('blob');
    initialPdfUrl = URL.createObjectURL(blob);
  }

  setFormData(initial);
  setSelectedTemplateId(id);
  setCurrentStepIndex(0);
  setPdfPreviewUrl(initialPdfUrl); // 👈 show initial preview
  setCurrentPage('editor');
}, []);


  const handleInputChange = useCallback((id, value) => {
    // 👇 update only the changed field
    setFormData(prev => {
      if (prev[id] === value) return prev; // skip if unchanged
      return { ...prev, [id]: value };
    });
  }, []);

  const navigateStep = useCallback((dir) => {
    if (!template) return;
    if (dir === 'next' && currentStepIndex < totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else if (dir === 'prev' && currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  }, [template, currentStepIndex, totalSteps]);

  // 🧩 Memoized TemplateEditor (so input fields don't re-render unnecessarily)
  const TemplateEditor = useMemo(() => {
    if (!template) return null;

    const step = template.steps?.[currentStepIndex];
    if (!step) return <div>Loading...</div>;

     

    const updatePreview = () => {
      if (!template?.generatePDF) return;
      const pdf = template.generatePDF(formData);
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return blobUrl;
      });
    };

    const handleNext = () => {
      updatePreview(); // only when Next clicked
      navigateStep('next');
    };

   
 

    return (
      <div className="flex flex-col lg:flex-row gap-6 min-h-screen">
        {/* Left side - Form */}
        <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold text-indigo-600 mb-4 text-center">
              {template.name}
            </h2>

            {/* Step indicator */}
            <div className="flex justify-center items-center mb-6 overflow-x-auto flex-nowrap py-2">
  {template.steps.map((s, i) => (
    <div key={i} className="flex items-center">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
          ${i === currentStepIndex
            ? 'bg-indigo-600 text-white'
            : i < currentStepIndex
            ? 'bg-green-500 text-white'
            : 'bg-gray-300 text-gray-700'
        }`}
      >
        {i + 1}
      </div>
      {i < totalSteps - 1 && (
        <div
          className="w-8 h-1 mx-1 rounded-full transition-all duration-300 bg-gray-300"
          style={{
            background: i < currentStepIndex ? '#22c55e' : '#d1d5db',
          }}
        ></div>
      )}
    </div>
  ))}
</div>


            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              Step {currentStepIndex + 1} of {totalSteps}: {step.title}
            </h3>

            {/* Form Fields */}
            {step.fields.map((f) => (
              <div key={f.id} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {f.label}
                </label>
                <input
                  id={f.id}
                  type={f.type}
                  value={formData[f.id] || ''}
                  min={f.min}
                  max={f.max}
                  onChange={(e) => handleInputChange(f.id, e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={() => navigateStep('prev')}
              disabled={currentStepIndex === 0}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
            >
              ← Back
            </button>

            {isFinalStep ? (
              <button
                onClick={() => {
                  const pdf = template.generatePDF(formData);
                  pdf.save(`${template.name.replace(/\s+/g, '_')}.pdf`);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-bold px-4 py-2 rounded-lg"
              >
                Export PDF
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg"
              >
                Next →
              </button>
            )}
          </div>
        </div>

        {/* Right side - PDF Preview */}
        <div className="lg:w-2/3 bg-white p-6 rounded-xl shadow-lg overflow-y-auto">
          <h3 className="text-lg font-semibold text-gray-700 mb-4 text-center">
            Live PDF Preview
          </h3>

          {pdfPreviewUrl ? (
            <iframe
              src={pdfPreviewUrl}
              title="PDF Preview"
              className="w-full h-[80vh] border rounded-lg"
            ></iframe>
          ) : (
            <div className="text-gray-500 text-center py-20">
              Fill out the form and click “Next” to preview your document
            </div>
          )}
        </div>
      </div>
    );
  }, [template, formData, currentStepIndex]); // Memoize

  // Template list
  const TemplateList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {templates.map(t => (
        <div
          key={t.id}
          onClick={() => showEditor(t.id)}
          className="bg-white p-6 rounded-xl shadow hover:shadow-lg cursor-pointer border hover:border-indigo-500"
        >
          <h3 className="text-xl font-bold text-gray-800">{t.name}</h3>
          <p className="text-gray-500 mt-2">{t.description}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-indigo-700">
          Legal Document Templates
        </h1>
        {currentPage === 'editor' && (
          <button
            onClick={() => setCurrentPage('list')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-4 py-2 rounded-lg"
          >
            ← Back to Templates
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        {currentPage === 'list' ? <TemplateList /> : TemplateEditor}
      </div>
    </div>
  );
}
