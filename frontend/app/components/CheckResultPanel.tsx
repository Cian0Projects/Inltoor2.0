"use client";

import { useState } from "react";
import type { CheckResultType } from "@/lib/api";
import { Star, CheckCircle2, XCircle, ChevronDown, ChevronUp } from "lucide-react";

// ─── Calculation steps builders ───────────────────────────────────────────

type CalcStep = { label: string; expression: string; result: string; note?: string };

function buildUlsSteps(result: CheckResultType): CalcStep[] {
  const { uls_bending: u, section: s, material_id } = result;
  const span = result.sls_deflection.delta_limit_mm / 1000 * parseInt(result.sls_deflection.limit_ratio.replace("L/", ""));
  const L = span;
  const steps: CalcStep[] = [];

  // Step 1 — self-weight
  if (s.type === "timber" || s.type === "rc") {
    const unitW = s.type === "rc" ? 25 : (material_id.includes("glulam") ? 5 : 4.5);
    const b = s.width_mm / 1000;
    const d = s.depth_mm / 1000;
    steps.push({
      label: "Self-weight (DL)",
      expression: `γ × b × d = ${unitW} × ${b.toFixed(3)} × ${d.toFixed(3)}`,
      result: `${u.DL_kNm.toFixed(3)} kN/m`,
      note: "Unit weight of material × cross-section area",
    });
  } else {
    steps.push({
      label: "Self-weight (DL)",
      expression: `mass × g = ${s.mass_kgm ?? "?"} kg/m × 9.81 / 1000`,
      result: `${u.DL_kNm.toFixed(3)} kN/m`,
      note: "Steel beam self-weight from section tables",
    });
  }

  // Step 2 — factored load
  steps.push({
    label: "Factored ULS load (w_Ed)",
    expression: `1.35 × DL + 1.50 × LL = 1.35 × ${u.DL_kNm.toFixed(3)} + 1.50 × ${u.LL_kNm}`,
    result: `${u.w_uls_kNm.toFixed(3)} kN/m`,
    note: "Eurocode load combination for persistent/transient (Eq. 6.10)",
  });

  // Step 3 — M_Ed
  const Med_check = (u.w_uls_kNm * L * L / 8).toFixed(2);
  steps.push({
    label: "Design bending moment (M_Ed)",
    expression: `w_Ed × L² / 8 = ${u.w_uls_kNm.toFixed(3)} × ${L.toFixed(1)}² / 8`,
    result: `${u.M_Ed_kNm} kNm`,
    note: "Maximum sagging moment for simply supported beam with UDL",
  });

  // Step 4 — M_Rd (varies by material)
  if (s.type === "timber") {
    const fm_k = material_id.includes("glulam") ? 28 : 24;
    const kmod = 0.8;
    const gammaM = material_id.includes("glulam") ? 1.25 : 1.3;
    const fm_d = (kmod * fm_k / gammaM).toFixed(2);
    const b = s.width_mm / 1000;
    const d = s.depth_mm / 1000;
    const Z = (b * d * d / 6 * 1e6).toFixed(0);
    steps.push({
      label: "Design bending strength (fm,d)",
      expression: `kmod × fm,k / γM = ${kmod} × ${fm_k},000 / ${gammaM}`,
      result: `${u.fm_d_kNm2 ? (u.fm_d_kNm2 / 1000).toFixed(1) : fm_d} N/mm²`,
      note: `kmod=0.8 (medium-term loading), γM=${gammaM} (${material_id.includes("glulam") ? "glulam" : "sawn timber"})`,
    });
    steps.push({
      label: "Elastic section modulus (Z)",
      expression: `b × d² / 6 = ${s.width_mm} × ${s.depth_mm}² / 6`,
      result: `${Z} cm³`,
      note: "Converts moment capacity from stress to force × distance",
    });
    steps.push({
      label: "Moment capacity (M_Rd)",
      expression: `fm,d × Z`,
      result: `${u.M_Rd_kNm} kNm`,
      note: "EC5 bending capacity of the timber section",
    });
  } else if (s.type === "rc") {
    const fck = material_id === "rc_c40" ? 40 : 30;
    const b = s.width_mm / 1000;
    const d = s.depth_mm / 1000;
    steps.push({
      label: "Moment capacity (M_Rd) — EC2 simplified",
      expression: `0.156 × fck × b × d² = 0.156 × ${fck},000 × ${b.toFixed(1)} × ${d.toFixed(3)}²`,
      result: `${u.M_Rd_kNm} kNm`,
      note: "Balanced section limit (K = 0.156). Assumes sufficient tension reinforcement is provided.",
    });
  } else {
    const fy = material_id === "steel_s355" ? 355 : 275;
    const Z_cm3 = s.Wel_cm3 ?? (s.Z_m3 ? (s.Z_m3 * 1e6).toFixed(0) : "?");
    steps.push({
      label: "Moment capacity (M_Rd) — EC3",
      expression: `fy × Wel / γM0 = ${fy},000 × ${Z_cm3} cm³ / 1.0`,
      result: `${u.M_Rd_kNm} kNm`,
      note: "γM0 = 1.0 for steel cross-section resistance (EC3 Table 6.1)",
    });
  }

  // Step 5 — utilisation
  steps.push({
    label: "Bending utilisation (η_M)",
    expression: `M_Ed / M_Rd = ${u.M_Ed_kNm} / ${u.M_Rd_kNm}`,
    result: `${u.utilisation.toFixed(3)}`,
    note: u.passed ? "η ≤ 1.0 ✓  ULS bending satisfied" : "η > 1.0 ✗  ULS bending FAILS — section too small",
  });

  return steps;
}

function buildSlsSteps(result: CheckResultType): CalcStep[] {
  const { sls_deflection: d, section: s, material_id } = result;
  const limitDiv = parseInt(d.limit_ratio.replace("L/", ""));
  const span = d.delta_limit_mm / 1000 * limitDiv;
  const L = span;
  const steps: CalcStep[] = [];

  // Step 1 — SLS load
  steps.push({
    label: "Characteristic (SLS) load (w_SLS)",
    expression: `DL + LL = ${(d.w_sls_kNm - result.uls_bending.LL_kNm).toFixed(3)} + ${result.uls_bending.LL_kNm}`,
    result: `${d.w_sls_kNm.toFixed(3)} kN/m`,
    note: "Unfactored loads for serviceability — no load factors applied",
  });

  // Step 2 — E and I
  const E_vals: Record<string, string> = {
    timber_c24: "11,000", glulam_gl28h: "12,600",
    rc_c30: "33,000", rc_c40: "35,000",
    steel_s275: "210,000", steel_s355: "210,000",
  };
  const E_N = E_vals[material_id] ?? "?";
  const E_kNm2 = parseFloat(E_N.replace(",", "")) * 1000;

  let I_m4: number;
  let I_label: string;
  if (s.type === "timber" || s.type === "rc") {
    const b = s.width_mm / 1000;
    const dv = s.depth_mm / 1000;
    I_m4 = b * dv * dv * dv / 12;
    I_label = `b × d³ / 12 = ${s.width_mm} × ${s.depth_mm}³ / 12`;
  } else {
    I_m4 = s.I_m4 ?? 0;
    I_label = `From section tables: I = ${(I_m4 * 1e8).toFixed(0)} cm⁴`;
  }
  const I_cm4 = (I_m4 * 1e8).toFixed(0);

  steps.push({
    label: "Young's Modulus (E)",
    expression: `E = ${E_N} N/mm² = ${E_kNm2.toLocaleString()} kN/m²`,
    result: `${E_N} N/mm²`,
    note: s.type === "steel"
      ? "Steel E is constant at 210,000 N/mm² regardless of grade"
      : s.type === "rc"
      ? "Concrete Ecm — mean secant modulus (EC2 Table 3.1)"
      : "Timber mean E (EN 338) — used for deflection checks",
  });

  steps.push({
    label: "Second moment of area (I)",
    expression: I_label,
    result: `${I_cm4} cm⁴`,
    note: "Measures resistance to bending deformation. Scales with d³.",
  });

  // Step 3 — EI product
  const EI = (E_kNm2 * I_m4).toFixed(0);
  steps.push({
    label: "Flexural stiffness (EI)",
    expression: `E × I = ${E_kNm2.toLocaleString()} × ${I_m4.toExponential(3)}`,
    result: `${parseFloat(EI).toLocaleString()} kNm²`,
    note: "Combined stiffness — higher EI means less deflection",
  });

  // Step 4 — deflection
  const delta_calc = (5 * d.w_sls_kNm * Math.pow(L, 4) / (384 * E_kNm2 * I_m4) * 1000).toFixed(2);
  steps.push({
    label: "Maximum deflection (δ)",
    expression: `5 × w × L⁴ / (384 × E × I)  =  5 × ${d.w_sls_kNm.toFixed(3)} × ${L.toFixed(1)}⁴ / (384 × ${E_kNm2.toLocaleString()} × ${I_m4.toExponential(3)})`,
    result: `${d.delta_mm} mm`,
    note: "Mid-span deflection formula for simply supported beam with UDL",
  });

  // Step 5 — limit
  steps.push({
    label: `Deflection limit (${d.limit_ratio})`,
    expression: `L / ${limitDiv} = ${(L * 1000).toFixed(0)} / ${limitDiv}`,
    result: `${d.delta_limit_mm} mm`,
    note: `${limitDiv === 400 ? "L/400 for footbridges (BS EN 1337 / NA)" : "L/600 for highway bridges (BS EN 1337 / NA)"}`,
  });

  // Step 6 — utilisation
  steps.push({
    label: "Deflection utilisation (η_δ)",
    expression: `δ / δ_limit = ${d.delta_mm} / ${d.delta_limit_mm}`,
    result: `${d.utilisation.toFixed(3)}`,
    note: d.passed ? "η ≤ 1.0 ✓  SLS deflection satisfied" : "η > 1.0 ✗  SLS deflection FAILS — beam too flexible",
  });

  return steps;
}

interface Props {
  result: CheckResultType;
  onTryAgain: () => void;
  onNextLevel: () => void;
  hasNextLevel: boolean;
}

export default function CheckResultPanel({ result, onTryAgain, onNextLevel, hasNextLevel }: Props) {
  const [showParams, setShowParams] = useState(false);
  const [showOptimal, setShowOptimal] = useState(true);
  const [showUlsSteps, setShowUlsSteps] = useState(false);
  const [showSlsSteps, setShowSlsSteps] = useState(false);

  const { passed, stars, uls_bending, sls_deflection, educational_insight, hint,
    parameter_explanations, optimal_design, key_concept, section, material_name,
    cost_estimate_gbp } = result;

  const ulsSteps = buildUlsSteps(result);
  const slsSteps = buildSlsSteps(result);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Pass/fail banner */}
      <div className={`rounded-xl border px-6 py-5 text-center
        ${passed
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-red-500/40 bg-red-500/10"
        }`}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          {passed
            ? <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            : <XCircle className="h-6 w-6 text-red-400" />
          }
          <span className={`text-xl font-bold ${passed ? "text-emerald-400" : "text-red-400"}`}>
            {passed ? "Design passes ✓" : "Design fails ✗"}
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          {section.width_mm}×{section.depth_mm}mm {material_name} · Volume {result.volume_m3.toFixed(3)} m³ · Est. cost £{cost_estimate_gbp.toFixed(0)}
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <Star
              key={s}
              className={`h-8 w-8 transition-all duration-500
                ${stars >= s
                  ? "fill-amber-400 text-amber-400 scale-110"
                  : "text-zinc-700"
                }`}
              style={{ transitionDelay: `${(s - 1) * 150}ms` }}
            />
          ))}
        </div>
        {stars === 0 && <p className="mt-2 text-xs text-zinc-500">Fix the failing check to earn stars.</p>}
        {stars === 1 && <p className="mt-2 text-xs text-zinc-500">Passes, but could be more efficient. Try a different depth.</p>}
        {stars === 2 && <p className="mt-2 text-xs text-zinc-500">Good design — decent utilisation ratio.</p>}
        {stars === 3 && <p className="mt-2 text-xs text-zinc-500">Excellent — both checks close to capacity. Efficient design!</p>}
      </div>

      {/* Check cards */}
      <div className="grid grid-cols-2 gap-3">
        <CheckCard
          title="ULS Bending"
          passed={uls_bending.passed}
          rows={[
            { label: "M_Ed (factored)", value: `${uls_bending.M_Ed_kNm} kNm` },
            { label: "M_Rd (capacity)", value: `${uls_bending.M_Rd_kNm} kNm` },
            { label: "Utilisation η", value: uls_bending.utilisation.toFixed(3), highlight: true },
            { label: "Total ULS load", value: `${uls_bending.w_uls_kNm.toFixed(2)} kN/m` },
            { label: "DL (self-weight)", value: `${uls_bending.DL_kNm.toFixed(3)} kN/m` },
            { label: "LL (live load)", value: `${uls_bending.LL_kNm} kN/m` },
          ]}
          steps={ulsSteps}
          showSteps={showUlsSteps}
          onToggleSteps={() => setShowUlsSteps((v) => !v)}
        />
        <CheckCard
          title="SLS Deflection"
          passed={sls_deflection.passed}
          rows={[
            { label: "δ actual", value: `${sls_deflection.delta_mm} mm` },
            { label: `δ limit (${sls_deflection.limit_ratio})`, value: `${sls_deflection.delta_limit_mm} mm` },
            { label: "Utilisation η", value: sls_deflection.utilisation.toFixed(3), highlight: true },
            { label: "SLS load (unfactored)", value: `${sls_deflection.w_sls_kNm.toFixed(2)} kN/m` },
          ]}
          steps={slsSteps}
          showSteps={showSlsSteps}
          onToggleSteps={() => setShowSlsSteps((v) => !v)}
        />
      </div>

      {/* Hint (only when failed) */}
      {!passed && hint && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-1">Hint</p>
          <p className="text-sm text-zinc-300 leading-relaxed">{hint}</p>
        </div>
      )}

      {/* Educational insight */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-1">Engineering insight</p>
        <p className="text-sm text-amber-200/80 leading-relaxed">{educational_insight}</p>
      </div>

      {/* Key concept */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-500 mb-1">Key concept</p>
        <p className="text-sm text-sky-200/80 leading-relaxed">{key_concept}</p>
      </div>

      {/* Optimal design */}
      {optimal_design && (
        <div className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
          <button
            onClick={() => setShowOptimal(!showOptimal)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-800/50 transition-colors"
          >
            <span className="text-sm font-semibold text-zinc-200">
              Optimal Design for this Level
              <span className="ml-2 text-xs font-normal text-zinc-500">
                {optimal_design.width_mm}×{optimal_design.depth_mm}mm {optimal_design.material_name}
              </span>
            </span>
            {showOptimal ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
          </button>
          {showOptimal && (
            <div className="px-5 pb-5 space-y-3 border-t border-zinc-800">
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <OptimalStat label="Section" value={`${optimal_design.width_mm}×${optimal_design.depth_mm}mm`} />
                <OptimalStat label="Material" value={optimal_design.material_name} />
                <OptimalStat label="η_M (bending)" value={optimal_design.uls_bending.utilisation.toFixed(3)} />
                <OptimalStat label="η_δ (deflection)" value={optimal_design.sls_deflection.utilisation.toFixed(3)} />
                <OptimalStat label="Cost estimate" value={`£${optimal_design.cost_gbp.toFixed(0)}`} />
                <OptimalStat label="Stars" value={"★".repeat(optimal_design.stars) + "☆".repeat(3 - optimal_design.stars)} />
              </div>
              <p className="text-sm text-zinc-400 leading-relaxed">{optimal_design.why}</p>
            </div>
          )}
        </div>
      )}

      {/* Parameter explanations */}
      <div className="rounded-xl border border-zinc-700 bg-zinc-900 overflow-hidden">
        <button
          onClick={() => setShowParams(!showParams)}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-zinc-800/50 transition-colors"
        >
          <span className="text-sm font-semibold text-zinc-200">Parameter Explanations</span>
          {showParams ? <ChevronUp className="h-4 w-4 text-zinc-500" /> : <ChevronDown className="h-4 w-4 text-zinc-500" />}
        </button>
        {showParams && (
          <div className="border-t border-zinc-800 divide-y divide-zinc-800">
            {parameter_explanations.map((p, i) => (
              <div key={i} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-sm font-semibold text-zinc-100">{p.param}</span>
                  <span className="text-xs font-mono text-amber-400">{p.value}</span>
                </div>
                <p className="text-xs font-mono text-zinc-500 mb-2">{p.formula}</p>
                <p className="text-sm text-zinc-400 leading-relaxed">{p.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={onTryAgain}
          className="flex-1 rounded-xl border border-zinc-700 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors"
        >
          Try Again
        </button>
        {passed && hasNextLevel && (
          <button
            onClick={onNextLevel}
            className="flex-1 rounded-xl bg-amber-500 py-3 text-sm font-bold text-zinc-950 hover:bg-amber-400 transition-colors"
          >
            Next Level →
          </button>
        )}
        {passed && !hasNextLevel && (
          <button
            onClick={onTryAgain}
            className="flex-1 rounded-xl bg-zinc-700 py-3 text-sm font-semibold text-zinc-300 cursor-default"
          >
            Level Complete ★
          </button>
        )}
      </div>
    </div>
  );
}

function CheckCard({
  title, passed, rows, steps, showSteps, onToggleSteps,
}: {
  title: string;
  passed: boolean;
  rows: { label: string; value: string; highlight?: boolean }[];
  steps: CalcStep[];
  showSteps: boolean;
  onToggleSteps: () => void;
}) {
  const borderColor = passed ? "border-emerald-500/30" : "border-red-500/30";
  const bgColor = passed ? "bg-emerald-500/5" : "bg-red-500/5";
  const stepsBorder = passed ? "border-emerald-500/10" : "border-red-500/10";

  return (
    <div className={`rounded-xl border overflow-hidden ${borderColor} ${bgColor}`}>
      {/* Summary rows */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          {passed
            ? <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
            : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          }
          <span className="text-sm font-semibold text-zinc-100">{title}</span>
        </div>
        <div className="space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex justify-between text-xs">
              <span className="text-zinc-500">{r.label}</span>
              <span className={r.highlight
                ? (passed ? "text-emerald-400 font-mono font-bold" : "text-red-400 font-mono font-bold")
                : "text-zinc-300 font-mono"
              }>
                {r.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Calculation steps toggle */}
      <button
        onClick={onToggleSteps}
        className={`w-full flex items-center justify-between px-4 py-2.5 border-t ${stepsBorder}
          text-xs font-medium transition-colors
          ${showSteps ? "bg-zinc-800/60 text-zinc-300" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"}`}
      >
        <span>Calculation steps</span>
        {showSteps
          ? <ChevronUp className="h-3.5 w-3.5" />
          : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {/* Steps expanded */}
      {showSteps && (
        <div className={`border-t ${stepsBorder} divide-y divide-zinc-800/60`}>
          {steps.map((step, i) => (
            <div key={i} className="px-4 py-3 bg-zinc-900/60">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Step {i + 1} — {step.label}
                </span>
                <span className={`text-xs font-mono font-bold flex-shrink-0
                  ${i === steps.length - 1
                    ? (passed ? "text-emerald-400" : "text-red-400")
                    : "text-amber-400"}`}
                >
                  {step.result}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-300 leading-relaxed break-words mb-1">
                {step.expression}
              </p>
              {step.note && (
                <p className="text-[10px] text-zinc-500 leading-relaxed">{step.note}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OptimalStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-zinc-800 px-2 py-1.5">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="text-xs font-semibold text-zinc-200 font-mono">{value}</p>
    </div>
  );
}
