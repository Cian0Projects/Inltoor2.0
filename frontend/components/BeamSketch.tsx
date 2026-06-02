"use client";

export default function BeamSketch({ span, loadType }: { span: number; loadType: "udl" | "point" }) {
  return (
    <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4">
      <svg viewBox="0 0 600 160" className="w-full h-40">
        {/* Beam */}
        <rect x="80" y="70" width="440" height="10" fill="#e4e4e7" />

        {/* Supports (simple supported) */}
        {/* Left pin */}
        <polygon points="110,95 80,95 95,70" fill="#60a5fa" />
        <line x1="70" y1="95" x2="120" y2="95" stroke="#60a5fa" strokeWidth="3" />

        {/* Right roller */}
        <polygon points="520,95 490,95 505,70" fill="#60a5fa" />
        <circle cx="495" cy="104" r="6" fill="#60a5fa" />
        <circle cx="515" cy="104" r="6" fill="#60a5fa" />
        <line x1="480" y1="112" x2="530" y2="112" stroke="#60a5fa" strokeWidth="3" />

        {/* Load */}
        {loadType === "udl" ? (
          <>
            {Array.from({ length: 9 }).map((_, i) => {
              const x = 120 + i * 45;
              return (
                <g key={i}>
                  <line x1={x} y1="30" x2={x} y2="70" stroke="#f97316" strokeWidth="3" />
                  <polygon points={`${x - 6},70 ${x + 6},70 ${x},82`} fill="#f97316" />
                </g>
              );
            })}
            <text x="300" y="25" textAnchor="middle" fill="#fdba74" fontSize="12">
              UDL
            </text>
          </>
        ) : (
          <>
            <line x1="300" y1="25" x2="300" y2="70" stroke="#f97316" strokeWidth="4" />
            <polygon points="292,70 308,70 300,86" fill="#f97316" />
            <text x="300" y="20" textAnchor="middle" fill="#fdba74" fontSize="12">
              Point load
            </text>
          </>
        )}

        {/* Span label */}
        <line x1="80" y1="135" x2="520" y2="135" stroke="#a1a1aa" strokeWidth="2" />
        <line x1="80" y1="128" x2="80" y2="142" stroke="#a1a1aa" strokeWidth="2" />
        <line x1="520" y1="128" x2="520" y2="142" stroke="#a1a1aa" strokeWidth="2" />
        <text x="300" y="152" textAnchor="middle" fill="#a1a1aa" fontSize="12">
          L = {Number(span).toFixed(2)} m
        </text>
      </svg>
    </div>
  );
}
