'use client';

import { useState, useRef, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import {
  Trash2,
  Plus,
  ChevronDown,
  Zap,
  TrendingUp,
  Gauge,
  BookOpen,
} from 'lucide-react';
import CalculationsDisplay from './CalculationsDisplay';
import LoadingSpinner from './LoadingSpinner';

interface Load {
  id: string;
  type: 'point' | 'udl';
  magnitude: number;
  position?: number; // For point loads
  startPos?: number; // For UDL
  endPos?: number; // For UDL
}

interface DiagramData {
  x: number[];
  shear: number[];
  moment: number[];
  deflection: number[];
}

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

interface BeamResponse {
  diagram_data: DiagramData;
  reactions: number[];
  summary: {
    max_shear: number;
    max_moment: number;
    max_deflection: number;
  };
  calculations?: Calculations;
}

export default function InteractiveDraggableBeam() {
  const [span, setSpan] = useState(10);
  const [beamType, setBeamType] = useState<'simply_supported' | 'cantilever'>('simply_supported');
  const [loads, setLoads] = useState<Load[]>([]);
  const [beamData, setBeamData] = useState<BeamResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [addingLoadType, setAddingLoadType] = useState<'point' | 'udl' | null>(null);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [draggingLoadId, setDraggingLoadId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0); // beam-space offset from load anchor to grab point
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);
  const [showCalculations, setShowCalculations] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const API_BASE = 'http://localhost:8000';
  const SVG_WIDTH = 800;
  const SVG_HEIGHT = 220;
  const BEAM_START_X = 80;
  const BEAM_END_X = 720;
  const BEAM_Y = 120;

  // Fetch beam calculation
  useEffect(() => {
    if (loads.length === 0) {
      setBeamData(null);
      return;
    }
    
    fetchBeamData();
  }, [loads, span, beamType]);

  const fetchBeamData = async () => {
    setLoading(true);
    try {
      const payload = {
        beam_type: beamType,
        span,
        loads: loads.map(load => ({
          type: load.type,
          magnitude: load.magnitude,
          ...(load.type === 'point' && { position: load.position! }),
          ...(load.type === 'udl' && { start_pos: load.startPos!, end_pos: load.endPos! }),
        })),
        E: 210_000_000,
        I: 1e-4,
      };

      const response = await fetch(`${API_BASE}/beam/combined-loads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        setBeamData(data);
      }
    } catch (error) {
      console.error('Error fetching beam data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convert screen position to beam position
  const screenToBoardPos = (screenX: number): number => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    // Scale clientX into SVG viewBox coordinates
    const scale = SVG_WIDTH / rect.width;
    const svgX = (screenX - rect.left) * scale;
    const relativeX = svgX - BEAM_START_X;
    const position = (relativeX / (BEAM_END_X - BEAM_START_X)) * span;
    return Math.max(0, Math.min(span, position));
  };

  // Convert beam position to screen position
  const beamToScreenPos = (position: number): number => {
    return BEAM_START_X + (position / span) * (BEAM_END_X - BEAM_START_X);
  };

  const handleSVGClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!addingLoadType || draggingLoadId) return;

    const position = screenToBoardPos(e.clientX);

    if (addingLoadType === 'point') {
      const newLoad: Load = {
        id: `load-${Date.now()}`,
        type: 'point',
        magnitude: 50,
        position,
      };
      setLoads([...loads, newLoad]);
      setAddingLoadType(null);
    }
  };

  const handleStartUDL = (e: React.MouseEvent<SVGSVGElement>) => {
    if (addingLoadType !== 'udl') return;
    setDragStart(screenToBoardPos(e.clientX));
  };

  const handleEndUDL = (e: React.MouseEvent<SVGSVGElement>) => {
    if (addingLoadType !== 'udl' || dragStart === null) return;

    const endPos = screenToBoardPos(e.clientX);
    const startPos = Math.min(dragStart, endPos);
    const finalEndPos = Math.max(dragStart, endPos);

    if (Math.abs(finalEndPos - startPos) > 0.1) {
      const newLoad: Load = {
        id: `load-${Date.now()}`,
        type: 'udl',
        magnitude: 10,
        startPos,
        endPos: finalEndPos,
      };
      setLoads([...loads, newLoad]);
    }

    setAddingLoadType(null);
    setDragStart(null);
  };

  const removeLoad = (id: string) => {
    setLoads(loads.filter(load => load.id !== id));
  };

  const updateLoadMagnitude = (id: string, magnitude: number) => {
    setLoads(loads.map(load => 
      load.id === id ? { ...load, magnitude } : load
    ));
  };

  // Handle dragging loads
  const handleLoadMouseDown = (e: React.MouseEvent<SVGCircleElement | SVGRectElement>, loadId: string) => {
    e.stopPropagation();
    const grabPos = screenToBoardPos(e.clientX);
    const load = loads.find(l => l.id === loadId);
    // Record offset between grab point and load anchor (position for point, startPos for UDL)
    const anchor = load?.type === 'point' ? (load.position ?? 0) : (load?.startPos ?? 0);
    setDragOffset(grabPos - anchor);
    setDraggingLoadId(loadId);
  };

  const handleSVGMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingLoadId) return;

    const cursorPos = screenToBoardPos(e.clientX);
    const newAnchor = cursorPos - dragOffset;
    setLoads(loads.map(load => {
      if (load.id !== draggingLoadId) return load;
      if (load.type === 'point') {
        return { ...load, position: Math.max(0, Math.min(span, newAnchor)) };
      }
      const width = load.endPos! - load.startPos!;
      const newStart = Math.max(0, Math.min(span - width, newAnchor));
      return { ...load, startPos: newStart, endPos: newStart + width };
    }));
  };

  const handleSVGMouseUp = () => {
    setDraggingLoadId(null);
  };

  const updateLoadPosition = (id: string, position: number) => {
    setLoads(loads.map(load =>
      load.id === id && load.type === 'point'
        ? { ...load, position: Math.max(0, Math.min(span, position)) }
        : load
    ));
  };

  const updateLoadStartPos = (id: string, startPos: number) => {
    setLoads(loads.map(load =>
      load.id === id && load.type === 'udl'
        ? { ...load, startPos: Math.max(0, Math.min(span, startPos)), endPos: Math.max(startPos + 0.1, load.endPos!) }
        : load
    ));
  };

  const updateLoadEndPos = (id: string, endPos: number) => {
    setLoads(loads.map(load =>
      load.id === id && load.type === 'udl'
        ? { ...load, endPos: Math.max(0, Math.min(span, endPos)) }
        : load
    ));
  };

  // Prepare chart data
  const chartData = beamData
    ? beamData.diagram_data.x.map((x, i) => ({
        x,
        shear: beamData.diagram_data.shear[i],
        moment: beamData.diagram_data.moment[i],
      }))
    : [];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header with Logo and Title */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 shadow-lg border-b border-blue-500">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-lg backdrop-blur-md">
              <img 
                src="/logo.png" 
                alt="Inltoor Logo" 
                className="h-20 w-20 object-contain"
              />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Inltoor</h1>
              <p className="text-blue-100 text-sm">Interactive Structural Engineering Learning</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/challenge"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
            >
              🌉 Bridge Challenge
            </a>
            <a
              href="/learning-hub"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 hover:scale-105"
            >
              <BookOpen size={20} />
              Learning Hub
            </a>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 backdrop-blur-md rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-2">Interactive Multi-Load Beam Analysis</h2>
          <p className="text-gray-300">Design and analyse beams with point loads and distributed loads. Choose between simply supported and cantilever configurations. Watch the SFD and BMD update in real-time!</p>
        </div>

        {/* Educational Info Section */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Bending Moment Info */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-400/20 backdrop-blur-md rounded-xl p-5">
            <h3 className="text-lg font-bold text-amber-300 mb-3">Why Bending Moment Matters</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Bending moment represents the internal rotational force at any point along the beam, causing it to bend. Understanding moment distribution is critical because the maximum bending moment directly determines the required beam size and material strength. Design engineers use moment values to select adequate sections that can resist bending stresses, larger moments require stronger, deeper beams to prevent failure. The location of maximum moment is especially important, as this is where the beam is most vulnerable to breaking.
            </p>
          </div>

          {/* Shear Force Info */}
          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20 backdrop-blur-md rounded-xl p-5">
            <h3 className="text-lg font-bold text-cyan-300 mb-3">Why Shear Force Matters</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Shear force represents the internal sliding force at any cross-section, showing how loads are transmitted through the beam toward supports. Peak shear stress locations inform critical design decisions like connection details, welds, bolt spacing, and support adequacy. High shear concentrations near supports or beneath point loads require reinforcement or special detailing to prevent diagonal cracking or shear failure. Engineers analyse shear force distribution to ensure fasteners and joint designs can safely handle these internal forces.
            </p>
          </div>
        </div>

      {/* Controls */}
      <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
        <h3 className="text-lg font-bold text-white mb-6">Beam Configuration</h3>
        <div className="space-y-6">
          {/* Beam Span Control */}
          <div className="bg-slate-700/40 p-4 rounded-lg border border-blue-400/10">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-100">Beam Span</label>
              <span className="text-2xl font-bold text-blue-400">{span.toFixed(1)} m</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              value={span}
              onChange={(e) => setSpan(Number(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>2m</span>
              <span>20m</span>
            </div>
          </div>

          {/* Beam Type Selector */}
          <div className="bg-slate-700/40 p-4 rounded-lg border border-blue-400/10">
            <label className="text-sm font-semibold text-gray-100 block mb-3">Beam Type</label>
            <div className="flex gap-3">
              <button
                onClick={() => setBeamType('simply_supported')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  beamType === 'simply_supported'
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                    : 'bg-slate-700 text-gray-200 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Simply Supported
              </button>
              <button
                onClick={() => setBeamType('cantilever')}
                className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                  beamType === 'cantilever'
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg'
                    : 'bg-slate-700 text-gray-200 hover:bg-slate-600 border border-slate-600'
                }`}
              >
                Cantilever
              </button>
            </div>
          </div>

          {/* Load Type Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setAddingLoadType(addingLoadType === 'point' ? null : 'point')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                addingLoadType === 'point'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg scale-105'
                  : 'bg-slate-700 text-gray-200 hover:bg-slate-600 border border-slate-600'
              }`}
            >
              <Plus size={18} />
              {addingLoadType === 'point' ? 'Add Point (Click)' : 'Add Point Load'}
            </button>
            <button
              onClick={() => setAddingLoadType(addingLoadType === 'udl' ? null : 'udl')}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2 ${
                addingLoadType === 'udl'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-slate-700 text-gray-200 hover:bg-slate-600 border border-slate-600'
              }`}
            >
              <Plus size={18} />
              {addingLoadType === 'udl' ? 'Add UDL (Drag)' : 'Add UDL'}
            </button>
          </div>
        </div>
      </div>

      {/* Beam Canvas */}
      <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
        <h2 className="text-lg font-bold text-white mb-4">Beam Diagram</h2>
        <div className="bg-gradient-to-b from-slate-700/40 to-slate-800/40 border border-slate-700 rounded-lg p-4">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-56 drop-shadow-lg"
            onClick={addingLoadType === 'point' ? handleSVGClick : undefined}
            onMouseDown={addingLoadType === 'udl' ? handleStartUDL : undefined}
            onMouseMove={handleSVGMouseMove}
            onMouseUp={(e) => {
              if (addingLoadType === 'udl') handleEndUDL(e);
              handleSVGMouseUp();
            }}
          style={{ cursor: addingLoadType ? 'crosshair' : draggingLoadId ? 'grabbing' : 'default' }}
        >
          {/* Beam */}
          <rect x={BEAM_START_X} y={BEAM_Y - 5} width={BEAM_END_X - BEAM_START_X} height="10" fill="#94a3b8" />

          {beamType === 'simply_supported' ? (
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

          {/* Span Label */}
          <text x={SVG_WIDTH / 2} y={BEAM_Y + 50} textAnchor="middle" className="text-xs fill-white font-semibold">
            L = {span.toFixed(1)} m
          </text>

          {/* Render UDLs first (behind point loads) */}
          {loads.filter(l => l.type === 'udl').map(load => (
            load.startPos !== undefined && load.endPos !== undefined ? (
              <g key={load.id}>
                {/* Horizontal cap line at UDL level */}
                <line
                  x1={beamToScreenPos(load.startPos)}
                  y1={BEAM_Y - 45}
                  x2={beamToScreenPos(load.endPos)}
                  y2={BEAM_Y - 45}
                  stroke="#3b82f6"
                  strokeWidth="2"
                  pointerEvents="none"
                />
                {/* Distributed vertical arrows */}
                {Array.from({ length: Math.max(3, Math.floor((load.endPos - load.startPos) / span * 10)) }).map((_, i) => {
                  const count = Math.max(3, Math.floor((load.endPos! - load.startPos!) / span * 10));
                  const x = load.startPos! + (i * (load.endPos! - load.startPos!)) / (count - 1);
                  return (
                    <g key={i}>
                      <line
                        x1={beamToScreenPos(x)}
                        y1={BEAM_Y - 45}
                        x2={beamToScreenPos(x)}
                        y2={BEAM_Y - 10}
                        stroke="#3b82f6"
                        strokeWidth="1.5"
                        pointerEvents="none"
                      />
                      <polygon
                        points={`${beamToScreenPos(x)},${BEAM_Y - 10} ${beamToScreenPos(x) - 4},${BEAM_Y - 20} ${beamToScreenPos(x) + 4},${BEAM_Y - 20}`}
                        fill="#3b82f6"
                        pointerEvents="none"
                      />
                    </g>
                  );
                })}
                {/* Draggable handle */}
                <rect
                  x={beamToScreenPos(load.startPos) - 2}
                  y={BEAM_Y - 50}
                  width={beamToScreenPos(load.endPos) - beamToScreenPos(load.startPos) + 4}
                  height="10"
                  fill="#3b82f6"
                  opacity="0.2"
                  onMouseDown={(e) => handleLoadMouseDown(e, load.id)}
                  style={{ cursor: 'grab' }}
                  pointerEvents="auto"
                />
                {/* UDL label — sits just above the cap line */}
                <text
                  x={(beamToScreenPos(load.startPos) + beamToScreenPos(load.endPos)) / 2}
                  y={BEAM_Y - 54}
                  textAnchor="middle"
                  fontSize="11"
                  className="fill-blue-300 font-semibold"
                  pointerEvents="none"
                >
                  {load.magnitude.toFixed(1)} kN/m
                </text>
              </g>
            ) : null
          ))}

          {/* Render point loads last (on top of UDLs) */}
          {loads.filter(l => l.type === 'point').map(load => {
            if (load.position === undefined) return null;
            const px = beamToScreenPos(load.position);
            // UDL label zone: BEAM_Y - 60 to BEAM_Y - 46 — leave a gap there
            const shaftTop = BEAM_Y - 75;      // bottom of drag circle
            const gapTop = BEAM_Y - 62;        // gap starts just above UDL text
            const gapBottom = BEAM_Y - 44;     // gap ends just below UDL cap line
            const shaftBottom = BEAM_Y - 10;   // top of beam
            const hasUDL = loads.some(l => l.type === 'udl');
            return (
              <g key={load.id}>
                {/* Point load label */}
                <text
                  x={px}
                  y={BEAM_Y - 90}
                  textAnchor="middle"
                  fontSize="11"
                  fill="#fca5a5"
                  fontWeight="600"
                  pointerEvents="none"
                >
                  {load.magnitude.toFixed(1)} kN
                </text>
                {/* Draggable grab circle */}
                <circle
                  cx={px}
                  cy={BEAM_Y - 75}
                  r="8"
                  fill="#ef4444"
                  opacity="0.3"
                  onMouseDown={(e) => handleLoadMouseDown(e, load.id)}
                  style={{ cursor: 'grab' }}
                />
                {/* Shaft segment above the UDL text gap */}
                <line
                  x1={px} y1={shaftTop}
                  x2={px} y2={hasUDL ? gapTop : shaftBottom}
                  stroke="#ef4444"
                  strokeWidth="2.5"
                  pointerEvents="none"
                />
                {/* Shaft segment below the UDL text gap (only when UDL present) */}
                {hasUDL && (
                  <line
                    x1={px} y1={gapBottom}
                    x2={px} y2={shaftBottom}
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    pointerEvents="none"
                  />
                )}
                {/* Arrowhead */}
                <polygon
                  points={`${px},${shaftBottom} ${px - 6},${BEAM_Y - 22} ${px + 6},${BEAM_Y - 22}`}
                  fill="#ef4444"
                  pointerEvents="none"
                />
              </g>
            );
          })}
        </svg>
        </div>
      </div>

      {/* Load Controls */}
      {loads.length > 0 && (
        <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" />
            Applied Loads
          </h3>
          <div className="space-y-3">
            {loads.map(load => (
              <div key={load.id} className="bg-gradient-to-r from-slate-700 to-slate-800 border border-blue-400/30 rounded-lg overflow-hidden hover:border-blue-400/60 transition-all duration-200">
                {/* Load Header - Always visible */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer hover:bg-slate-600/50 transition-colors"
                  onClick={() => setExpandedLoadId(expandedLoadId === load.id ? null : load.id)}
                >
                  <div className={`p-2 rounded-lg ${load.type === 'point' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {load.type === 'point' ? <Gauge size={18} /> : <TrendingUp size={18} />}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-200">
                      {load.type === 'point' ? 'Point Load' : 'UDL'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {load.type === 'point' ? `at ${load.position?.toFixed(1)}m` : `${load.startPos?.toFixed(1)}m - ${load.endPos?.toFixed(1)}m`}
                    </p>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={load.magnitude}
                    onChange={(e) => {
                      e.stopPropagation();
                      updateLoadMagnitude(load.id, Number(e.target.value));
                    }}
                    className="w-32 h-2 bg-slate-600 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="w-20 text-right font-semibold text-blue-300 text-sm">
                    {load.magnitude.toFixed(1)} {load.type === 'point' ? 'kN' : 'kN/m'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeLoad(load.id);
                    }}
                    className="p-2 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                  <ChevronDown
                    size={20}
                    className={`text-gray-400 transition-transform ${expandedLoadId === load.id ? 'rotate-180' : ''}`}
                  />
                </div>

                {/* Expandable Details */}
                {expandedLoadId === load.id && (
                  <div className="bg-slate-700/50 p-4 border-t border-blue-400/30 space-y-4">
                    {load.type === 'point' && load.position !== undefined && (
                      <div className="bg-slate-800/50 p-3 rounded-lg border border-blue-400/20">
                        <label className="block text-sm font-semibold text-gray-100 mb-3">
                          Position on Beam: <span className="text-blue-300">{load.position.toFixed(1)} m</span>
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={span}
                          step="0.1"
                          value={load.position}
                          onChange={(e) => updateLoadPosition(load.id, Number(e.target.value))}
                          className="w-full h-2 bg-slate-600 rounded appearance-none cursor-pointer accent-blue-500"
                        />
                        <div className="mt-3 flex gap-2">
                          <label className="text-sm text-gray-300">
                            Position (m):
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={span}
                            step="0.1"
                            value={load.position.toFixed(1)}
                            onChange={(e) => updateLoadPosition(load.id, Number(e.target.value))}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {load.type === 'udl' && load.startPos !== undefined && load.endPos !== undefined && (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Position: {load.startPos.toFixed(1)} m
                          </label>
                          <input
                            type="range"
                            min="0"
                            max={span - 0.5}
                            step="0.1"
                            value={load.startPos}
                            onChange={(e) => {
                              const newStart = Number(e.target.value);
                              if (load.endPos !== undefined && newStart < load.endPos) {
                                updateLoadStartPos(load.id, newStart);
                              }
                            }}
                            className="w-full"
                          />
                          <div className="mt-2 flex gap-2">
                            <label className="text-sm text-gray-600">
                              Start (m):
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={span - 0.5}
                              step="0.1"
                              value={load.startPos.toFixed(1)}
                              onChange={(e) => {
                                const newStart = Number(e.target.value);
                                if (load.endPos !== undefined && newStart < load.endPos) {
                                  updateLoadStartPos(load.id, newStart);
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Position: {load.endPos.toFixed(1)} m
                          </label>
                          <input
                            type="range"
                            min="0.5"
                            max={span}
                            step="0.1"
                            value={load.endPos}
                            onChange={(e) => {
                              const newEnd = Number(e.target.value);
                              if (load.startPos !== undefined && newEnd > load.startPos) {
                                updateLoadEndPos(load.id, newEnd);
                              }
                            }}
                            className="w-full"
                          />
                          <div className="mt-2 flex gap-2">
                            <label className="text-sm text-gray-600">
                              End (m):
                            </label>
                            <input
                              type="number"
                              min="0.5"
                              max={span}
                              step="0.1"
                              value={load.endPos.toFixed(1)}
                              onChange={(e) => {
                                const newEnd = Number(e.target.value);
                                if (load.startPos !== undefined && newEnd > load.startPos) {
                                  updateLoadEndPos(load.id, newEnd);
                                }
                              }}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Diagrams */}
      {loading && (
        <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 backdrop-blur-md p-12 rounded-xl shadow-xl flex justify-center items-center">
          <LoadingSpinner />
        </div>
      )}

      {beamData && (
        <>
          {/* Shear Force Diagram */}
          <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-red-400" />
              Shear Force Diagram (SFD)
            </h2>
            <div className="bg-slate-700/40 p-4 rounded-lg border border-slate-700">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorShear" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="x" stroke="#cbd5e1" interval={Math.floor(chartData.length / 5)} tickFormatter={(value) => value.toFixed(1)} label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: -5, fill: '#cbd5e1' }} />
                  <YAxis stroke="#cbd5e1" label={{ value: 'Shear (kN)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#e2e8f0' }} formatter={(value) => typeof value === 'number' ? value.toFixed(3) : value} labelFormatter={(value) => `Distance: ${value.toFixed(1)} m`} />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
                  <Area type="monotone" dataKey="shear" stroke="#ef4444" fill="url(#colorShear)" strokeWidth={3} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bending Moment Diagram */}
          <div className="mb-8 bg-gradient-to-br from-slate-800 to-slate-900 border border-blue-500/20 backdrop-blur-md p-6 rounded-xl shadow-xl">
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Gauge size={20} className="text-blue-400" />
              Bending Moment Diagram (BMD)
            </h2>
            <div className="bg-slate-700/40 p-4 rounded-lg border border-slate-700">
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorMoment" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis dataKey="x" stroke="#cbd5e1" interval={Math.floor(chartData.length / 5)} tickFormatter={(value) => value.toFixed(1)} label={{ value: 'Distance (m)', position: 'insideBottomRight', offset: -5, fill: '#cbd5e1' }} />
                  <YAxis stroke="#cbd5e1" label={{ value: 'Moment (kNm)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6', borderRadius: '8px', color: '#e2e8f0' }} formatter={(value) => typeof value === 'number' ? value.toFixed(3) : value} labelFormatter={(value) => `Distance: ${value.toFixed(1)} m`} />
                  <ReferenceLine y={0} stroke="#64748b" strokeWidth={2} />
                  <Area type="monotone" dataKey="moment" stroke="#3b82f6" fill="url(#colorMoment)" strokeWidth={3} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Show Calculations Button */}
          <div className="mb-8 flex justify-center">
            <button
              onClick={() => setShowCalculations(!showCalculations)}
              className={`px-8 py-4 rounded-lg font-bold transition-all duration-200 transform hover:scale-105 flex items-center gap-2 ${
                showCalculations
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg'
                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg'
              }`}
            >
              {showCalculations ? '✓ Hide Calculations' : 'Show Step-by-Step Calculations'}
            </button>
          </div>

          {/* Calculations Display */}
          {showCalculations && <CalculationsDisplay calculations={beamData.calculations} />}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 border border-red-500/30 backdrop-blur-md p-6 rounded-lg hover:border-red-500/60 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <Zap className="text-red-400" size={20} />
                <p className="text-sm font-semibold text-red-300">Max Shear Force</p>
              </div>
              <p className="text-3xl font-bold text-red-300">{beamData.summary.max_shear.toFixed(3)}</p>
              <p className="text-sm text-red-400">kN</p>
            </div>

            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 border border-blue-500/30 backdrop-blur-md p-6 rounded-lg hover:border-blue-500/60 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <Gauge className="text-blue-400" size={20} />
                <p className="text-sm font-semibold text-blue-300">Max Moment</p>
              </div>
              <p className="text-3xl font-bold text-blue-300">{beamData.summary.max_moment.toFixed(3)}</p>
              <p className="text-sm text-blue-400">kNm</p>
            </div>

            <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 border border-green-500/30 backdrop-blur-md p-6 rounded-lg hover:border-green-500/60 transition-all">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="text-green-400" size={20} />
                <p className="text-sm font-semibold text-green-300">Reactions</p>
              </div>
              <p className="text-sm font-semibold text-green-300 leading-relaxed">
                {beamType === 'simply_supported' ? (
                  <>
                    R1: <span className="text-green-200 font-bold">{beamData.reactions[0].toFixed(3)}</span> kN<br />
                    R2: <span className="text-green-200 font-bold">{beamData.reactions[1].toFixed(3)}</span> kN
                  </>
                ) : (
                  <>
                    Force: <span className="text-green-200 font-bold">{beamData.reactions[0].toFixed(3)}</span> kN<br />
                    Moment: <span className="text-green-200 font-bold">{beamData.reactions[1].toFixed(3)}</span> kNm
                  </>
                )}
              </p>
            </div>
          </div>
        </>
      )}

      {loads.length === 0 && (
        <div className="text-center py-16 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/20 backdrop-blur-md rounded-xl">
          <Plus size={48} className="mx-auto text-blue-300 mb-4 opacity-50" />
          <p className="text-gray-300 text-lg font-semibold">
            Ready to analyse a beam?
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Click "Add Point Load" or "Add UDL" to start adding loads to the beam
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
