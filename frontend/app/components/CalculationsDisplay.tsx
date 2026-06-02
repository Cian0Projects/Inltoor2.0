'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface LoadStep {
  load_number: number;
  load_type: string;
  magnitude: number;
  position?: number;
  start_pos?: number;
  end_pos?: number;
  steps: string[];
}

interface Calculations {
  load_steps: LoadStep[];
  summary_steps: string[];
}

interface CalculationsDisplayProps {
  calculations: Calculations | undefined;
}

export default function CalculationsDisplay({ calculations }: CalculationsDisplayProps) {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  if (!calculations) {
    return null;
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="mt-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-yellow-500/20 backdrop-blur-md rounded-xl p-6 shadow-xl">
      <h3 className="text-lg font-bold text-yellow-300 mb-6 flex items-center gap-2">
        <span className="text-2xl">📚</span>
        Step-by-Step Calculations
      </h3>

      {/* Load-specific calculations */}
      {calculations.load_steps.map((load, idx) => (
        <div key={`load-${idx}`} className="mb-4">
          <button
            onClick={() => toggleSection(`load-${idx}`)}
            className="w-full flex items-center justify-between bg-slate-700/50 border border-blue-400/30 p-4 rounded-lg hover:border-blue-400/60 transition-all"
          >
            <span className="font-semibold text-blue-300">
              {load.load_type} {load.load_number}:
              {load.load_type === 'Point Load' && ` ${load.magnitude} kN at ${load.position}m`}
              {load.load_type === 'Distributed Load' &&
                ` ${load.magnitude} kN/m from ${load.start_pos}m to ${load.end_pos}m`}
            </span>
            <ChevronDown
              size={20}
              className={`text-blue-400 transition-transform ${
                expandedSections[`load-${idx}`] ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections[`load-${idx}`] && (
            <div className="bg-slate-700/30 border border-t-0 border-blue-400/30 p-4 rounded-b-lg">
              <div className="space-y-2 font-mono text-sm text-gray-300">
                {load.steps.map((step, stepIdx) => (
                  <div
                    key={`step-${stepIdx}`}
                    className={`pl-4 ${step === '' ? 'h-2' : ''} ${
                      step.includes(':') && !step.startsWith('  ')
                        ? 'font-bold text-blue-200 mt-3'
                        : ''
                    }`}
                  >
                    {step !== '' && step}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Summary calculations */}
      <div className="mt-6">
        <button
          onClick={() => toggleSection('summary')}
          className="w-full flex items-center justify-between bg-slate-700/50 border border-green-400/30 p-4 rounded-lg hover:border-green-400/60 transition-all"
        >
          <span className="font-semibold text-green-300">Final Summary</span>
          <ChevronDown
            size={20}
            className={`text-green-400 transition-transform ${
              expandedSections['summary'] ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections['summary'] && (
          <div className="bg-slate-700/30 border border-t-0 border-green-400/30 p-4 rounded-b-lg">
            <div className="space-y-2 font-mono text-sm text-gray-300">
              {calculations.summary_steps.map((step, idx) => (
                <div
                  key={`summary-${idx}`}
                  className={`pl-4 ${
                    step.startsWith('SUMMARY') || step.startsWith('Total')
                      ? 'font-bold text-green-200'
                      : ''
                  }`}
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Educational note */}
      <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
        <p className="text-sm text-yellow-300">
          💡 <strong>Learning Tip:</strong> These calculations use the <strong>method of superposition</strong> —
          each load is analyzed separately, then all results are combined. This is valid for linear elastic beams!
        </p>
      </div>
    </div>
  );
}
