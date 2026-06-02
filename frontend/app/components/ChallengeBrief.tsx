"use client";

import type { ChallengeLevel } from "@/lib/api";
import { ArrowRight, Zap, Ruler, FlaskConical } from "lucide-react";

const MATERIAL_LABELS: Record<string, string> = {
  timber_c24: "C24 Sawn Timber",
  glulam_gl28h: "GL28h Glulam",
  rc_c30: "RC C30/37",
  rc_c40: "RC C40/50",
  steel_s275: "Steel S275",
  steel_s355: "Steel S355",
  precast_c50: "Precast C50",
};

const BANNER_GRADIENTS: Record<number, string> = {
  1: "from-emerald-900/60 to-green-950/80",
  2: "from-slate-800/60 to-gray-950/80",
  3: "from-sky-900/60 to-blue-950/80",
  4: "from-cyan-900/60 to-teal-950/80",
  5: "from-violet-900/60 to-purple-950/80",
  6: "from-indigo-900/60 to-slate-950/80",
  7: "from-lime-900/60 to-green-950/80",
  8: "from-amber-900/60 to-orange-950/80",
};

interface Props {
  level: ChallengeLevel;
  onStart: () => void;
  onBack: () => void;
}

export default function ChallengeBrief({ level, onStart, onBack }: Props) {
  const gradient = BANNER_GRADIENTS[level.id] ?? "from-zinc-800 to-zinc-950";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Banner */}
      <div className={`rounded-t-xl bg-gradient-to-br ${gradient} border border-zinc-700 p-8 text-center`}>
        <span className="text-5xl">{level.icon ?? "🌉"}</span>
        <h2 className="mt-3 text-xl font-bold text-zinc-100">{level.title}</h2>
        <p className="text-zinc-400 text-sm">{level.subtitle}</p>
        {level.location && (
          <p className="mt-1 text-xs text-zinc-500">📍 {level.location}</p>
        )}
      </div>

      {/* Brief */}
      <div className="border-x border-zinc-700 bg-zinc-900 px-6 py-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Project Brief</h3>
        <p className="text-sm text-zinc-300 leading-relaxed">{level.brief}</p>
      </div>

      {/* Constraint chips */}
      <div className="border-x border-zinc-700 bg-zinc-900/80 px-6 pb-5">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-3 pt-4">Constraints</h3>
        <div className="flex flex-wrap gap-2">
          {level.span !== undefined && (
            <Chip icon={<Ruler className="h-3 w-3" />} label={`Span: ${level.span} m`} />
          )}
          {level.live_load_magnitude !== undefined && (
            <Chip
              icon={<Zap className="h-3 w-3" />}
              label={`Live load: ${level.live_load_magnitude} kN/m (${level.live_load_type === "udl" ? "UDL" : "point"})`}
            />
          )}
          {level.deflection_limit !== undefined && (
            <Chip icon={<span className="text-xs">δ</span>} label={`Deflection limit: L/${level.deflection_limit}`} />
          )}
          {level.allowed_materials && level.allowed_materials.map((m) => (
            <Chip
              key={m}
              icon={<FlaskConical className="h-3 w-3" />}
              label={MATERIAL_LABELS[m] ?? m}
              variant="material"
            />
          ))}
        </div>
      </div>

      {/* Key concept */}
      {level.key_concept && (
        <div className="border-x border-zinc-700 bg-amber-500/5 px-6 py-4">
          <p className="text-xs text-amber-400 font-semibold uppercase tracking-widest mb-1">What you&apos;ll learn</p>
          <p className="text-sm text-amber-200/80 leading-relaxed">{level.key_concept}</p>
        </div>
      )}

      {/* Actions */}
      <div className="rounded-b-xl border border-zinc-700 bg-zinc-900 px-6 py-4 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 rounded-lg border border-zinc-700 py-2.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          Back to Map
        </button>
        <button
          onClick={onStart}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-400 transition-colors"
        >
          Start Design <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Chip({
  icon,
  label,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "default" | "material";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium
        ${variant === "material"
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
          : "bg-zinc-800 text-zinc-300 border border-zinc-700"
        }`}
    >
      {icon}
      {label}
    </span>
  );
}
