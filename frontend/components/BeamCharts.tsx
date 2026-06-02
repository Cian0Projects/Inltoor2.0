"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function toSeries(x: number[], y: number[], name: string) {
  return x.map((xi, i) => ({ x: xi, y: y[i], name }));
}

function Chart({ title, series }: { title: string; series: { x: number; y: number }[] }) {
  return (
    <div className="mb-8">
      <div className="mb-2 text-sm text-zinc-200">{title}</div>
      <div className="h-64 w-full rounded-lg bg-zinc-950 border border-zinc-800">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="x" stroke="#a1a1aa" tick={{ fontSize: 12 }} />
            <YAxis stroke="#a1a1aa" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a", color: "#e4e4e7" }} />
            <Line type="monotone" dataKey="y" stroke="#22c55e" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function BeamCharts({
  data,
}: {
  data: { x: number[]; shear: number[]; moment: number[]; deflection?: number[] };
}) {
  const sfd = toSeries(data.x, data.shear, "SFD");
  const bmd = toSeries(data.x, data.moment, "BMD");
  const defl = data.deflection ? toSeries(data.x, data.deflection, "Deflection") : null;

  return (
    <div>
      <Chart title="Shear Force Diagram (kN)" series={sfd} />
      <Chart title="Bending Moment Diagram (kNm)" series={bmd} />
      {defl && <Chart title="Deflection (m)" series={defl} />}
    </div>
  );
}