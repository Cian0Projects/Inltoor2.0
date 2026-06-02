'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { CaseStudy } from '@/app/data/realWorldExamples';

interface BeamVisualizerProps {
  caseStudy: CaseStudy;
}

export default function BeamVisualizer({ caseStudy }: BeamVisualizerProps) {
  const SVG_WIDTH = 900;
  const SVG_HEIGHT = 250;
  const BEAM_START_X = 80;
  const BEAM_END_X = 820;
  const BEAM_Y = 120;
  const PADDING_TOP = 30;

  // Convert beam position to screen position
  const beamToScreenPos = (position: number): number => {
    return BEAM_START_X + (position / caseStudy.specs.span) * (BEAM_END_X - BEAM_START_X);
  };

  // Generate chart data from the loads
  const generateChartData = () => {
    const points = 100;
    const data = [];
    
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * caseStudy.specs.span;
      let shear = 0;
      let moment = 0;

      if (caseStudy.beamType === 'simply_supported') {
        // Calculate reactions
        let R1 = 0, R2 = 0;
        
        // Point loads reaction contribution
        caseStudy.actualLoads.pointLoads.forEach(load => {
          const L = caseStudy.specs.span;
          R1 += load.magnitude * (L - load.position) / L;
          R2 += load.magnitude * load.position / L;
        });

        // UDL reaction contribution
        caseStudy.actualLoads.distributedLoads.forEach(load => {
          const udlTotal = load.magnitude * (load.endPos - load.startPos);
          const center = (load.startPos + load.endPos) / 2;
          const L = caseStudy.specs.span;
          R1 += udlTotal * (L - center) / L;
          R2 += udlTotal * center / L;
        });

        shear = R1;
        moment = R1 * x;

        // Subtract point loads
        caseStudy.actualLoads.pointLoads.forEach(load => {
          if (x > load.position) {
            shear -= load.magnitude;
            moment -= load.magnitude * (x - load.position);
          }
        });

        // Subtract UDL
        caseStudy.actualLoads.distributedLoads.forEach(load => {
          if (x > load.startPos) {
            const startX = Math.max(load.startPos, 0);
            const endX = Math.min(load.endPos, x);
            if (endX > startX) {
              const udlLength = endX - startX;
              shear -= load.magnitude * udlLength;
              const udlMoment = load.magnitude * (endX - startX) * (x - (startX + endX) / 2);
              moment -= udlMoment;
            }
          }
        });
      } else {
        // Cantilever beam
        shear = 0;
        moment = 0;

        // Point loads
        caseStudy.actualLoads.pointLoads.forEach(load => {
          shear += load.magnitude;
          moment += load.magnitude * (caseStudy.specs.span - x);
        });

        // UDL
        caseStudy.actualLoads.distributedLoads.forEach(load => {
          if (x <= load.startPos) {
            shear += load.magnitude * (load.endPos - load.startPos);
            moment += load.magnitude * ((load.endPos ** 2 - load.startPos ** 2) / 2 - x * (load.endPos - load.startPos));
          } else if (x < load.endPos) {
            shear += load.magnitude * (load.endPos - x);
            moment += load.magnitude / 2 * (load.endPos - x) ** 2;
          }
        });
      }

      data.push({
        x: parseFloat(x.toFixed(2)),
        shear: parseFloat(shear.toFixed(2)),
        moment: parseFloat(moment.toFixed(2)),
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-6">
      {/* Beam Diagram */}
      <div className="bg-slate-700/40 rounded-lg border border-blue-400/20 p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Beam Diagram with Loads</h3>
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          className="w-full border border-slate-600 rounded bg-slate-800/50"
        >
          {/* Beam */}
          <rect x={BEAM_START_X} y={BEAM_Y - 5} width={BEAM_END_X - BEAM_START_X} height="10" fill="#94a3b8" />

          {caseStudy.beamType === 'simply_supported' ? (
            <>
              {/* Left Pin Support */}
              <polygon points={`${BEAM_START_X},${BEAM_Y + 10} ${BEAM_START_X - 10},${BEAM_Y + 25} ${BEAM_START_X + 10},${BEAM_Y + 25}`} fill="#0ea5e9" />
              <circle cx={BEAM_START_X} cy={BEAM_Y} r="6" fill="#0ea5e9" />

              {/* Right Roller Support */}
              <polygon points={`${BEAM_END_X},${BEAM_Y + 10} ${BEAM_END_X - 10},${BEAM_Y + 25} ${BEAM_END_X + 10},${BEAM_Y + 25}`} fill="#0ea5e9" />
              <circle cx={BEAM_END_X} cy={BEAM_Y} r="6" fill="#0ea5e9" />
              <circle cx={BEAM_END_X - 8} cy={BEAM_Y + 30} r="4" fill="#0ea5e9" />
              <circle cx={BEAM_END_X + 8} cy={BEAM_Y + 30} r="4" fill="#0ea5e9" />
            </>
          ) : (
            <>
              {/* Cantilever Fixed Support */}
              <rect x={BEAM_START_X - 6} y={BEAM_Y - 6} width="12" height="12" fill="#0ea5e9" />
              <line x1={BEAM_START_X - 10} y1={BEAM_Y + 10} x2={BEAM_START_X + 10} y2={BEAM_Y + 10} stroke="#0ea5e9" strokeWidth="2" />
              <line x1={BEAM_START_X - 10} y1={BEAM_Y + 14} x2={BEAM_START_X + 10} y2={BEAM_Y + 14} stroke="#0ea5e9" strokeWidth="2" />
              <line x1={BEAM_START_X - 10} y1={BEAM_Y + 18} x2={BEAM_START_X + 10} y2={BEAM_Y + 18} stroke="#0ea5e9" strokeWidth="2" />
            </>
          )}

          {/* Point Loads */}
          {caseStudy.actualLoads.pointLoads.map((load, i) => (
            <g key={`point-${i}`}>
              <circle
                cx={beamToScreenPos(load.position)}
                cy={BEAM_Y - 50}
                r="8"
                fill="#ef4444"
                opacity="0.3"
              />
              <line
                x1={beamToScreenPos(load.position)}
                y1={BEAM_Y - 50}
                x2={beamToScreenPos(load.position)}
                y2={BEAM_Y - 10}
                stroke="#ef4444"
                strokeWidth="2"
              />
              <polygon
                points={`${beamToScreenPos(load.position)},${BEAM_Y - 10} ${beamToScreenPos(load.position) - 5},${BEAM_Y - 20} ${beamToScreenPos(load.position) + 5},${BEAM_Y - 20}`}
                fill="#ef4444"
              />
              <text
                x={beamToScreenPos(load.position)}
                y={BEAM_Y - 60}
                textAnchor="middle"
                className="text-xs fill-red-300 font-semibold"
              >
                {load.magnitude.toFixed(1)} kN
              </text>
            </g>
          ))}

          {/* Distributed Loads */}
          {caseStudy.actualLoads.distributedLoads.map((load, i) => (
            <g key={`udl-${i}`}>
              <line
                x1={beamToScreenPos(load.startPos)}
                y1={BEAM_Y - 60}
                x2={beamToScreenPos(load.endPos)}
                y2={BEAM_Y - 60}
                stroke="#3b82f6"
                strokeWidth="2"
              />
              {Array.from({ length: Math.max(3, Math.floor((load.endPos - load.startPos) / 5)) }).map((_, j) => {
                const x = load.startPos + (j * (load.endPos - load.startPos)) / (Math.max(3, Math.floor((load.endPos - load.startPos) / 5)) - 1);
                return (
                  <g key={j}>
                    <line
                      x1={beamToScreenPos(x)}
                      y1={BEAM_Y - 60}
                      x2={beamToScreenPos(x)}
                      y2={BEAM_Y - 10}
                      stroke="#3b82f6"
                      strokeWidth="1.5"
                    />
                    <polygon
                      points={`${beamToScreenPos(x)},${BEAM_Y - 15} ${beamToScreenPos(x) - 3},${BEAM_Y - 22} ${beamToScreenPos(x) + 3},${BEAM_Y - 22}`}
                      fill="#3b82f6"
                    />
                  </g>
                );
              })}
              <text
                x={(beamToScreenPos(load.startPos) + beamToScreenPos(load.endPos)) / 2}
                y={BEAM_Y - 70}
                textAnchor="middle"
                className="text-xs fill-blue-300 font-semibold"
              >
                {load.magnitude.toFixed(1)} kN/m
              </text>
            </g>
          ))}

          {/* Span Label */}
          <text x={SVG_WIDTH / 2} y={BEAM_Y + 50} textAnchor="middle" className="text-xs fill-white font-semibold">
            L = {caseStudy.specs.span.toFixed(1)} m
          </text>
        </svg>
      </div>

      {/* Shear Force Diagram */}
      <div className="bg-slate-700/40 rounded-lg border border-red-400/20 p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Shear Force Diagram (SFD)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorShear" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="x" 
              stroke="#cbd5e1" 
              interval={Math.floor(chartData.length / 5)}
              tickFormatter={(value) => `${value.toFixed(0)}`}
              label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: -5, fill: '#cbd5e1' }}
            />
            <YAxis 
              stroke="#cbd5e1" 
              label={{ value: 'Shear (kN)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #ef4444', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(value) => `${(value as number).toFixed(3)} kN`}
              labelFormatter={(value) => `x: ${(value as number).toFixed(1)} m`}
            />
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
            <Area type="monotone" dataKey="shear" stroke="#ef4444" fill="url(#colorShear)" strokeWidth={3} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bending Moment Diagram */}
      <div className="bg-slate-700/40 rounded-lg border border-blue-400/20 p-4">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Bending Moment Diagram (BMD)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMoment" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="x" 
              stroke="#cbd5e1"
              interval={Math.floor(chartData.length / 5)}
              tickFormatter={(value) => `${value.toFixed(0)}`}
              label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: -5, fill: '#cbd5e1' }}
            />
            <YAxis 
              stroke="#cbd5e1"
              label={{ value: 'Moment (kNm)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#e2e8f0' }}
              formatter={(value) => `${(value as number).toFixed(3)} kNm`}
              labelFormatter={(value) => `x: ${(value as number).toFixed(1)} m`}
            />
            <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
            <Area type="monotone" dataKey="moment" stroke="#3b82f6" fill="url(#colorMoment)" strokeWidth={3} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
