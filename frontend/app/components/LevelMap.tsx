"use client";

import { useEffect, useState } from "react";
import type { ChallengeLevel } from "@/lib/api";
import { Lock, Star } from "lucide-react";

interface Props {
  levels: ChallengeLevel[];
  onSelectLevel: (level: ChallengeLevel) => void;
}

function getStars(): Record<number, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("bridge_challenge_stars") ?? "{}");
  } catch {
    return {};
  }
}

function getUnlocked(): number[] {
  if (typeof window === "undefined") return [1];
  try {
    return JSON.parse(localStorage.getItem("bridge_challenge_unlocked") ?? "[1]");
  } catch {
    return [1];
  }
}

export default function LevelMap({ levels, onSelectLevel }: Props) {
  const [stars, setStars] = useState<Record<number, number>>({});
  const [unlocked, setUnlocked] = useState<number[]>([1]);

  useEffect(() => {
    setStars(getStars());
    setUnlocked(getUnlocked());
  }, []);

  const difficultyLabel = (d: number) =>
    ["", "Beginner", "Intermediate", "Advanced", "Expert", "Master"][d] ?? "";

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-zinc-100">Bridge Design Challenge</h2>
        <p className="mt-1 text-zinc-400 text-sm">
          Progress through 8 levels — each teaches a new material, load type, or structural concept.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {levels.map((level) => {
          const isUnlocked = unlocked.includes(level.id);
          const levelStars = stars[level.id] ?? 0;
          const isLocked = !isUnlocked;
          const isComingSoon = level.coming_soon;

          return (
            <button
              key={level.id}
              disabled={isLocked || isComingSoon}
              onClick={() => onSelectLevel(level)}
              className={`
                relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center
                transition-all duration-200
                ${isLocked || isComingSoon
                  ? "border-zinc-800 bg-zinc-900/50 cursor-not-allowed opacity-60"
                  : levelStars > 0
                  ? "border-amber-500/40 bg-zinc-900 hover:border-amber-400/60 hover:bg-zinc-800 cursor-pointer"
                  : "border-zinc-700 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800 cursor-pointer animate-pulse-ring"
                }
              `}
            >
              {/* Level number badge */}
              <div className={`
                absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold
                ${isLocked || isComingSoon ? "bg-zinc-700 text-zinc-400" : "bg-amber-500 text-zinc-950"}
              `}>
                {level.id}
              </div>

              {/* Icon */}
              <span className="text-3xl">{level.icon ?? "🌉"}</span>

              {/* Title */}
              <div>
                <p className={`text-sm font-semibold leading-tight ${isLocked || isComingSoon ? "text-zinc-500" : "text-zinc-100"}`}>
                  {level.title}
                </p>
                <p className={`text-xs mt-0.5 ${isLocked || isComingSoon ? "text-zinc-600" : "text-zinc-400"}`}>
                  {level.subtitle}
                </p>
              </div>

              {/* Difficulty */}
              <p className={`text-xs ${isLocked || isComingSoon ? "text-zinc-600" : "text-zinc-500"}`}>
                {difficultyLabel(level.difficulty)}
              </p>

              {/* Stars or lock */}
              {isComingSoon ? (
                <span className="text-xs text-zinc-600 font-medium">Coming soon</span>
              ) : isLocked ? (
                <Lock className="h-4 w-4 text-zinc-600" />
              ) : (
                <div className="flex gap-0.5">
                  {[1, 2, 3].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${levelStars >= s ? "fill-amber-400 text-amber-400" : "text-zinc-700"}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
