"use client";

import { useState } from "react";
import { calcUDL, calcPointLoad, type BeamResult } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BeamCharts from "@/components/BeamCharts";
import BeamSketch from "@/components/BeamSketch";

type LoadType = "udl" | "point";

export default function BeamPage() {
  const [loadType, setLoadType] = useState<LoadType>("udl");
  const [span, setSpan] = useState(6);
  const [udl, setUdl] = useState(10);
  const [pointLoad, setPointLoad] = useState(20);
  const [E, setE] = useState(210_000_000);
  const [I, setI] = useState(1e-4);

  const [result, setResult] = useState<BeamResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onCalculate() {
    setLoading(true);
    setErr(null);
    try {
      const payloadCommon = { span: Number(span), E: Number(E), I: Number(I) };
      const res =
        loadType === "udl"
          ? await calcUDL({ ...payloadCommon, udl: Number(udl) })
          : await calcPointLoad({ ...payloadCommon, point_load: Number(pointLoad) });
      setResult(res);
    } catch (e: any) {
      setErr(e?.message ?? "Something went wrong");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-3xl font-semibold">Beam Playground</h1>
        <p className="mt-2 text-zinc-300">Pick a beam, add a load, see SFD/BMD/deflection instantly.</p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Span (m)</Label>
                  <Input value={span} onChange={(e) => setSpan(Number(e.target.value))} type="number" />
                </div>

                <div className="space-y-1">
                  <Label>Load type</Label>
                  <Select value={loadType} onValueChange={(v) => setLoadType(v as LoadType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="udl">UDL (kN/m)</SelectItem>
                      <SelectItem value="point">Point load (kN)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loadType === "udl" ? (
                  <div className="space-y-1 col-span-2">
                    <Label>UDL (kN/m)</Label>
                    <Input value={udl} onChange={(e) => setUdl(Number(e.target.value))} type="number" />
                  </div>
                ) : (
                  <div className="space-y-1 col-span-2">
                    <Label>Point load at midspan (kN)</Label>
                    <Input value={pointLoad} onChange={(e) => setPointLoad(Number(e.target.value))} type="number" />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>E (kN/m²)</Label>
                  <Input value={E} onChange={(e) => setE(Number(e.target.value))} type="number" />
                </div>
                <div className="space-y-1">
                  <Label>I (m⁴)</Label>
                  <Input value={I} onChange={(e) => setI(Number(e.target.value))} type="number" />
                </div>
              </div>

              <Button onClick={onCalculate} disabled={loading} className="w-full">
                {loading ? "Calculating..." : "Calculate"}
              </Button>

              {err && <div className="text-sm text-red-300">{err}</div>}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Beam + Supports</CardTitle>
            </CardHeader>
            <CardContent>
              <BeamSketch span={span} loadType={loadType} />
              {result && (
                <div className="mt-4 text-sm text-zinc-200 space-y-1">
                  <div>Reactions: {result.reactions.map((r, i) => `R${i + 1}=${r.toFixed(2)}kN`).join(" • ")}</div>
                  <div>Max shear: {result.summary.max_shear.toFixed(2)} kN</div>
                  <div>Max moment: {result.summary.max_moment.toFixed(2)} kNm</div>
                  {"max_deflection" in result.summary && result.summary.max_deflection !== undefined && (
                    <div>Max deflection: {result.summary.max_deflection.toExponential(3)} m</div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Diagrams</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? <BeamCharts data={result.diagram_data} /> : <div className="text-zinc-300">Run a calculation to see charts.</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}