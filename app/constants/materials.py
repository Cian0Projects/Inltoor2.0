# Material properties for the Bridge Design Challenge.
# All stress values in kN/m², stiffness in kN/m², weight in kN/m³, cost in £/m³.

MATERIALS: dict = {
    "timber_c24": {
        "id": "timber_c24",
        "name": "Sawn Timber C24",
        "short_name": "C24 Timber",
        "category": "timber",
        # Mechanical properties (EN 338)
        "E": 11_000_000,          # kN/m² mean Young's modulus (11,000 N/mm²)
        "fm_k": 24_000,            # kN/m² characteristic bending strength
        "unit_weight": 4.5,        # kN/m³ (≈ 460 kg/m³ mean density)
        # Partial factors (EC5)
        "kmod": 0.8,               # load-duration factor: medium-term, service class 1
        "gamma_M": 1.3,            # material partial factor for sawn timber
        # Section geometry options
        "default_width_mm": 150,
        "available_depths_mm": [200, 250, 300, 350, 400],
        # Cost & carbon
        "cost_per_m3": 600,        # £/m³ (supply only)
        "carbon_kg_m3": 170,       # kgCO₂e/m³
        "description": (
            "Traditional structural sawn softwood (typically Norway spruce or Scots pine). "
            "Widely available across Europe and Ireland. Lower cost than engineered timber, "
            "but natural variability means larger safety factors are applied. Suitable for "
            "short-span structures and rural settings."
        ),
        "pros": ["Low cost", "Widely available", "Low carbon", "Natural aesthetic"],
        "cons": ["Lower E and strength than glulam", "Size limitations", "Natural variability"],
    },

    "glulam_gl28h": {
        "id": "glulam_gl28h",
        "name": "GL28h Glulam",
        "short_name": "GL28h Glulam",
        "category": "timber",
        # Mechanical properties (EN 14080)
        "E": 12_600_000,           # kN/m² mean Young's modulus (12,600 N/mm²)
        "fm_k": 28_000,            # kN/m² characteristic bending strength
        "unit_weight": 5.0,        # kN/m³ (≈ 500 kg/m³)
        # Partial factors (EC5)
        "kmod": 0.8,               # medium-term, service class 1
        "gamma_M": 1.25,           # material partial factor for glulam
        # Section geometry options
        "default_width_mm": 160,
        "available_depths_mm": [200, 240, 280, 320, 360, 400],
        # Cost & carbon
        "cost_per_m3": 900,        # £/m³
        "carbon_kg_m3": 220,       # kgCO₂e/m³
        "description": (
            "Glued Laminated Timber (Glulam) is an engineered product made by bonding multiple "
            "timber laminations under controlled conditions. The result is a highly consistent, "
            "high-performance structural element available in virtually any size or shape. "
            "Widely used for long-span roofs, bridges, and architecturally exposed structures."
        ),
        "pros": ["Higher E and strength than C24", "Consistent quality", "Any size/length", "Good aesthetics"],
        "cons": ["Higher cost than sawn timber", "Requires specialist manufacture"],
    },

    "rc_c30": {
        "id": "rc_c30",
        "name": "Reinforced Concrete C30/37",
        "short_name": "RC C30/37",
        "category": "rc",
        "E": 33_000_000,           # kN/m² (Ecm for C30/37)
        "fck": 30_000,             # kN/m² characteristic cylinder strength
        "fyk": 500_000,            # kN/m² reinforcement yield (B500B)
        "unit_weight": 25.0,       # kN/m³
        "gamma_c": 1.5,
        "gamma_s": 1.15,
        "default_width_m": 1.0,    # 1.0m wide slab strip (per metre)
        "available_depths_mm": [300, 400, 500, 600, 700, 800],
        "cost_per_m3": 350,
        "carbon_kg_m3": 300,
        "description": (
            "C30/37 is a standard structural concrete grade (30 MPa cylinder / 37 MPa cube strength). "
            "Reinforced concrete (RC) is one of the most widely used structural materials globally — "
            "concrete handles compression while steel reinforcement carries tension. Economical for "
            "short to medium spans. Heavier than timber or steel, which increases self-weight significantly."
        ),
        "pros": ["Durable and low maintenance", "Economical for road bridges", "Good fire resistance", "Locally available"],
        "cons": ["High self-weight", "Requires formwork and curing time", "High embodied carbon", "Brittle in tension"],
    },

    "rc_c40": {
        "id": "rc_c40",
        "name": "Reinforced Concrete C40/50",
        "short_name": "RC C40/50",
        "category": "rc",
        "E": 35_000_000,           # kN/m²
        "fck": 40_000,             # kN/m²
        "fyk": 500_000,            # kN/m²
        "unit_weight": 25.0,       # kN/m³
        "gamma_c": 1.5,
        "gamma_s": 1.15,
        "default_width_m": 1.0,
        "available_depths_mm": [300, 400, 500, 600, 700, 800],
        "cost_per_m3": 420,
        "carbon_kg_m3": 320,
        "description": (
            "C40/50 is a higher-strength concrete grade used where span, loading, or durability "
            "demands require more capacity. The higher fck allows thinner sections for the same "
            "moment, but the cost and embodied carbon are moderately higher than C30/37."
        ),
        "pros": ["Higher strength than C30 — thinner slabs possible", "Better durability", "Good for heavier loads"],
        "cons": ["More expensive than C30", "Higher carbon per m³", "Still heavy"],
    },

    "steel_s275": {
        "id": "steel_s275",
        "name": "Steel S275 Universal Beam",
        "short_name": "Steel S275",
        "category": "steel",
        "E": 210_000_000,          # kN/m²
        "fy": 275_000,             # kN/m² yield strength
        "unit_weight": 78.5,       # kN/m³
        "gamma_M0": 1.0,
        "available_sections": [
            {"id": "UB 406x178x60",  "depth_mm": 406, "mass_kgm": 60,  "I_cm4": 21500,  "Wel_cm3": 1060,  "area_cm2": 76.5},
            {"id": "UB 457x191x74",  "depth_mm": 457, "mass_kgm": 74,  "I_cm4": 33300,  "Wel_cm3": 1460,  "area_cm2": 94.6},
            {"id": "UB 533x210x101", "depth_mm": 536, "mass_kgm": 101, "I_cm4": 61500,  "Wel_cm3": 2290,  "area_cm2": 129},
            {"id": "UB 610x229x113", "depth_mm": 607, "mass_kgm": 113, "I_cm4": 87300,  "Wel_cm3": 2880,  "area_cm2": 144},
            {"id": "UB 686x254x125", "depth_mm": 677, "mass_kgm": 125, "I_cm4": 118000, "Wel_cm3": 3480,  "area_cm2": 159},
            {"id": "UB 762x267x134", "depth_mm": 750, "mass_kgm": 134, "I_cm4": 150000, "Wel_cm3": 4000,  "area_cm2": 171},
            {"id": "UB 838x292x176", "depth_mm": 834, "mass_kgm": 176, "I_cm4": 246000, "Wel_cm3": 5900,  "area_cm2": 224},
            {"id": "UB 914x305x201", "depth_mm": 903, "mass_kgm": 201, "I_cm4": 325000, "Wel_cm3": 7200,  "area_cm2": 256},
        ],
        "cost_per_tonne": 900,
        "carbon_kg_t": 1800,
        "description": (
            "S275 structural steel in Universal Beam (UB) sections. Steel has an exceptionally "
            "high strength-to-weight ratio and Young's modulus (210 GPa — 20x stiffer than timber), "
            "allowing far shallower, lighter structures for longer spans. UB sections are I-shaped "
            "to concentrate material in the flanges where bending stress is highest."
        ),
        "pros": ["Very high E and strength", "Lightweight relative to capacity", "Fast construction", "Fully recyclable"],
        "cons": ["Requires fire protection", "Corrosion risk", "Higher cost than RC", "Factory fabrication needed"],
    },

    "steel_s355": {
        "id": "steel_s355",
        "name": "Steel S355 Universal Beam",
        "short_name": "Steel S355",
        "category": "steel",
        "E": 210_000_000,          # kN/m²
        "fy": 355_000,             # kN/m² yield strength
        "unit_weight": 78.5,       # kN/m³
        "gamma_M0": 1.0,
        "available_sections": [
            {"id": "UB 406x178x60",  "depth_mm": 406, "mass_kgm": 60,  "I_cm4": 21500,  "Wel_cm3": 1060,  "area_cm2": 76.5},
            {"id": "UB 457x191x74",  "depth_mm": 457, "mass_kgm": 74,  "I_cm4": 33300,  "Wel_cm3": 1460,  "area_cm2": 94.6},
            {"id": "UB 533x210x101", "depth_mm": 536, "mass_kgm": 101, "I_cm4": 61500,  "Wel_cm3": 2290,  "area_cm2": 129},
            {"id": "UB 610x229x113", "depth_mm": 607, "mass_kgm": 113, "I_cm4": 87300,  "Wel_cm3": 2880,  "area_cm2": 144},
            {"id": "UB 686x254x125", "depth_mm": 677, "mass_kgm": 125, "I_cm4": 118000, "Wel_cm3": 3480,  "area_cm2": 159},
            {"id": "UB 762x267x134", "depth_mm": 750, "mass_kgm": 134, "I_cm4": 150000, "Wel_cm3": 4000,  "area_cm2": 171},
            {"id": "UB 838x292x176", "depth_mm": 834, "mass_kgm": 176, "I_cm4": 246000, "Wel_cm3": 5900,  "area_cm2": 224},
            {"id": "UB 914x305x201", "depth_mm": 903, "mass_kgm": 201, "I_cm4": 325000, "Wel_cm3": 7200,  "area_cm2": 256},
        ],
        "cost_per_tonne": 950,
        "carbon_kg_t": 1850,
        "description": (
            "S355 is a higher-yield structural steel (355 MPa vs 275 MPa), allowing ~29% more "
            "moment capacity for the same section. Commonly preferred for road and rail bridges "
            "where loads are heavier and sections need to be slender. The same UB catalogue applies — "
            "you pay a modest premium but get significantly more strength per kilogram."
        ),
        "pros": ["Higher fy than S275 — ~29% more capacity", "Same sections, smaller/lighter for same span", "Industry standard for bridges"],
        "cons": ["Slightly more expensive", "Same corrosion and fire risks as S275"],
    },
}
