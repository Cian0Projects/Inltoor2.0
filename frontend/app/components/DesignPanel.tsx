"use client";

import { useState, useMemo } from "react";
import type { ChallengeLevel, CheckResultType } from "@/lib/api";
import { checkDesign } from "@/lib/api";
import { Loader2 } from "lucide-react";

// ─── Material metadata (mirrors backend constants) ────────────────────────

type MaterialCategory = "timber" | "rc" | "steel";

interface TimberMeta {
  category: "timber";
  name: string; widthMm: number; depthsMm: number[];
  E_GPa: number; fm_Nmm2: number; kmod: number; gammaM: number;
  unitWeight: number; color: string;
}
interface RcMeta {
  category: "rc";
  name: string; widthM: number; depthsMm: number[];
  E_GPa: number; fck_Nmm2: number; unitWeight: number; color: string;
}
interface SteelSection { id: string; depth_mm: number; mass_kgm: number; I_cm4: number; Wel_cm3: number; }
interface SteelMeta {
  category: "steel";
  name: string; E_GPa: number; fy_Nmm2: number; color: string;
  sections: SteelSection[];
}
type MatMeta = TimberMeta | RcMeta | SteelMeta;

const MATERIALS_META: Record<string, MatMeta> = {
  timber_c24: {
    category: "timber", name: "Sawn Timber C24", widthMm: 150,
    depthsMm: [200, 250, 300, 350, 400], E_GPa: 11, fm_Nmm2: 24,
    kmod: 0.8, gammaM: 1.3, unitWeight: 4.5, color: "amber",
  },
  glulam_gl28h: {
    category: "timber", name: "GL28h Glulam", widthMm: 160,
    depthsMm: [200, 240, 280, 320, 360, 400], E_GPa: 12.6, fm_Nmm2: 28,
    kmod: 0.8, gammaM: 1.25, unitWeight: 5.0, color: "emerald",
  },
  rc_c30: {
    category: "rc", name: "RC C30/37", widthM: 1.0,
    depthsMm: [300, 400, 500, 600, 700, 800], E_GPa: 33, fck_Nmm2: 30,
    unitWeight: 25, color: "slate",
  },
  rc_c40: {
    category: "rc", name: "RC C40/50", widthM: 1.0,
    depthsMm: [300, 400, 500, 600, 700, 800], E_GPa: 35, fck_Nmm2: 40,
    unitWeight: 25, color: "blue",
  },
  steel_s275: {
    category: "steel", name: "Steel S275", E_GPa: 210, fy_Nmm2: 275, color: "sky",
    sections: [
      { id: "UB 406x178x60",  depth_mm: 406, mass_kgm: 60,  I_cm4: 21500,  Wel_cm3: 1060 },
      { id: "UB 457x191x74",  depth_mm: 457, mass_kgm: 74,  I_cm4: 33300,  Wel_cm3: 1460 },
      { id: "UB 533x210x101", depth_mm: 536, mass_kgm: 101, I_cm4: 61500,  Wel_cm3: 2290 },
      { id: "UB 610x229x113", depth_mm: 607, mass_kgm: 113, I_cm4: 87300,  Wel_cm3: 2880 },
      { id: "UB 686x254x125", depth_mm: 677, mass_kgm: 125, I_cm4: 118000, Wel_cm3: 3480 },
      { id: "UB 762x267x134", depth_mm: 750, mass_kgm: 134, I_cm4: 150000, Wel_cm3: 4000 },
      { id: "UB 838x292x176", depth_mm: 834, mass_kgm: 176, I_cm4: 246000, Wel_cm3: 5900 },
      { id: "UB 914x305x201", depth_mm: 903, mass_kgm: 201, I_cm4: 325000, Wel_cm3: 7200 },
    ],
  },
  steel_s355: {
    category: "steel", name: "Steel S355", E_GPa: 210, fy_Nmm2: 355, color: "violet",
    sections: [
      { id: "UB 406x178x60",  depth_mm: 406, mass_kgm: 60,  I_cm4: 21500,  Wel_cm3: 1060 },
      { id: "UB 457x191x74",  depth_mm: 457, mass_kgm: 74,  I_cm4: 33300,  Wel_cm3: 1460 },
      { id: "UB 533x210x101", depth_mm: 536, mass_kgm: 101, I_cm4: 61500,  Wel_cm3: 2290 },
      { id: "UB 610x229x113", depth_mm: 607, mass_kgm: 113, I_cm4: 87300,  Wel_cm3: 2880 },
      { id: "UB 686x254x125", depth_mm: 677, mass_kgm: 125, I_cm4: 118000, Wel_cm3: 3480 },
      { id: "UB 762x267x134", depth_mm: 750, mass_kgm: 134, I_cm4: 150000, Wel_cm3: 4000 },
      { id: "UB 838x292x176", depth_mm: 834, mass_kgm: 176, I_cm4: 246000, Wel_cm3: 5900 },
      { id: "UB 914x305x201", depth_mm: 903, mass_kgm: 201, I_cm4: 325000, Wel_cm3: 7200 },
    ],
  },
};

const COLOR_CLASSES: Record<string, { border: string; bg: string; text: string; ring: string }> = {
  amber:  { border: "border-amber-500/40",  bg: "bg-amber-500/10",  text: "text-amber-400",  ring: "ring-amber-500" },
  emerald:{ border: "border-emerald-500/40",bg: "bg-emerald-500/10",text: "text-emerald-400",ring: "ring-emerald-500" },
  slate:  { border: "border-slate-400/40",  bg: "bg-slate-400/10",  text: "text-slate-300",  ring: "ring-slate-400" },
  blue:   { border: "border-blue-500/40",   bg: "bg-blue-500/10",   text: "text-blue-400",   ring: "ring-blue-500" },
  sky:    { border: "border-sky-500/40",    bg: "bg-sky-500/10",    text: "text-sky-400",    ring: "ring-sky-500" },
  violet: { border: "border-violet-500/40", bg: "bg-violet-500/10", text: "text-violet-400", ring: "ring-violet-500" },
};

// ─── Props ────────────────────────────────────────────────────────────────

interface Props {
  level: ChallengeLevel;
  onResult: (result: CheckResultType) => void;
  onBack: () => void;
}

export default function DesignPanel({ level, onResult, onBack }: Props) {
  const availableMaterials = (level.allowed_materials ?? []).filter((m) => m in MATERIALS_META);
  const firstMat = availableMaterials[0] ?? "";
  const firstMeta = MATERIALS_META[firstMat];

  const [selectedMaterial, setSelectedMaterial] = useState<string>(firstMat);
  const [selectedDepth, setSelectedDepth] = useState<number>(() =>
    firstMeta && (firstMeta.category === "timber" || firstMeta.category === "rc")
      ? (firstMeta as TimberMeta | RcMeta).depthsMm[0] : 0
  );
  const [selectedSection, setSelectedSection] = useState<string>(() =>
    firstMeta?.category === "steel" ? (firstMeta as SteelMeta).sections[0].id : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mat = MATERIALS_META[selectedMaterial];

  function handleMaterialChange(matId: string) {
    setSelectedMaterial(matId);
    const meta = MATERIALS_META[matId];
    if (!meta) return;
    if (meta.category === "timber" || meta.category === "rc") {
      setSelectedDepth((meta as TimberMeta | RcMeta).depthsMm[0]);
    } else if (meta.category === "steel") {
      setSelectedSection((meta as SteelMeta).sections[0].id);
    }
  }

  const colors = mat ? COLOR_CLASSES[mat.color] ?? COLOR_CLASSES["amber"] : COLOR_CLASSES["amber"];

  // Live section preview
  const preview = useMemo(() => {
    if (!mat) return null;
    if (mat.category === "timber") {
      const m = mat as TimberMeta;
      const w = m.widthMm / 1000; const d = selectedDepth / 1000;
      const I = w * d ** 3 / 12; const Z = w * d ** 2 / 6;
      const fm_d_kNm2 = m.kmod * m.fm_Nmm2 * 1000 / m.gammaM;
      return {
        I_label: `${(I * 1e8).toFixed(0)} cm⁴`, Z_label: `${(Z * 1e6).toFixed(0)} cm³`,
        cap_label: `${(fm_d_kNm2 * Z).toFixed(1)} kNm`, cap_name: "M_Rd",
        sw_label: `${(m.unitWeight * w * d).toFixed(3)} kN/m`,
      };
    }
    if (mat.category === "rc") {
      const m = mat as RcMeta;
      const b = m.widthM; const d = selectedDepth / 1000;
      const I = b * d ** 3 / 12; const Z = b * d ** 2 / 6;
      const M_Rd = 0.156 * m.fck_Nmm2 * 1000 * b * d ** 2;
      return {
        I_label: `${(I * 1e8).toFixed(0)} cm⁴`, Z_label: `${(Z * 1e6).toFixed(0)} cm³`,
        cap_label: `${M_Rd.toFixed(1)} kNm`, cap_name: "M_Rd",
        sw_label: `${(m.unitWeight * b * d).toFixed(2)} kN/m`,
      };
    }
    if (mat.category === "steel") {
      const m = mat as SteelMeta;
      const sec = m.sections.find((s) => s.id === selectedSection);
      if (!sec) return null;
      const M_Rd = m.fy_Nmm2 * 1000 * sec.Wel_cm3 * 1e-6;
      return {
        I_label: `${sec.I_cm4.toLocaleString()} cm⁴`, Z_label: `${sec.Wel_cm3.toLocaleString()} cm³`,
        cap_label: `${M_Rd.toFixed(0)} kNm`, cap_name: "M_Rd = fy × Wel",
        sw_label: `${(sec.mass_kgm * 9.81 / 1000).toFixed(3)} kN/m`,
      };
    }
    return null;
  }, [mat, selectedDepth, selectedSection]);

  async function handleTestDesign() {
    if (!selectedMaterial) return;
    if (!mat) return;
    if ((mat.category === "timber" || mat.category === "rc") && !selectedDepth) return;
    if (mat.category === "steel" && !selectedSection) return;

    setLoading(true); setError(null);
    try {
      const result = await checkDesign({
        level_id: level.id,
        material_id: selectedMaterial,
        depth_mm: mat.category !== "steel" ? selectedDepth : 0,
        section_id: mat.category === "steel" ? selectedSection : "",
      });
      onResult(result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const depthsMm = mat && mat.category !== "steel"
    ? (mat as TimberMeta | RcMeta).depthsMm : [];

  const loadLabel = level.live_load_type === "udl"
    ? `${level.live_load_magnitude} kN/m UDL`
    : `${level.live_load_magnitude} kN point`;

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100">{level.title}</h2>
          <p className="text-xs text-zinc-400">
            {level.span}m span · {loadLabel} · Deflection limit L/{level.deflection_limit}
          </p>
        </div>
        <button onClick={onBack} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors border border-zinc-700 rounded px-2 py-1">
          ← Back
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: selectors */}
        <div className="space-y-4">
          {/* Material */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Material</h3>
            <div className="space-y-2">
              {availableMaterials.map((matId) => {
                const m = MATERIALS_META[matId];
                if (!m) return null;
                const c = COLOR_CLASSES[m.color] ?? COLOR_CLASSES["amber"];
                const isActive = selectedMaterial === matId;
                return (
                  <button key={matId} onClick={() => handleMaterialChange(matId)}
                    className={`w-full rounded-lg border p-3 text-left transition-all
                      ${isActive ? `${c.border} ${c.bg} ring-1 ${c.ring}` : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold text-sm ${isActive ? c.text : "text-zinc-300"}`}>{m.name}</span>
                      <span className="text-xs text-zinc-500">
                        {m.category === "timber" ? `${(m as TimberMeta).widthMm}mm wide` :
                         m.category === "rc" ? "1.0m wide strip" : "UB sections"}
                      </span>
                    </div>
                    <div className="mt-1 flex gap-3 text-xs text-zinc-500">
                      <span>E = {m.E_GPa} GPa</span>
                      {m.category === "timber" && <span>fm,k = {(m as TimberMeta).fm_Nmm2} N/mm²</span>}
                      {m.category === "rc" && <span>fck = {(m as RcMeta).fck_Nmm2} N/mm²</span>}
                      {m.category === "steel" && <span>fy = {(m as SteelMeta).fy_Nmm2} N/mm²</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section selector — depth (timber/RC) */}
          {mat && mat.category !== "steel" && depthsMm.length > 0 && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">
                {mat.category === "rc" ? "Slab Depth (1000mm wide)" : `Beam Depth — ${(mat as TimberMeta).widthMm}mm wide`}
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {depthsMm.map((d) => {
                  const isActive = selectedDepth === d;
                  return (
                    <button key={d} onClick={() => setSelectedDepth(d)}
                      className={`rounded-lg border py-2 text-sm font-medium transition-all
                        ${isActive ? `${colors.border} ${colors.bg} ${colors.text} ring-1 ${colors.ring}`
                                   : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"}`}
                    >
                      {d}mm
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section selector — UB (steel) */}
          {mat && mat.category === "steel" && (
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Universal Beam Section</h3>
              <div className="space-y-1.5">
                {(mat as SteelMeta).sections.map((s) => {
                  const isActive = selectedSection === s.id;
                  return (
                    <button key={s.id} onClick={() => setSelectedSection(s.id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition-all
                        ${isActive ? `${colors.border} ${colors.bg} ring-1 ${colors.ring}`
                                   : "border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-sm font-mono font-semibold ${isActive ? colors.text : "text-zinc-300"}`}>{s.id}</span>
                        <span className="text-xs text-zinc-500">{s.mass_kgm} kg/m</span>
                      </div>
                      <div className="flex gap-3 text-xs text-zinc-500 mt-0.5">
                        <span>d = {s.depth_mm}mm</span>
                        <span>I = {s.I_cm4.toLocaleString()} cm⁴</span>
                        <span>Wel = {s.Wel_cm3.toLocaleString()} cm³</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: preview */}
        <div className="space-y-4">
          {/* Section preview */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Section Preview</h3>

            {/* SVG cross-section diagram */}
            {mat && (
              <div className="flex justify-center mb-4">
                {mat.category === "timber" && (
                  <TimberSectionSVG
                    widthMm={(mat as TimberMeta).widthMm} depthMm={selectedDepth}
                    maxDepthMm={400} color={mat.color} />
                )}
                {mat.category === "rc" && (
                  <RcSectionSVG depthMm={selectedDepth} maxDepthMm={800} />
                )}
                {mat.category === "steel" && (
                  <SteelSectionSVG
                    section={(mat as SteelMeta).sections.find(s => s.id === selectedSection) ?? (mat as SteelMeta).sections[0]}
                    color={mat.color} />
                )}
              </div>
            )}

            {preview && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <PropertyRow label="I" value={preview.I_label} formula="Second moment of area" />
                <PropertyRow label="Wel / Z" value={preview.Z_label} formula="Elastic section modulus" />
                <PropertyRow label={preview.cap_name} value={preview.cap_label} formula="Moment capacity" />
                <PropertyRow label="Self-weight" value={preview.sw_label} formula="Dead load per metre" />
              </div>
            )}
          </div>

          {/* Loading diagram */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3">Loading</h3>
            <svg viewBox="0 0 260 90" className="w-full">
              <rect x="20" y="48" width="220" height="10" rx="2" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
              <polygon points="20,58 10,74 30,74" fill="#71717a" />
              <line x1="5" y1="74" x2="35" y2="74" stroke="#71717a" strokeWidth="1.5" />
              <polygon points="240,58 230,74 250,74" fill="#71717a" />
              <circle cx="235" cy="76" r="2" fill="#71717a" />
              <circle cx="245" cy="76" r="2" fill="#71717a" />
              <line x1="225" y1="79" x2="255" y2="79" stroke="#71717a" strokeWidth="1" />
              {level.live_load_type === "udl" ? (
                <>
                  {[30, 55, 80, 105, 130, 155, 180, 205, 230].map((x) => (
                    <g key={x}>
                      <line x1={x} y1="20" x2={x} y2="46" stroke="#f59e0b" strokeWidth="1.5" markerEnd="url(#dp-arrow)" />
                    </g>
                  ))}
                  <line x1="30" y1="20" x2="230" y2="20" stroke="#f59e0b" strokeWidth="1.5" />
                </>
              ) : (
                <>
                  <line x1="130" y1="10" x2="130" y2="46" stroke="#ef4444" strokeWidth="3" markerEnd="url(#dp-arrow-red)" />
                </>
              )}
              <text x="130" y="88" textAnchor="middle" fill="#71717a" fontSize="9">
                {level.span}m · {loadLabel}
              </text>
              <defs>
                <marker id="dp-arrow" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
                  <path d="M 0 0 L 3 6 L 6 0 Z" fill="#f59e0b" />
                </marker>
                <marker id="dp-arrow-red" markerWidth="6" markerHeight="6" refX="3" refY="6" orient="auto">
                  <path d="M 0 0 L 3 6 L 6 0 Z" fill="#ef4444" />
                </marker>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      <button onClick={handleTestDesign} disabled={loading || !selectedMaterial}
        className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 text-sm font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking design...</> : "Test Design →"}
      </button>
    </div>
  );
}

// ─── Section SVG helpers ──────────────────────────────────────────────────

function TimberSectionSVG({ widthMm, depthMm, maxDepthMm, color }: { widthMm: number; depthMm: number; maxDepthMm: number; color: string }) {
  const svgW = 90; const maxH = 110;
  const svgH = Math.max(20, (depthMm / maxDepthMm) * maxH);
  const x = (140 - svgW) / 2; const y = 150 - svgH;
  const fill = color === "emerald" ? "#064e3b40" : "#78350f40";
  const stroke = color === "emerald" ? "#10b981" : "#f59e0b";
  return (
    <svg width="140" height="160" viewBox="0 0 140 160">
      <line x1="0" y1="150" x2="140" y2="150" stroke="#52525b" strokeWidth="1" />
      <rect x={x} y={y} width={svgW} height={svgH} fill={fill} stroke={stroke} strokeWidth="1.5" rx="2" />
      <text x="70" y={y - 6} textAnchor="middle" fill="#71717a" fontSize="10">{widthMm}mm</text>
      <text x={x - 4} y={y + svgH / 2} textAnchor="end" dominantBaseline="middle" fill="#71717a" fontSize="10"
        transform={`rotate(-90, ${x - 4}, ${y + svgH / 2})`}>{depthMm}mm</text>
    </svg>
  );
}

function RcSectionSVG({ depthMm, maxDepthMm }: { depthMm: number; maxDepthMm: number }) {
  const svgW = 110; const maxH = 110;
  const svgH = Math.max(20, (depthMm / maxDepthMm) * maxH);
  const x = (140 - svgW) / 2; const y = 150 - svgH;
  return (
    <svg width="140" height="160" viewBox="0 0 140 160">
      <line x1="0" y1="150" x2="140" y2="150" stroke="#52525b" strokeWidth="1" />
      <rect x={x} y={y} width={svgW} height={svgH} fill="#1e293b60" stroke="#94a3b8" strokeWidth="1.5" rx="2" />
      {/* Rebar dots */}
      {[x + 10, x + 55, x + 100].map((rx) => (
        <circle key={rx} cx={rx} cy={150 - 10} r="3" fill="#ef4444" />
      ))}
      <text x="70" y={y - 6} textAnchor="middle" fill="#71717a" fontSize="10">1000mm</text>
      <text x={x - 4} y={y + svgH / 2} textAnchor="end" dominantBaseline="middle" fill="#71717a" fontSize="10"
        transform={`rotate(-90, ${x - 4}, ${y + svgH / 2})`}>{depthMm}mm</text>
    </svg>
  );
}

function SteelSectionSVG({ section, color }: { section: SteelSection; color: string }) {
  // Draw an I-beam cross section
  const stroke = color === "violet" ? "#a78bfa" : "#38bdf8";
  const fill = color === "violet" ? "#4c1d9520" : "#0c4a6e20";
  const cx = 70; const maxD = 903; const minD = 406;
  const svgH = 20 + ((section.depth_mm - minD) / (maxD - minD)) * 90;
  const flangeW = 80; const flangeT = 10; const webT = 6;
  const topY = 150 - svgH; const botY = 150;
  return (
    <svg width="140" height="160" viewBox="0 0 140 160">
      <line x1="0" y1="150" x2="140" y2="150" stroke="#52525b" strokeWidth="1" />
      {/* Top flange */}
      <rect x={cx - flangeW / 2} y={topY} width={flangeW} height={flangeT} fill={fill} stroke={stroke} strokeWidth="1.5" />
      {/* Web */}
      <rect x={cx - webT / 2} y={topY + flangeT} width={webT} height={svgH - flangeT * 2} fill={fill} stroke={stroke} strokeWidth="1" />
      {/* Bottom flange */}
      <rect x={cx - flangeW / 2} y={botY - flangeT} width={flangeW} height={flangeT} fill={fill} stroke={stroke} strokeWidth="1.5" />
      <text x="70" y={topY - 6} textAnchor="middle" fill="#71717a" fontSize="9">{section.id}</text>
      <text x={cx - flangeW / 2 - 4} y={topY + svgH / 2} textAnchor="end" dominantBaseline="middle"
        fill="#71717a" fontSize="10" transform={`rotate(-90, ${cx - flangeW / 2 - 4}, ${topY + svgH / 2})`}>
        {section.depth_mm}mm
      </text>
    </svg>
  );
}

function PropertyRow({ label, value, formula }: { label: string; value: string; formula: string }) {
  return (
    <div className="rounded bg-zinc-800 px-2 py-1.5">
      <p className="font-mono font-semibold text-zinc-200 text-xs">{label} = {value}</p>
      <p className="text-zinc-500 text-[10px] mt-0.5">{formula}</p>
    </div>
  );
}
