"""
Bridge Design Challenge — ULS/SLS checker (Levels 1-3).
Supports timber (EC5), RC (EC2 simplified), and steel UB (EC3).
"""
from __future__ import annotations
from app.calculations.beam import simply_supported_beam_udl
from app.constants.materials import MATERIALS
from app.constants.challenge_levels import LEVELS_BY_ID


# ---------------------------------------------------------------------------
# Section builders — return a normalised section dict
# ---------------------------------------------------------------------------

def _timber_section(material: dict, depth_mm: int) -> dict:
    w = material["default_width_mm"] / 1000
    d = depth_mm / 1000
    I = w * d ** 3 / 12
    Z = w * d ** 2 / 6
    A = w * d
    return {
        "type": "timber",
        "width_mm": material["default_width_mm"],
        "depth_mm": depth_mm,
        "I_m4": I,
        "Z_m3": Z,
        "area_m2": A,
        "self_weight_kNm": material["unit_weight"] * A,
    }


def _rc_section(material: dict, depth_mm: int) -> dict:
    b = material["default_width_m"]          # 1.0 m wide strip
    d = depth_mm / 1000
    I = b * d ** 3 / 12
    Z = b * d ** 2 / 6
    A = b * d
    return {
        "type": "rc",
        "width_mm": int(b * 1000),
        "depth_mm": depth_mm,
        "I_m4": I,
        "Z_m3": Z,
        "area_m2": A,
        "self_weight_kNm": material["unit_weight"] * A,
    }


def _steel_section(material: dict, section_id: str) -> dict:
    secs = {s["id"]: s for s in material["available_sections"]}
    if section_id not in secs:
        raise ValueError(f"Unknown steel section '{section_id}' for {material['id']}")
    s = secs[section_id]
    I_m4 = s["I_cm4"] * 1e-8       # cm⁴ → m⁴
    Z_m3 = s["Wel_cm3"] * 1e-6     # cm³ → m³
    A_m2 = s["area_cm2"] * 1e-4    # cm² → m²
    return {
        "type": "steel",
        "section_id": section_id,
        "depth_mm": s["depth_mm"],
        "mass_kgm": s["mass_kgm"],
        "I_m4": I_m4,
        "Z_m3": Z_m3,
        "area_m2": A_m2,
        "self_weight_kNm": s["mass_kgm"] * 9.81 / 1000,  # kg/m → kN/m
    }


# ---------------------------------------------------------------------------
# Bending capacity
# ---------------------------------------------------------------------------

def _bending_capacity(material: dict, section: dict) -> dict:
    cat = material.get("category", "timber")

    if cat == "timber":
        fm_d = material["kmod"] * material["fm_k"] / material["gamma_M"]
        M_Rd = fm_d * section["Z_m3"]
        return {"M_Rd_kNm": M_Rd, "fm_d_kNm2": fm_d}

    if cat == "rc":
        # EC2 simplified: M_Rd = 0.156 * fck * b * d²
        fck = material["fck"]
        b = material["default_width_m"]
        d = section["depth_mm"] / 1000
        M_Rd = 0.156 * fck * b * d ** 2
        return {"M_Rd_kNm": M_Rd, "fck_kNm2": fck}

    if cat == "steel":
        # EC3: M_Rd = fy * Wel / gamma_M0
        fy = material["fy"]
        M_Rd = fy * section["Z_m3"] / material["gamma_M0"]
        return {"M_Rd_kNm": M_Rd, "fy_kNm2": fy}

    raise ValueError(f"Unknown material category: {cat}")


# ---------------------------------------------------------------------------
# Core check runner
# ---------------------------------------------------------------------------

def _run_checks(level: dict, material: dict, section: dict) -> dict:
    span = level["span"]
    LL = level["live_load_magnitude"]
    DL = section["self_weight_kNm"]
    DL_fac = level["load_factors"]["DL"]
    LL_fac = level["load_factors"]["LL"]

    w_uls = DL_fac * DL + LL_fac * LL
    uls_beam = simply_supported_beam_udl(span, w_uls, E=material["E"], I=section["I_m4"])
    M_Ed = uls_beam["summary"]["max_moment"]

    cap = _bending_capacity(material, section)
    M_Rd = cap["M_Rd_kNm"]
    eta_M = M_Ed / M_Rd if M_Rd > 0 else float("inf")

    w_sls = DL + LL
    sls_beam = simply_supported_beam_udl(span, w_sls, E=material["E"], I=section["I_m4"])
    delta = abs(sls_beam["summary"]["max_deflection"])
    delta_limit = span / level["deflection_limit"]
    eta_delta = delta / delta_limit if delta_limit > 0 else float("inf")

    uls_pass = eta_M <= 1.0
    sls_pass = eta_delta <= 1.0

    result = {
        "passed": uls_pass and sls_pass,
        "uls_bending": {
            "M_Ed_kNm": round(M_Ed, 2),
            "M_Rd_kNm": round(M_Rd, 2),
            "utilisation": round(eta_M, 3),
            "passed": uls_pass,
            "w_uls_kNm": round(w_uls, 3),
            "DL_kNm": round(DL, 3),
            "LL_kNm": round(LL, 3),
        },
        "sls_deflection": {
            "delta_mm": round(delta * 1000, 2),
            "delta_limit_mm": round(delta_limit * 1000, 2),
            "limit_ratio": f"L/{level['deflection_limit']}",
            "utilisation": round(eta_delta, 3),
            "passed": sls_pass,
            "w_sls_kNm": round(w_sls, 3),
        },
    }
    # Carry capacity extras for educational use
    result["uls_bending"].update({k: round(v, 0) if isinstance(v, float) else v
                                   for k, v in cap.items() if k != "M_Rd_kNm"})
    return result


# ---------------------------------------------------------------------------
# Optimal design finder
# ---------------------------------------------------------------------------

def _iter_sections(level: dict):
    """Yield (mat_id, material, section) for every candidate in the level."""
    for mat_id in level["allowed_materials"]:
        if mat_id not in MATERIALS:
            continue
        mat = MATERIALS[mat_id]
        cat = mat.get("category", "timber")
        if cat == "timber" and "available_depths_mm" in mat:
            for d in mat["available_depths_mm"]:
                yield mat_id, mat, _timber_section(mat, d)
        elif cat == "rc" and "available_depths_mm" in mat:
            for d in mat["available_depths_mm"]:
                yield mat_id, mat, _rc_section(mat, d)
        elif cat == "steel" and "available_sections" in mat:
            for s in mat["available_sections"]:
                yield mat_id, mat, _steel_section(mat, s["id"])


def _find_optimal(level: dict) -> dict | None:
    best = None
    best_score = -1.0
    for mat_id, mat, sec in _iter_sections(level):
        checks = _run_checks(level, mat, sec)
        if not checks["passed"]:
            continue
        score = min(checks["uls_bending"]["utilisation"], checks["sls_deflection"]["utilisation"])
        if score > best_score:
            best_score = score
            best = {"material_id": mat_id, "material_name": mat["name"],
                    "section": sec, **checks}
    return best


# ---------------------------------------------------------------------------
# Cost estimate
# ---------------------------------------------------------------------------

def _cost(material: dict, section: dict, span: float) -> float:
    cat = material.get("category", "timber")
    vol = section["area_m2"] * span
    if cat == "steel":
        mass_t = section["self_weight_kNm"] / 9.81 * span  # kN/m → kN → kN·m / (kN/kN) ...
        # simpler: mass_kgm * span / 1000 tonnes
        mass_t = section["mass_kgm"] * span / 1000
        return round(mass_t * material["cost_per_tonne"], 2)
    return round(vol * material["cost_per_m3"], 2)


# ---------------------------------------------------------------------------
# Parameter explanations — per material category
# ---------------------------------------------------------------------------

def _parameter_explanations(material: dict, section: dict, checks: dict) -> list[dict]:
    cat = material.get("category", "timber")

    if cat == "timber":
        fm_d = material["kmod"] * material["fm_k"] / material["gamma_M"]
        fm_k_N = material["fm_k"] / 1000
        fm_d_N = fm_d / 1000
        E_N = material["E"] / 1000
        d_mm = section["depth_mm"]
        w_mm = section["width_mm"]
        I = section["I_m4"]
        Z = section["Z_m3"]
        d_next = int(d_mm * 1.25)
        E_note = ("GL28h glulam has ~15% higher E than C24 (12,600 vs 11,000 N/mm²)."
                  if material["id"] == "glulam_gl28h"
                  else "C24 has lower E than glulam (11,000 vs 12,600 N/mm²).")
        return [
            {"param": "E — Young's Modulus", "value": f"{E_N:,.0f} N/mm²",
             "formula": "Deflection = 5wL⁴ / (384 E I)",
             "description": f"Stiffness of the material. Higher E → less deflection. {E_note} Cannot be changed by resizing the section."},
            {"param": "fm,d — Design Bending Strength", "value": f"{fm_d_N:.1f} N/mm²",
             "formula": f"fm,d = kmod × fm,k / γM = {material['kmod']} × {fm_k_N:.0f} / {material['gamma_M']} = {fm_d_N:.1f} N/mm²",
             "description": f"Allowable bending stress after applying duration and safety factors. M_Rd = fm,d × Z."},
            {"param": "I — Second Moment of Area", "value": f"{I:.3e} m⁴",
             "formula": f"I = b × d³ / 12  ({w_mm}mm × {d_mm}³ / 12)",
             "description": f"Controls deflection stiffness. Scales with depth³ — increasing from {d_mm}mm to {d_next}mm multiplies I by {(d_next/d_mm)**3:.1f}×."},
            {"param": "Z — Elastic Section Modulus", "value": f"{Z*1e6:.0f} cm³",
             "formula": f"Z = b × d² / 6  ({w_mm}mm × {d_mm}² / 6)",
             "description": "Determines bending capacity: M_Rd = fm,d × Z. Scales with depth²."},
            {"param": "kmod — Load Duration Factor", "value": f"{material['kmod']}",
             "formula": "EC5 Table 3.1: medium-term load → kmod = 0.8",
             "description": "Timber weakens under sustained load. kmod = 0.8 for medium-term; 0.6 for permanent; 1.1 for instantaneous (wind)."},
            {"param": "γM — Material Partial Factor", "value": f"{material['gamma_M']}",
             "formula": f"EC5 Table 2.3: {'Glulam' if material['id']=='glulam_gl28h' else 'Sawn timber'} → γM = {material['gamma_M']}",
             "description": f"Safety factor on material strength. Glulam (1.25) is lower than sawn timber (1.3) due to better quality control."},
        ]

    if cat == "rc":
        fck = material["fck"]
        fck_N = fck / 1000
        E_N = material["E"] / 1000
        d_mm = section["depth_mm"]
        b_m = material["default_width_m"]
        M_Rd = checks["uls_bending"]["M_Rd_kNm"]
        sw = section["self_weight_kNm"]
        return [
            {"param": "E — Young's Modulus (concrete)", "value": f"{E_N:,.0f} N/mm²",
             "formula": "Deflection = 5wL⁴ / (384 E I)",
             "description": f"Concrete's E ({E_N:.0f} MPa) is ~3× stiffer than timber but 6× less stiff than steel. It controls SLS deflection."},
            {"param": "fck — Characteristic Cylinder Strength", "value": f"{fck_N:.0f} N/mm²",
             "formula": "EC2: fck is the strength exceeded by 95% of tested cylinders",
             "description": f"The concrete compressive strength grade. C40 (fck=40 N/mm²) gives 33% more capacity than C30 (fck=30 N/mm²) for the same section."},
            {"param": "M_Rd — Moment Capacity (EC2 simplified)", "value": f"{M_Rd:.1f} kNm",
             "formula": "M_Rd = 0.156 × fck × b × d²",
             "description": f"EC2 balanced-section limit. With b={b_m:.1f}m and d={d_mm}mm: M_Rd = 0.156 × {fck_N:.0f} × {b_m:.1f} × {d_mm/1000:.3f}² = {M_Rd:.1f} kNm. Scales with d² — doubling depth quadruples capacity."},
            {"param": "Self-weight", "value": f"{sw:.2f} kN/m",
             "formula": f"SW = 25 kN/m³ × {b_m:.1f}m × {d_mm/1000:.3f}m",
             "description": f"Concrete self-weight ({sw:.2f} kN/m) is a major proportion of total load. As you increase depth to gain capacity, you also increase self-weight — the extra load partially offsets the capacity gain."},
            {"param": "γc — Concrete Partial Factor", "value": "1.5",
             "formula": "EC2 Table 2.1N: persistent/transient → γc = 1.5",
             "description": "The 0.156 coefficient in M_Rd already incorporates γc = 1.5 for concrete and assumes balanced failure (neutral axis at 0.45d). This is a simplified design approach."},
            {"param": "I — Second Moment of Area", "value": f"{section['I_m4']:.3e} m⁴",
             "formula": f"I = b × d³ / 12 = {b_m:.1f} × {d_mm}³ / 12",
             "description": "Controls deflection. Scales with depth³. The same d³ relationship as timber — a deeper slab is dramatically stiffer."},
        ]

    if cat == "steel":
        fy_N = material["fy"] / 1000
        E_N = material["E"] / 1000
        sec_id = section.get("section_id", "")
        M_Rd = checks["uls_bending"]["M_Rd_kNm"]
        sw = section["self_weight_kNm"]
        Z_cm3 = section["Z_m3"] * 1e6
        I_cm4 = section["I_m4"] * 1e8
        return [
            {"param": "E — Young's Modulus (steel)", "value": f"{E_N:,.0f} N/mm²",
             "formula": "Deflection = 5wL⁴ / (384 E I)",
             "description": f"Steel's E (210,000 N/mm²) is ~19× greater than C30 concrete and ~19× greater than timber. This is why steel beams deflect far less than RC or timber for the same section depth."},
            {"param": "fy — Yield Strength", "value": f"{fy_N:.0f} N/mm²",
             "formula": f"EC3: fy = {fy_N:.0f} N/mm² for {'S355' if material['id']=='steel_s355' else 'S275'} (t ≤ 16mm)",
             "description": f"The stress at which steel yields (permanently deforms). S355 has 29% higher fy than S275 ({355} vs {275} N/mm²), giving proportionally more moment capacity for the same section."},
            {"param": "Wel — Elastic Section Modulus", "value": f"{Z_cm3:.0f} cm³",
             "formula": "M_Rd = fy × Wel / γM0",
             "description": f"For UB sections, Wel is determined by the section catalogue — it's not simply b×d²/6. The I-shaped profile concentrates material in the flanges (far from neutral axis) to maximise Wel for a given weight. {sec_id}: Wel = {Z_cm3:.0f} cm³ → M_Rd = {M_Rd:.1f} kNm."},
            {"param": "I — Second Moment of Area", "value": f"{I_cm4:.0f} cm⁴",
             "formula": "From section tables (not b×d³/12 — UB shape)",
             "description": f"For a UB, I is much larger than a solid rectangle of the same depth and weight, because the flanges carry most of the bending. {sec_id}: I = {I_cm4:.0f} cm⁴."},
            {"param": "γM0 — Steel Partial Factor", "value": "1.0",
             "formula": "EC3 Table 6.1: γM0 = 1.0 for cross-section resistance",
             "description": "Unlike concrete (γc = 1.5) or timber (γM = 1.25–1.3), steel uses γM0 = 1.0 for cross-section checks. Steel's consistency and ductility mean less uncertainty in its properties."},
            {"param": "Self-weight", "value": f"{sw:.3f} kN/m",
             "formula": f"SW = mass × g = {section.get('mass_kgm', '?')} kg/m × 9.81 / 1000",
             "description": f"Steel self-weight ({sw:.3f} kN/m) is typically 5–15% of the total design load — far less than RC. This is the key weight advantage of steel at longer spans."},
        ]

    return []


# ---------------------------------------------------------------------------
# Educational text generators
# ---------------------------------------------------------------------------

def _generate_hint(level: dict, material: dict, section: dict, checks: dict) -> str:
    cat = material.get("category", "timber")

    if not checks["uls_bending"]["passed"]:
        eta = checks["uls_bending"]["utilisation"]
        M_Ed = checks["uls_bending"]["M_Ed_kNm"]
        M_Rd = checks["uls_bending"]["M_Rd_kNm"]
        if cat == "timber":
            d_mm = section["depth_mm"]
            depths = material.get("available_depths_mm", [])
            next_d = next((d for d in depths if d > d_mm), None)
            nxt = f"Try {material['default_width_mm']}×{next_d}mm. " if next_d else ""
            return (f"Bending fails (η = {eta:.2f}). M_Ed = {M_Ed:.1f} kNm > M_Rd = {M_Rd:.1f} kNm. "
                    f"{nxt}M_Rd = fm,d × Z scales with depth², so going deeper helps significantly.")
        if cat == "rc":
            d_mm = section["depth_mm"]
            depths = material.get("available_depths_mm", [])
            next_d = next((d for d in depths if d > d_mm), None)
            nxt = f"Try {next_d}mm depth. " if next_d else ""
            alt = "C40" if material["id"] == "rc_c30" else ""
            alt_text = f" Or switch to {alt} concrete for 33% more capacity." if alt else ""
            return (f"Bending fails (η = {eta:.2f}). M_Ed = {M_Ed:.1f} kNm > M_Rd = {M_Rd:.1f} kNm. "
                    f"{nxt}M_Rd = 0.156 × fck × b × d² — capacity scales with d².{alt_text}")
        if cat == "steel":
            secs = material.get("available_sections", [])
            current_idx = next((i for i, s in enumerate(secs)
                                if s["id"] == section.get("section_id")), -1)
            next_sec = secs[current_idx + 1]["id"] if current_idx >= 0 and current_idx + 1 < len(secs) else None
            nxt = f"Try {next_sec}. " if next_sec else ""
            alt = "S355" if material["id"] == "steel_s275" else ""
            alt_text = f" Or switch to {alt} for 29% more fy." if alt else ""
            return (f"Bending fails (η = {eta:.2f}). M_Ed = {M_Ed:.1f} kNm > M_Rd = {M_Rd:.1f} kNm. "
                    f"{nxt}Choose a deeper/heavier UB section with higher Wel.{alt_text}")

    if not checks["sls_deflection"]["passed"]:
        eta = checks["sls_deflection"]["utilisation"]
        delta = checks["sls_deflection"]["delta_mm"]
        limit = checks["sls_deflection"]["delta_limit_mm"]
        ratio = checks["sls_deflection"]["limit_ratio"]
        if cat == "timber":
            d_mm = section["depth_mm"]
            depths = material.get("available_depths_mm", [])
            next_d = next((d for d in depths if d > d_mm), None)
            nxt = f"Try {next_d}mm (I increases by {(next_d/d_mm)**3:.1f}×). " if next_d else ""
            return (f"Deflection fails (η = {eta:.2f}). δ = {delta:.1f}mm > {ratio} = {limit:.1f}mm. "
                    f"{nxt}Stiffness EI ∝ d³ so increasing depth dramatically reduces deflection.")
        if cat == "rc":
            d_mm = section["depth_mm"]
            depths = material.get("available_depths_mm", [])
            next_d = next((d for d in depths if d > d_mm), None)
            nxt = f"Try {next_d}mm. " if next_d else ""
            alt = "C40 (E=35 GPa vs 33 GPa)" if material["id"] == "rc_c30" else ""
            return (f"Deflection fails (η = {eta:.2f}). δ = {delta:.1f}mm > {ratio} = {limit:.1f}mm. "
                    f"{nxt}Stiffness = E × I ∝ d³. Note: RC has relatively low E vs steel — "
                    f"deflection governs many RC bridge designs.{' Try ' + alt + ' for marginally more stiffness.' if alt else ''}")
        if cat == "steel":
            secs = material.get("available_sections", [])
            current_idx = next((i for i, s in enumerate(secs)
                                if s["id"] == section.get("section_id")), -1)
            next_sec = secs[current_idx + 1]["id"] if current_idx >= 0 and current_idx + 1 < len(secs) else None
            nxt = f"Try {next_sec} (larger I). " if next_sec else ""
            return (f"Deflection fails (η = {eta:.2f}). δ = {delta:.1f}mm > {ratio} = {limit:.1f}mm. "
                    f"{nxt}For steel, deflection is often the governing check at longer spans despite "
                    f"high E — I must be large enough.")
    return ""


def _generate_educational_insight(level: dict, material: dict, section: dict, checks: dict) -> str:
    cat = material.get("category", "timber")
    eta_M = checks["uls_bending"]["utilisation"]
    eta_d = checks["sls_deflection"]["utilisation"]
    passed = checks["passed"]

    if cat == "timber":
        if not passed:
            if not checks["sls_deflection"]["passed"]:
                return (f"Passes ULS bending (η={eta_M:.2f}) but fails SLS deflection (η={eta_d:.2f}). "
                        "Classic timber result: strong enough but too flexible. Deflection ∝ 1/I ∝ 1/d³ — go deeper.")
            return (f"Fails ULS bending (η={eta_M:.2f}). Increase depth: M_Rd = fm,d × Z scales with d².")
        critical = "deflection" if eta_d >= eta_M else "bending"
        return (f"Design passes. {critical.title()} governs (η_M={eta_M:.2f}, η_δ={eta_d:.2f}). "
                "Deflection governing is typical for timber — timber's low E (11–13 GPa) means "
                "stiffness controls the design more often than strength.")

    if cat == "rc":
        sw = section["self_weight_kNm"]
        ll = level["live_load_magnitude"]
        sw_pct = round(100 * sw / (sw + ll))
        if not passed:
            if not checks["uls_bending"]["passed"] and not checks["sls_deflection"]["passed"]:
                return (f"Both checks fail. Self-weight is {sw:.1f} kN/m ({sw_pct}% of total load) — "
                        "this is why RC bridges need careful depth optimisation. Go deeper to gain capacity, "
                        "but note that self-weight increases too.")
            if not checks["uls_bending"]["passed"]:
                return (f"Bending fails (η={eta_M:.2f}). M_Rd = 0.156 × fck × b × d² — capacity "
                        "scales with d². Self-weight is {sw:.1f} kN/m ({sw_pct}% of total load).")
            return (f"Deflection fails (η={eta_d:.2f}). RC has relatively low E (33–35 GPa vs 210 GPa steel) — "
                    "deflection often governs RC bridge design. Increase depth or use C40 for slightly higher E.")
        critical = "deflection" if eta_d >= eta_M else "bending"
        return (f"Design passes. {critical.title()} governs (η_M={eta_M:.2f}, η_δ={eta_d:.2f}). "
                f"Self-weight is {sw:.1f} kN/m ({sw_pct}% of total load) — a key reason RC "
                "becomes less efficient than steel at longer spans.")

    if cat == "steel":
        sw = section["self_weight_kNm"]
        ll = level["live_load_magnitude"]
        sw_pct = round(100 * sw / (sw + ll))
        if not passed:
            if not checks["uls_bending"]["passed"]:
                return (f"Bending fails (η={eta_M:.2f}). M_Rd = fy × Wel / γM0. "
                        "Select a UB with higher Wel (deeper or heavier section).")
            return (f"Deflection fails (η={eta_d:.2f}). Despite steel's high E (210 GPa), deflection "
                    "still governs at longer spans if the section lacks sufficient I. Choose a deeper UB.")
        critical = "deflection" if eta_d >= eta_M else "bending"
        return (f"Design passes. {critical.title()} governs (η_M={eta_M:.2f}, η_δ={eta_d:.2f}). "
                f"Steel self-weight is only {sw:.3f} kN/m ({sw_pct}% of total) — far less than "
                "an RC solution of similar capacity, which is the key advantage at this span.")

    return ""


def _generate_why_optimal(level: dict, optimal: dict) -> str:
    mat = MATERIALS[optimal["material_id"]]
    cat = mat.get("category", "timber")
    eta_M = optimal["uls_bending"]["utilisation"]
    eta_d = optimal["sls_deflection"]["utilisation"]
    critical = "SLS deflection" if eta_d >= eta_M else "ULS bending"
    sec = optimal["section"]

    if cat == "timber":
        desc = f"{sec['width_mm']}×{sec['depth_mm']}mm {optimal['material_name']}"
    elif cat == "rc":
        desc = f"{sec['depth_mm']}mm deep RC slab ({optimal['material_name']})"
    else:
        desc = f"{sec.get('section_id','UB')} in {optimal['material_name']}"

    # Cross-material comparison note
    mats_in_level = level["allowed_materials"]
    cats_in_level = {MATERIALS[m].get("category") for m in mats_in_level if m in MATERIALS}
    if len(cats_in_level) > 1:
        comparison = (" Compare this with the other material options — notice how material choice "
                      "affects both the governing check (strength vs deflection) and the self-weight proportion.")
    else:
        comparison = ""

    return (f"{desc} is the most efficient passing design. {critical} governs "
            f"(η_δ={eta_d:.2f}, η_M={eta_M:.2f}). Both utilisations are as high as possible "
            f"without exceeding 1.0, meaning the material is used efficiently.{comparison}")


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------

def check_design(level_id: int, material_id: str, depth_mm: int = 0,
                 section_id: str = "") -> dict:
    """
    Run ULS + SLS checks for a submitted design.
    - Timber/RC: depth_mm selects the section depth.
    - Steel: section_id selects the UB from the catalogue.
    """
    if level_id not in LEVELS_BY_ID:
        raise ValueError(f"Unknown level_id: {level_id}")
    level = LEVELS_BY_ID[level_id]

    if level.get("coming_soon"):
        raise ValueError(f"Level {level_id} is not yet available.")

    if material_id not in MATERIALS:
        raise ValueError(f"Unknown material_id: {material_id!r}")
    if material_id not in level["allowed_materials"]:
        raise ValueError(f"Material {material_id!r} not allowed in Level {level_id}.")

    material = MATERIALS[material_id]
    cat = material.get("category", "timber")

    # Build section
    if cat == "timber":
        if depth_mm not in material.get("available_depths_mm", []):
            raise ValueError(f"depth_mm={depth_mm} not available for {material_id}.")
        section = _timber_section(material, depth_mm)
    elif cat == "rc":
        if depth_mm not in material.get("available_depths_mm", []):
            raise ValueError(f"depth_mm={depth_mm} not available for {material_id}.")
        section = _rc_section(material, depth_mm)
    elif cat == "steel":
        if not section_id:
            raise ValueError("section_id is required for steel materials.")
        section = _steel_section(material, section_id)
    else:
        raise ValueError(f"Unsupported material category: {cat}")

    checks = _run_checks(level, material, section)
    cost_gbp = _cost(material, section, level["span"])

    # Star rating
    star_3 = level.get("star_3_min_eta", 0.60)
    star_2 = level.get("star_2_min_eta", 0.40)
    if checks["passed"]:
        min_eta = min(checks["uls_bending"]["utilisation"], checks["sls_deflection"]["utilisation"])
        stars = 3 if min_eta >= star_3 else 2 if min_eta >= star_2 else 1
    else:
        stars = 0

    # Optimal
    optimal_raw = _find_optimal(level)
    optimal_out = None
    if optimal_raw:
        opt_mat = MATERIALS[optimal_raw["material_id"]]
        opt_cost = _cost(opt_mat, optimal_raw["section"], level["span"])
        min_eta_opt = min(optimal_raw["uls_bending"]["utilisation"],
                          optimal_raw["sls_deflection"]["utilisation"])
        optimal_out = {
            "material_id": optimal_raw["material_id"],
            "material_name": optimal_raw["material_name"],
            "section": optimal_raw["section"],
            "depth_mm": optimal_raw["section"].get("depth_mm", 0),
            "width_mm": optimal_raw["section"].get("width_mm", 0),
            "uls_bending": optimal_raw["uls_bending"],
            "sls_deflection": optimal_raw["sls_deflection"],
            "cost_gbp": opt_cost,
            "volume_m3": round(optimal_raw["section"]["area_m2"] * level["span"], 4),
            "stars": 3 if min_eta_opt >= star_3 else 2 if min_eta_opt >= star_2 else 1,
            "why": _generate_why_optimal(level, optimal_raw),
        }

    hint = (_generate_hint(level, material, section, checks) if not checks["passed"]
            else ("Well done — your design passes! Try other sections or materials to understand "
                  "the trade-offs." if min(checks["uls_bending"]["utilisation"],
                                           checks["sls_deflection"]["utilisation"]) < 0.50 else ""))

    return {
        "level_id": level_id,
        "material_id": material_id,
        "material_name": material["name"],
        "passed": checks["passed"],
        "stars": stars,
        "section": section,
        "uls_bending": checks["uls_bending"],
        "sls_deflection": checks["sls_deflection"],
        "cost_estimate_gbp": cost_gbp,
        "volume_m3": round(section["area_m2"] * level["span"], 4),
        "educational_insight": _generate_educational_insight(level, material, section, checks),
        "hint": hint,
        "parameter_explanations": _parameter_explanations(material, section, checks),
        "optimal_design": optimal_out,
        "key_concept": level.get("key_concept", ""),
    }
