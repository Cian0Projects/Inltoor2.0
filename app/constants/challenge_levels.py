# Bridge Design Challenge level definitions.
# Levels 1-3 are fully implemented. Levels 4-8 are teased as coming soon.

LEVELS: list[dict] = [
    {
        "id": 1,
        "title": "The Village Footbridge",
        "subtitle": "Timber Structures",
        "location": "Rural County Clare, Ireland",
        "brief": (
            "A small rural community needs a footbridge across the Owenriff stream to connect "
            "the village to the primary school. The local council has specified timber "
            "construction to complement the landscape character and minimise embodied carbon. "
            "The bridge must carry a pedestrian crowd load of 6 kN/m (equivalent to a dense "
            "crowd) and span 6 metres between abutments. You are the structural engineer — "
            "select an appropriate timber beam section that satisfies both the strength (ULS) "
            "and deflection (SLS) requirements."
        ),
        # Structural definition
        "span": 6.0,                    # m
        "live_load_type": "udl",
        "live_load_magnitude": 6.0,     # kN/m pedestrian crowd
        "deflection_limit": 400,         # L/400 for footbridges (EC1-2 / NA)
        "load_factors": {"DL": 1.35, "LL": 1.50},   # Eurocode ULS
        "budget": None,                  # No budget constraint on Level 1
        # Materials available in this level
        "allowed_materials": ["timber_c24", "glulam_gl28h"],
        # Star rating thresholds (based on minimum utilisation ratio)
        "star_3_min_eta": 0.60,          # Both η ≥ 0.60 → 3 stars (efficient design)
        "star_2_min_eta": 0.40,          # Both η ≥ 0.40 → 2 stars (reasonable)
        # Educational metadata
        "key_concept": (
            "For timber structures at this span, deflection (SLS) typically governs "
            "over bending strength (ULS). Understanding the difference between stiffness "
            "(E × I, which controls deflection) and strength (fm,d × Z, which controls "
            "moment capacity) is fundamental to structural design."
        ),
        "icon": "🌲",
        "difficulty": 1,
        "coming_soon": False,
    },
    {
        "id": 2,
        "title": "The Farm Track Bridge",
        "subtitle": "Reinforced Concrete",
        "location": "County Tipperary, Ireland",
        "brief": (
            "A farmer needs a new access bridge across an drainage ditch to allow tractors and "
            "agricultural vehicles to reach the eastern fields. The local authority requires a "
            "simply supported RC solid slab bridge spanning 10 metres. The design load is a "
            "vehicle axle load modelled as 30 kN/m UDL (equivalent highway loading for a farm "
            "track). Select a concrete grade and slab depth that satisfies ULS bending and SLS "
            "deflection checks. Remember: concrete is heavy — self-weight is a large fraction "
            "of the total load at this span."
        ),
        "span": 10.0,
        "live_load_type": "udl",
        "live_load_magnitude": 30.0,       # kN/m (vehicle loading per metre width)
        "deflection_limit": 600,            # L/600 for highway bridges
        "load_factors": {"DL": 1.35, "LL": 1.50},
        "budget": None,
        "allowed_materials": ["rc_c30", "rc_c40"],
        "star_3_min_eta": 0.60,
        "star_2_min_eta": 0.40,
        "section_type": "rc",              # tells frontend which UI to show
        "key_concept": (
            "For RC bridges, self-weight can be 40-60% of the total design load. Unlike timber, "
            "where self-weight is small, the concrete slab's own weight grows rapidly with depth — "
            "making the choice of depth a balance between gaining capacity (deeper = more M_Rd) "
            "and adding load (deeper = heavier = more M_Ed). The EC2 simplified bending formula "
            "M_Rd = 0.156 × fck × b × d² reveals that capacity scales with d², while self-weight "
            "scales with d — so increasing depth still helps, but with diminishing returns."
        ),
        "icon": "🚜",
        "difficulty": 2,
        "coming_soon": False,
    },
    {
        "id": 3,
        "title": "The Town Road Crossing",
        "subtitle": "Steel vs Concrete",
        "location": "Galway Ring Road, Ireland",
        "brief": (
            "A new bypass road requires a bridge crossing a river in the outskirts of Galway. "
            "The bridge spans 15 metres and must carry HA highway loading of 20 kN/m per beam "
            "(two main beams at 3m centres). The client has asked you to evaluate both a steel "
            "Universal Beam solution and a reinforced concrete option. At this span, steel UBs "
            "are typically more efficient — your task is to find out why by designing both and "
            "comparing the results. Select the material and section that satisfies ULS bending "
            "and SLS deflection with the best utilisation."
        ),
        "span": 15.0,
        "live_load_type": "udl",
        "live_load_magnitude": 20.0,       # kN/m per beam
        "deflection_limit": 600,            # L/600 for highway bridges
        "load_factors": {"DL": 1.35, "LL": 1.50},
        "budget": None,
        "allowed_materials": ["steel_s275", "steel_s355", "rc_c30", "rc_c40"],
        "star_3_min_eta": 0.60,
        "star_2_min_eta": 0.40,
        "section_type": "mixed",           # RC or Steel depending on material chosen
        "key_concept": (
            "At 15m span, steel becomes highly competitive: a single UB section (I-shaped) "
            "concentrates material in the flanges where bending stress is highest, giving an "
            "excellent moment-to-weight ratio. RC requires a much deeper, heavier section for "
            "the same span, increasing self-weight load significantly. This level illustrates "
            "why material selection is not just about strength — stiffness (E), weight, and "
            "section efficiency all determine the best solution."
        ),
        "icon": "🏙️",
        "difficulty": 2,
        "coming_soon": False,
    },
    {
        "id": 4, "title": "The River Bridge",
        "subtitle": "Long-span Design",
        "brief": "A 25m bridge — why does moment increase so rapidly with span?",
        "icon": "🌊", "difficulty": 3, "coming_soon": True,
        "allowed_materials": ["steel_s275", "steel_s355", "rc_c30", "rc_c40", "glulam_gl28h"],
    },
    {
        "id": 5, "title": "The Motorway Overbridge",
        "subtitle": "Prestressed Concrete",
        "brief": "A 35m motorway overbridge — why pre-stress concrete?",
        "icon": "🛣️", "difficulty": 3, "coming_soon": True,
        "allowed_materials": ["precast_c50"],
    },
    {
        "id": 6, "title": "The Multi-span Viaduct",
        "subtitle": "Continuous Structures",
        "brief": "Three 20m spans — how does continuity reduce moments?",
        "icon": "🌉", "difficulty": 4, "coming_soon": True,
        "allowed_materials": ["steel_s355", "precast_c50"],
    },
    {
        "id": 7, "title": "The Heritage Crossing",
        "subtitle": "Sustainability Challenge",
        "brief": "An 18m crossing with a carbon budget alongside structural requirements.",
        "icon": "🌿", "difficulty": 4, "coming_soon": True,
        "allowed_materials": ["glulam_gl28h", "steel_s355"],
    },
    {
        "id": 8, "title": "The Master Challenge",
        "subtitle": "Open Design",
        "brief": "40m — all materials available. Optimise for cost, carbon and performance.",
        "icon": "🏆", "difficulty": 5, "coming_soon": True,
        "allowed_materials": ["timber_c24", "glulam_gl28h", "rc_c30", "rc_c40", "steel_s275", "steel_s355", "precast_c50"],
    },
]

LEVELS_BY_ID: dict[int, dict] = {lv["id"]: lv for lv in LEVELS}
