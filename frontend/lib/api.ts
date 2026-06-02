const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export type BeamResult = {
  reactions: number[];
  summary: { max_shear: number; max_moment: number; max_deflection?: number };
  diagram_data: { x: number[]; shear: number[]; moment: number[]; deflection?: number[] };
};

export async function calcUDL(payload: { span: number; udl: number; E?: number; I?: number }) {
  const res = await fetch(`${BASE_URL}/beam/udl`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as BeamResult;
}

export async function calcPointLoad(payload: { span: number; point_load: number; E?: number; I?: number }) {
  const res = await fetch(`${BASE_URL}/beam/point-load`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as BeamResult;
}

// ─── Bridge Design Challenge ───────────────────────────────────────────────

export type ChallengeLevel = {
  id: number;
  title: string;
  subtitle?: string;
  location?: string;
  brief?: string;
  span?: number;
  live_load_type?: string;
  live_load_magnitude?: number;
  deflection_limit?: number;
  allowed_materials?: string[];
  budget?: number | null;
  key_concept?: string;
  icon?: string;
  difficulty: number;
  coming_soon: boolean;
};

export type ParameterExplanation = {
  param: string;
  value: string;
  formula: string;
  description: string;
};

export type CheckResultType = {
  level_id: number;
  material_id: string;
  material_name: string;
  passed: boolean;
  stars: number;
  section: {
    type: "timber" | "rc" | "steel";
    width_mm: number;
    depth_mm: number;
    I_m4: number;
    Z_m3: number;
    area_m2: number;
    self_weight_kNm: number;
    // steel-only fields
    section_id?: string;
    mass_kgm?: number;
    Wel_cm3?: number;
  };
  uls_bending: {
    M_Ed_kNm: number;
    M_Rd_kNm: number;
    fm_d_kNm2?: number;   // timber only
    utilisation: number;
    passed: boolean;
    w_uls_kNm: number;
    DL_kNm: number;
    LL_kNm: number;
  };
  sls_deflection: {
    delta_mm: number;
    delta_limit_mm: number;
    limit_ratio: string;
    utilisation: number;
    passed: boolean;
    w_sls_kNm: number;
  };
  cost_estimate_gbp: number;
  volume_m3: number;
  educational_insight: string;
  hint: string;
  parameter_explanations: ParameterExplanation[];
  optimal_design: {
    material_id: string;
    material_name: string;
    depth_mm: number;
    width_mm: number;
    uls_bending: CheckResultType["uls_bending"];
    sls_deflection: CheckResultType["sls_deflection"];
    cost_gbp: number;
    volume_m3: number;
    stars: number;
    why: string;
  } | null;
  key_concept: string;
};

export async function fetchLevels(): Promise<ChallengeLevel[]> {
  const res = await fetch(`${BASE_URL}/challenge/levels`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.levels as ChallengeLevel[];
}

export async function checkDesign(payload: {
  level_id: number;
  material_id: string;
  depth_mm?: number;
  section_id?: string;
}): Promise<CheckResultType> {
  const res = await fetch(`${BASE_URL}/challenge/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return (await res.json()) as CheckResultType;
}