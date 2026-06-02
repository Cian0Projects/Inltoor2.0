"use client";

import { useEffect, useState } from "react";
import { fetchLevels, type ChallengeLevel, type CheckResultType } from "@/lib/api";
import LevelMap from "./LevelMap";
import ChallengeBrief from "./ChallengeBrief";
import DesignPanel from "./DesignPanel";
import CheckResultPanel from "./CheckResultPanel";
import { BookOpen } from "lucide-react";

type View = "map" | "brief" | "design" | "result";

function saveProgress(levelId: number, stars: number) {
  if (typeof window === "undefined") return;
  try {
    // Save stars
    const starsMap: Record<number, number> = JSON.parse(
      localStorage.getItem("bridge_challenge_stars") ?? "{}"
    );
    starsMap[levelId] = Math.max(starsMap[levelId] ?? 0, stars);
    localStorage.setItem("bridge_challenge_stars", JSON.stringify(starsMap));

    // Unlock next level
    const unlocked: number[] = JSON.parse(
      localStorage.getItem("bridge_challenge_unlocked") ?? "[1]"
    );
    if (stars > 0 && !unlocked.includes(levelId + 1)) {
      unlocked.push(levelId + 1);
      localStorage.setItem("bridge_challenge_unlocked", JSON.stringify(unlocked));
    }
  } catch {
    // localStorage unavailable
  }
}

export default function BridgeChallenge() {
  const [levels, setLevels] = useState<ChallengeLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<ChallengeLevel | null>(null);
  const [result, setResult] = useState<CheckResultType | null>(null);
  const [view, setView] = useState<View>("map");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLevels()
      .then(setLevels)
      .catch((e) => setError(e?.message ?? "Failed to load levels"))
      .finally(() => setLoading(false));
  }, []);

  function handleSelectLevel(level: ChallengeLevel) {
    setSelectedLevel(level);
    setResult(null);
    setView("brief");
  }

  function handleStartDesign() {
    setView("design");
  }

  function handleResult(r: CheckResultType) {
    setResult(r);
    saveProgress(r.level_id, r.stars);
    setView("result");
  }

  function handleTryAgain() {
    setResult(null);
    setView("design");
  }

  function handleNextLevel() {
    if (!selectedLevel) return;
    const nextId = selectedLevel.id + 1;
    const next = levels.find((l) => l.id === nextId && !l.coming_soon);
    if (next) {
      handleSelectLevel(next);
    } else {
      setView("map");
    }
  }

  const hasNextLevel = selectedLevel
    ? levels.some((l) => l.id === selectedLevel.id + 1 && !l.coming_soon)
    : false;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      {/* Header */}
      <div className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
              ← Inltoor
            </a>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-200 font-semibold text-sm">Bridge Challenge</span>
            {selectedLevel && view !== "map" && (
              <>
                <span className="text-zinc-700">/</span>
                <button
                  onClick={() => setView("map")}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors text-sm"
                >
                  Level Map
                </button>
                <span className="text-zinc-700">/</span>
                <span className="text-amber-400 text-sm font-medium">
                  Level {selectedLevel.id}: {selectedLevel.title}
                </span>
              </>
            )}
          </div>
          <a
            href="/learning-hub"
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-800 rounded-lg px-3 py-1.5"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Learning Hub
          </a>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-4 py-8">
        {loading && (
          <div className="text-center py-20 text-zinc-500">Loading levels...</div>
        )}
        {error && (
          <div className="text-center py-20 text-red-400">
            <p className="font-semibold">Failed to load</p>
            <p className="text-sm mt-1">{error}</p>
            <p className="text-sm mt-2 text-zinc-500">Make sure the backend is running on port 8000.</p>
          </div>
        )}

        {!loading && !error && (
          <>
            {view === "map" && (
              <LevelMap levels={levels} onSelectLevel={handleSelectLevel} />
            )}
            {view === "brief" && selectedLevel && (
              <div className="flex justify-center">
                <ChallengeBrief
                  level={selectedLevel}
                  onStart={handleStartDesign}
                  onBack={() => setView("map")}
                />
              </div>
            )}
            {view === "design" && selectedLevel && (
              <DesignPanel
                level={selectedLevel}
                onResult={handleResult}
                onBack={() => setView("brief")}
              />
            )}
            {view === "result" && result && (
              <CheckResultPanel
                result={result}
                onTryAgain={handleTryAgain}
                onNextLevel={handleNextLevel}
                hasNextLevel={hasNextLevel}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
