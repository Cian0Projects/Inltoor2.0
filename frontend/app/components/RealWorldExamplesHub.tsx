'use client';

import { useState } from 'react';
import { ChevronDown, BookOpen, Lightbulb, AlertCircle, CheckCircle, Building2, ArrowLeft } from 'lucide-react';
import { realWorldExamples, getCaseStudiesByType, type CaseStudy } from '@/app/data/realWorldExamples';
import BeamVisualizer from './BeamVisualizer';

export default function RealWorldExamplesHub() {
  const [selectedCaseStudy, setSelectedCaseStudy] = useState<CaseStudy | null>(realWorldExamples[0]);
  const [mode, setMode] = useState<'gallery' | 'challenge' | 'analysis'>('gallery');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const simplySupportedExamples = getCaseStudiesByType('simply_supported');
  const cantileverExamples = getCaseStudiesByType('cantilever');

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 shadow-lg border-b border-purple-500">
        <div className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={32} className="text-purple-200" />
            <div>
              <h1 className="text-4xl font-bold text-white">Learning Hub</h1>
              <p className="text-purple-100">Explore real-world beam applications and design challenges</p>
            </div>
          </div>
          <a
            href="/"
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 hover:scale-105"
          >
            <ArrowLeft size={20} />
            Back to Calculator
          </a>
        </div>
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 py-8">
        {/* Mode Selection */}
        <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
          <h2 className="text-lg font-bold text-white mb-4">Select Learning Mode</h2>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setMode('gallery')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                mode === 'gallery'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg'
                  : 'bg-slate-700 text-gray-200 hover:bg-slate-600 border border-slate-600'
              }`}
            >
              📸 Browse Examples
            </button>
            <button
              onClick={() => setMode('challenge')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                mode === 'challenge'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                  : 'bg-slate-700 text-gray-200 hover:bg-slate-600 border border-slate-600'
              }`}
            >
              🎯 Load Identification Challenge
            </button>
            <button
              onClick={() => setMode('analysis')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                mode === 'analysis'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                  : 'bg-slate-700 text-gray-200 hover:bg-slate-600 border border-slate-600'
              }`}
            >
              📊 Detailed Analysis
            </button>
          </div>
        </div>

        {/* Gallery Mode */}
        {mode === 'gallery' && (
          <div className="space-y-8">
            {/* Case Study Selection */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Select a Real-World Structure</h2>
              
              {/* Simply Supported Section */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-green-400 mb-3 flex items-center gap-2">
                  <Building2 size={20} />
                  Simply Supported Beams
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {simplySupportedExamples.map(example => (
                    <button
                      key={example.id}
                      onClick={() => setSelectedCaseStudy(example)}
                      className={`p-4 rounded-lg text-left transition-all duration-200 border-2 ${
                        selectedCaseStudy?.id === example.id
                          ? 'border-green-500 bg-green-500/20 shadow-lg'
                          : 'border-slate-600 bg-slate-700/40 hover:border-green-500/50'
                      }`}
                    >
                      <p className="font-semibold text-white">{example.title}</p>
                      <p className="text-sm text-gray-400">{example.specs.span}m span • {example.specs.material}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cantilever Section */}
              <div>
                <h3 className="text-lg font-semibold text-indigo-400 mb-3 flex items-center gap-2">
                  <Building2 size={20} />
                  Cantilever Beams
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {cantileverExamples.map(example => (
                    <button
                      key={example.id}
                      onClick={() => setSelectedCaseStudy(example)}
                      className={`p-4 rounded-lg text-left transition-all duration-200 border-2 ${
                        selectedCaseStudy?.id === example.id
                          ? 'border-indigo-500 bg-indigo-500/20 shadow-lg'
                          : 'border-slate-600 bg-slate-700/40 hover:border-indigo-500/50'
                      }`}
                    >
                      <p className="font-semibold text-white">{example.title}</p>
                      <p className="text-sm text-gray-400">{example.specs.span}m span • {example.specs.material}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Case Study Display */}
            {selectedCaseStudy && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-purple-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
                <h2 className="text-2xl font-bold text-white mb-4">{selectedCaseStudy.title}</h2>

                {/* Image */}
                <div className="mb-6 rounded-lg overflow-hidden border border-slate-700">
                  <img
                    src={selectedCaseStudy.imagePath}
                    alt={selectedCaseStudy.title}
                    className="w-full h-96 object-cover bg-slate-700"
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.backgroundColor = '#475569';
                      target.style.display = 'flex';
                      target.style.alignItems = 'center';
                      target.style.justifyContent = 'center';
                      target.style.color = '#cbd5e1';
                      target.style.fontSize = '16px';
                      target.textContent = '📷 Image not loaded - Please add image to /public/examples/';
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mb-6">{selectedCaseStudy.imageAttribution}</p>

                {/* Visualizations - Beam Diagram, SFD, BMD */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-white mb-4">Analysis Visualizations</h3>
                  <BeamVisualizer caseStudy={selectedCaseStudy} />
                </div>

                {/* Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-700/40 p-4 rounded-lg border border-blue-400/20">
                    <p className="text-sm text-gray-400">Material</p>
                    <p className="text-lg font-semibold text-blue-300">{selectedCaseStudy.specs.material}</p>
                  </div>
                  <div className="bg-slate-700/40 p-4 rounded-lg border border-blue-400/20">
                    <p className="text-sm text-gray-400">Span</p>
                    <p className="text-lg font-semibold text-blue-300">{selectedCaseStudy.specs.span} meters</p>
                  </div>
                  <div className="bg-slate-700/40 p-4 rounded-lg border border-blue-400/20">
                    <p className="text-sm text-gray-400">Purpose</p>
                    <p className="text-lg font-semibold text-blue-300">{selectedCaseStudy.specs.mainPurpose}</p>
                  </div>
                </div>

                {/* Expandable sections */}
                <div className="space-y-3">
                  {/* Description */}
                  <div className="bg-slate-700/40 rounded-lg border border-blue-400/20 overflow-hidden">
                    <button
                      onClick={() => toggleSection('description')}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/60 transition-colors"
                    >
                      <span className="font-semibold text-white">About This Structure</span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-400 transition-transform ${
                          expandedSections.has('description') ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSections.has('description') && (
                      <div className="px-4 pb-4 border-t border-slate-600 text-gray-300 space-y-2">
                        <p>{selectedCaseStudy.description}</p>
                        <p className="text-sm italic text-blue-300">{selectedCaseStudy.realWorldContext}</p>
                      </div>
                    )}
                  </div>

                  {/* Design Considerations */}
                  <div className="bg-slate-700/40 rounded-lg border border-yellow-400/20 overflow-hidden">
                    <button
                      onClick={() => toggleSection('design')}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/60 transition-colors"
                    >
                      <span className="font-semibold text-white flex items-center gap-2">
                        <AlertCircle size={18} className="text-yellow-400" />
                        Design Considerations
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-400 transition-transform ${
                          expandedSections.has('design') ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSections.has('design') && (
                      <div className="px-4 pb-4 border-t border-slate-600">
                        <ul className="space-y-2">
                          {selectedCaseStudy.designConsiderations.map((consideration, i) => (
                            <li key={i} className="flex gap-2 text-gray-300">
                              <span className="text-yellow-400 font-bold">•</span>
                              <span>{consideration}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Interesting Fact */}
                  <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-lg border border-purple-500/30 overflow-hidden">
                    <button
                      onClick={() => toggleSection('fact')}
                      className="w-full p-4 flex items-center justify-between hover:bg-purple-900/50 transition-colors"
                    >
                      <span className="font-semibold text-white flex items-center gap-2">
                        <Lightbulb size={18} className="text-purple-300" />
                        Did You Know?
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-400 transition-transform ${
                          expandedSections.has('fact') ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSections.has('fact') && (
                      <div className="px-4 pb-4 border-t border-purple-600 text-gray-300">
                        <p>{selectedCaseStudy.interestingFact}</p>
                      </div>
                    )}
                  </div>

                  {/* Maintenance */}
                  <div className="bg-slate-700/40 rounded-lg border border-blue-400/20 overflow-hidden">
                    <button
                      onClick={() => toggleSection('maintenance')}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/60 transition-colors"
                    >
                      <span className="font-semibold text-white">Maintenance & Inspection</span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-400 transition-transform ${
                          expandedSections.has('maintenance') ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSections.has('maintenance') && (
                      <div className="px-4 pb-4 border-t border-slate-600 text-gray-300">
                        <p>{selectedCaseStudy.maintenanceNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Expected Results */}
                  <div className="bg-green-900/20 rounded-lg border border-green-500/30 overflow-hidden">
                    <button
                      onClick={() => toggleSection('results')}
                      className="w-full p-4 flex items-center justify-between hover:bg-green-900/40 transition-colors"
                    >
                      <span className="font-semibold text-white flex items-center gap-2">
                        <CheckCircle size={18} className="text-green-400" />
                        Calculated Results
                      </span>
                      <ChevronDown
                        size={20}
                        className={`text-gray-400 transition-transform ${
                          expandedSections.has('results') ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    {expandedSections.has('results') && (
                      <div className="px-4 pb-4 border-t border-green-600 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <p className="text-sm text-gray-400">Max Shear Force</p>
                            <p className="text-xl font-bold text-green-300">
                              {selectedCaseStudy.expectedResults.maxShear.toFixed(1)} kN
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Max Moment</p>
                            <p className="text-xl font-bold text-green-300">
                              {selectedCaseStudy.expectedResults.maxMoment.toFixed(1)} kNm
                            </p>
                          </div>
                          {selectedCaseStudy.expectedResults.maxDeflection && (
                            <div>
                              <p className="text-sm text-gray-400">Max Deflection</p>
                              <p className="text-xl font-bold text-green-300">
                                {(selectedCaseStudy.expectedResults.maxDeflection * 1000).toFixed(0)} mm
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Challenge Mode */}
        {mode === 'challenge' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">🎯 Load Identification Challenge</h2>
            <p className="text-gray-300 mb-6">
              This feature allows you to analyse real structures and identify the loads acting on them, then see how your
              estimates compare to the actual engineering calculations.
            </p>
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30 rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-4">Coming Soon!</p>
              <p className="text-sm text-gray-500">
                This interactive challenge mode will let you:
              </p>
              <ul className="text-sm text-gray-500 mt-4 space-y-2 text-left inline-block">
                <li>✓ View a real structure image</li>
                <li>✓ Identify point loads and distributed loads</li>
                <li>✓ Input load values into the bean calculator</li>
                <li>✓ Compare your results to actual engineering data</li>
                <li>✓ Learn why loads are distributed the way they are</li>
              </ul>
            </div>
          </div>
        )}

        {/* Analysis Mode */}
        {mode === 'analysis' && (
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-green-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-4">📊 Detailed Analysis Mode</h2>
            <p className="text-gray-300 mb-6">
              This mode provides in-depth technical analysis of real structures with complete load breakdowns and engineering
              explanations.
            </p>
            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-400/30 rounded-lg p-6 text-center">
              <p className="text-gray-400 mb-4">Coming Soon!</p>
              <p className="text-sm text-gray-500">
                This comprehensive analysis mode will include:
              </p>
              <ul className="text-sm text-gray-500 mt-4 space-y-2 text-left inline-block">
                <li>✓ Detailed SFD and BMD diagrams from real data</li>
                <li>✓ Load source identification and calculation</li>
                <li>✓ Material property explanations</li>
                <li>✓ Building code requirements and safety factors</li>
                <li>✓ Failure mode discussions</li>
                <li>✓ Historical context and lessons learned</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
