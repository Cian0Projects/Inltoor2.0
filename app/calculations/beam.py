import numpy as np


def simply_supported_beam_udl(span, udl, E, I, n=200):
    """
    Simply supported beam with full-span UDL.
    Units:
      span [m], udl [kN/m], E [kN/m^2], I [m^4] => deflection [m]
    """
    r1 = udl * span / 2
    r2 = udl * span / 2

    x = np.linspace(0, span, n)
    shear = r1 - udl * x
    moment = r1 * x - (udl * x**2) / 2

    # Deflection (downward negative). Formula:
    # y(x) = - w x (L^3 - 2 L x^2 + x^3) / (24 E I)
    L = span
    w = udl
    y = -(w * x * (L**3 - 2 * L * x**2 + x**3)) / (24 * E * I)

    max_shear = float(np.max(np.abs(shear)))
    max_moment = float(np.max(moment))
    max_deflection = float(np.min(y))  # most negative (largest downward)

    return {
        "beam_type": "simply_supported_udl",
        "inputs": {"span": span, "udl": udl, "E": E, "I": I},
        "reactions": [float(r1), float(r2)],
        "summary": {
            "max_shear": max_shear,
            "max_moment": max_moment,
            "max_deflection": max_deflection,
            "explanation": "Simply supported beam carrying a full-span uniformly distributed load.",
        },
        "diagram_data": {
            "x": x.tolist(),
            "shear": shear.tolist(),
            "moment": moment.tolist(),
            "deflection": y.tolist(),
        },
    }


def simply_supported_beam_point_load(span, point_load, E, I, n=200):
    """
    Simply supported beam with a point load at midspan.
    Units:
      span [m], point_load [kN], E [kN/m^2], I [m^4] => deflection [m]
    """
    r1 = point_load / 2
    r2 = point_load / 2

    L = span
    P = point_load
    a = L / 2  # midspan

    x = np.linspace(0, L, n)

    # Shear + moment (piecewise)
    shear = np.where(x < a, r1, r1 - P)
    moment = np.where(x < a, r1 * x, r1 * x - P * (x - a))

    # Deflection (downward negative), midspan point load formula (piecewise):
    # for x <= a:  y = -P x (3L^2 - 4x^2) / (48 E I)
    # for x >= a:  symmetry about midspan -> use mirrored x' = L - x
    y_left = -(P * x * (3 * L**2 - 4 * x**2)) / (48 * E * I)
    x_mirror = L - x
    y_right = -(P * x_mirror * (3 * L**2 - 4 * x_mirror**2)) / (48 * E * I)
    y = np.where(x <= a, y_left, y_right)

    max_shear = float(P / 2)
    max_moment = float(P * L / 4)
    max_deflection = float(np.min(y))

    return {
        "beam_type": "simply_supported_point_load",
        "inputs": {"span": span, "point_load": point_load, "E": E, "I": I},
        "reactions": [float(r1), float(r2)],
        "summary": {
            "max_shear": max_shear,
            "max_moment": max_moment,
            "max_deflection": max_deflection,
            "explanation": "Simply supported beam carrying a single point load at midspan.",
        },
        "diagram_data": {
            "x": x.tolist(),
            "shear": shear.tolist(),
            "moment": moment.tolist(),
            "deflection": y.tolist(),
        },
    }


def simply_supported_beam_point_load_generic(
    span, point_load, load_position, E, I, n=200
):
    """
    Simply supported beam with a point load at any position.
    Units:
      span [m], point_load [kN], load_position [m] from left support,
      E [kN/m^2], I [m^4] => deflection [m]
    """
    L = span
    P = point_load
    a = load_position

    # Reactions: moment balance about right support
    r1 = P * (L - a) / L
    r2 = P * a / L

    x = np.linspace(0, L, n)

    # Shear force (piecewise)
    shear = np.where(x < a, r1, r1 - P)

    # Bending moment (piecewise)
    moment = np.where(x < a, r1 * x, r1 * x - P * (x - a))

    # Deflection using standard formula
    # For x < a: y = -P * (L - a) * x * (L^2 - (L-a)^2 - x^2) / (6 * E * I * L)
    # For x >= a: use symmetry and remaining portion
    b = L - a  # distance from load to right support

    y_left = -(P * b * x * (L**2 - b**2 - x**2)) / (6 * E * I * L)
    y_right = -(P * a * (L - x) * (2 * L * x - x**2 - a**2)) / (6 * E * I * L)
    y = np.where(x <= a, y_left, y_right)

    max_shear = float(np.max(np.abs(shear)))
    max_moment = float(np.max(moment))
    max_deflection = float(np.min(y))

    return {
        "beam_type": "simply_supported_point_load_generic",
        "inputs": {
            "span": span,
            "point_load": point_load,
            "load_position": load_position,
            "E": E,
            "I": I,
        },
        "reactions": [float(r1), float(r2)],
        "summary": {
            "max_shear": max_shear,
            "max_moment": max_moment,
            "max_deflection": max_deflection,
            "explanation": "Simply supported beam carrying a single point load at an arbitrary position.",
        },
        "diagram_data": {
            "x": x.tolist(),
            "shear": shear.tolist(),
            "moment": moment.tolist(),
            "deflection": y.tolist(),
        },
    }



def simply_supported_beam_combined_loads(span, loads, E, I, n=200):
    """
    Simply supported beam with combined point loads and UDLs.
    Uses superposition principle.
    
    loads: list of dicts, each with:
      - "type": "point" or "udl"
      - "magnitude": load value in kN or kN/m
      - If "point": "position" (distance from left support in m)
      - If "udl": "start_pos" and "end_pos" (distances in m)
    
    Units: span [m], E [kN/m^2], I [m^4] => deflection [m]
    """
    L = span
    x = np.linspace(0, L, n)
    
    # Initialize cumulative arrays
    total_shear = np.zeros_like(x)
    total_moment = np.zeros_like(x)
    total_deflection = np.zeros_like(x)
    total_reactions = [0.0, 0.0]
    
    # Store calculation steps for educational display
    calculation_steps = []
    
    # Process each load and sum by superposition
    for load_idx, load in enumerate(loads):
        if load["type"] == "point":
            position = load["position"]
            magnitude = load["magnitude"]
            
            # Calculate reactions for this point load
            r1 = magnitude * (L - position) / L
            r2 = magnitude * position / L
            total_reactions[0] += r1
            total_reactions[1] += r2
            
            # Store calculation steps
            calculation_steps.append({
                "load_number": load_idx + 1,
                "load_type": "Point Load",
                "magnitude": magnitude,
                "position": position,
                "steps": [
                    f"Load: {magnitude:.3f} kN at {position:.1f}m from left support",
                    f"Span (L): {L:.1f}m",
                    f"",
                    "REACTIONS:",
                    f"  R₁ (left) = P × (L - a) / L = {magnitude:.3f} × ({L:.1f} - {position:.1f}) / {L:.1f} = {r1:.3f} kN ↑",
                    f"  R₂ (right) = P × a / L = {magnitude:.3f} × {position:.1f} / {L:.1f} = {r2:.3f} kN ↑",
                    f"",
                    "SHEAR FORCE:",
                    f"  Left of load (0 to {position:.1f}m): SF = {r1:.3f} kN",
                    f"  Right of load ({position:.1f} to {L:.1f}m): SF = {r1:.3f} - {magnitude:.3f} = {r1 - magnitude:.3f} kN",
                    f"",
                    "BENDING MOMENT:",
                    f"  General Formula - Left region (0 ≤ x ≤ {position:.1f}m):",
                    f"    M(x) = R₁ × x = {r1:.3f} × x",
                    f"  Example at x = {position:.1f}m (load position - maximum):",
                    f"    M({position:.1f}) = {r1:.3f} × {position:.1f} = {r1 * position:.3f} kNm",
                    f"",
                    f"  General Formula - Right region ({position:.1f}m < x ≤ {L:.1f}m):",
                    f"    M(x) = R₁ × x - P × (x - {position:.1f}) = {r1:.3f}×x - {magnitude:.3f}×(x - {position:.1f})",
                    f"  Example at x = {L:.1f}m (right support):",
                    f"    M({L:.1f}) = {r1:.3f} × {L:.1f} - {magnitude:.3f} × ({L:.1f} - {position:.1f}) = 0 kNm ✓",
                    f"",
                    f"  Boundary values:",
                    f"  At left support (x=0): M = 0 kNm",
                    f"  At load position (x={position:.1f}m): M = {r1 * position:.3f} kNm (maximum)",
                    f"  At right support (x={L:.1f}m): M = 0 kNm",
                ]
            })
            
            # Shear force
            shear = np.where(x < position, r1, r1 - magnitude)
            total_shear += shear
            
            # Bending moment
            moment = np.where(x < position, r1 * x, r1 * x - magnitude * (x - position))
            total_moment += moment
            
            # Deflection
            b = L - position
            y_left = -(magnitude * b * x * (L**2 - b**2 - x**2)) / (6 * E * I * L)
            y_right = -(magnitude * position * (L - x) * (2 * L * x - x**2 - position**2)) / (6 * E * I * L)
            y = np.where(x <= position, y_left, y_right)
            total_deflection += y
            
        elif load["type"] == "udl":
            start_pos = load["start_pos"]
            end_pos = load["end_pos"]
            magnitude = load["magnitude"]
            
            # For UDL over portion
            udl_length = end_pos - start_pos
            udl_total = magnitude * udl_length
            
            # Reactions (center of UDL)
            center = (start_pos + end_pos) / 2
            r1 = udl_total * (L - center) / L
            r2 = udl_total * center / L
            total_reactions[0] += r1
            total_reactions[1] += r2
            
            # Store calculation steps
            calculation_steps.append({
                "load_number": load_idx + 1,
                "load_type": "Distributed Load",
                "magnitude": magnitude,
                "start_pos": start_pos,
                "end_pos": end_pos,
                "steps": [
                    f"Load: {magnitude:.3f} kN/m from {start_pos:.1f}m to {end_pos:.1f}m",
                    f"Span (L): {L:.1f}m",
                    f"Length of UDL: {udl_length:.1f}m",
                    f"",
                    "TOTAL UDL FORCE:",
                    f"  Total Force (w × length) = {magnitude:.3f} × {udl_length:.1f} = {udl_total:.3f} kN",
                    f"  Acts at center of load: {center:.1f}m from left",
                    f"",
                    "REACTIONS:",
                    f"  R₁ (left) = w×L × (L - center) / L = {udl_total:.3f} × ({L:.1f} - {center:.1f}) / {L:.1f} = {r1:.3f} kN ↑",
                    f"  R₂ (right) = w×L × center / L = {udl_total:.3f} × {center:.1f} / {L:.1f} = {r2:.3f} kN ↑",
                    f"",
                    "SHEAR FORCE:",
                    f"  Left region (0 to {start_pos:.1f}m): SF = {r1:.3f} kN (constant)",
                    f"  In load region ({start_pos:.1f} to {end_pos:.1f}m): SF = {r1:.3f} - {magnitude:.3f}×(x - {start_pos:.1f})",
                    f"  Right region ({end_pos:.1f} to {L:.1f}m): SF = {r1 - udl_total:.3f} kN (constant)",
                    f"",
                    "BENDING MOMENT:",
                    f"  General Formula - Left region (0 ≤ x ≤ {start_pos:.1f}m):",
                    f"    M(x) = R₁ × x = {r1:.3f} × x",
                    f"  Example at x = {start_pos:.1f}m:",
                    f"    M({start_pos:.1f}) = {r1:.3f} × {start_pos:.1f} = {r1 * start_pos:.3f} kNm",
                    f"",
                    f"  General Formula - Load region ({start_pos:.1f}m < x ≤ {end_pos:.1f}m):",
                    f"    M(x) = R₁ × x - w/2 × (x - {start_pos:.1f})²",
                    f"    M(x) = {r1:.3f} × x - {magnitude/2:.3f} × (x - {start_pos:.1f})²",
                    f"  Example at x = {end_pos:.1f}m (end of UDL):",
                    f"    M({end_pos:.1f}) = {r1:.3f} × {end_pos:.1f} - {magnitude/2:.3f} × ({end_pos:.1f} - {start_pos:.1f})²",
                    f"    M({end_pos:.1f}) = {r1 * end_pos:.3f} - {magnitude/2:.3f} × {udl_length:.1f}² = {r1 * end_pos - magnitude/2 * udl_length**2:.3f} kNm",
                    f"",
                    f"  General Formula - Right region ({end_pos:.1f}m < x ≤ {L:.1f}m):",
                    f"    M(x) = R₁ × x - w × L × (x - {center:.1f})",
                    f"  Boundary values:",
                    f"  At left support (x=0): M = 0 kNm",
                    f"  At right support (x={L:.1f}m): M = 0 kNm",
                ]
            })
            
            # Shear force (piecewise)
            shear = np.zeros_like(x)
            shear[x <= start_pos] = r1
            shear[(x > start_pos) & (x < end_pos)] = r1 - magnitude * (x[(x > start_pos) & (x < end_pos)] - start_pos)
            shear[x >= end_pos] = r1 - udl_total
            total_shear += shear
            
            # Bending moment (piecewise)
            moment = np.zeros_like(x)
            moment[x <= start_pos] = r1 * x[x <= start_pos]
            
            # In load region
            x_in_load = x[(x > start_pos) & (x < end_pos)]
            moment[(x > start_pos) & (x < end_pos)] = (
                r1 * x_in_load - 
                magnitude * (x_in_load - start_pos)**2 / 2
            )
            
            # After load
            moment[x >= end_pos] = (
                r1 * x[x >= end_pos] - 
                magnitude * udl_length * (x[x >= end_pos] - start_pos - udl_length / 2)
            )
            total_moment += moment
    
    max_shear = float(np.max(np.abs(total_shear)))
    max_moment = float(np.max(total_moment))
    max_deflection = float(np.min(total_deflection)) if np.any(total_deflection < 0) else 0.0
    
    # Find position of max moment for educational context
    max_moment_idx = np.argmax(total_moment)
    max_moment_position = x[max_moment_idx]
    
    # Summary calculation steps
    summary_steps = [
        "SUMMARY OF RESULTS:",
        f"Total Reactions: R₁ = {total_reactions[0]:.3f} kN, R₂ = {total_reactions[1]:.3f} kN",
        f"Maximum Shear Force: {max_shear:.3f} kN",
        f"Maximum Bending Moment: {max_moment:.3f} kNm (at x = {max_moment_position:.1f}m)",
        f"Maximum Deflection: {max_deflection:.2e}m" if max_deflection != 0 else "Maximum Deflection: Negligible",
    ]
    
    return {
        "beam_type": "simply_supported_combined",
        "inputs": {"span": span, "loads": loads, "E": E, "I": I},
        "reactions": [float(total_reactions[0]), float(total_reactions[1])],
        "summary": {
            "max_shear": max_shear,
            "max_moment": max_moment,
            "max_deflection": max_deflection,
            "explanation": "Simply supported beam with combined point loads and distributed loads.",
        },
        "diagram_data": {
            "x": x.tolist(),
            "shear": total_shear.tolist(),
            "moment": total_moment.tolist(),
            "deflection": total_deflection.tolist(),
        },
        "calculations": {
            "load_steps": calculation_steps,
            "summary_steps": summary_steps,
        }
    }


def cantilever_beam_combined_loads(span, loads, E, I, n=200):
    """
    Cantilever beam (fixed at left, free at right) with combined point loads and UDLs.
    Uses superposition principle.
    
    loads: list of dicts, each with:
      - "type": "point" or "udl"
      - "magnitude": load value in kN or kN/m
      - If "point": "position" (distance from fixed support in m)
      - If "udl": "start_pos" and "end_pos" (distances from fixed support in m)
    
    Units: span [m], E [kN/m^2], I [m^4] => deflection [m]
    """
    L = span
    x = np.linspace(0, L, n)
    
    # Initialize cumulative arrays
    total_shear = np.zeros_like(x)
    total_moment = np.zeros_like(x)
    total_deflection = np.zeros_like(x)
    
    # Store calculation steps for educational display
    calculation_steps = []
    
    # Process each load and sum by superposition
    for load_idx, load in enumerate(loads):
        if load["type"] == "point":
            position = load["position"]
            magnitude = load["magnitude"]
            
            # For cantilever: reaction at fixed support = magnitude
            # Store calculation steps
            calculation_steps.append({
                "load_number": load_idx + 1,
                "load_type": "Point Load",
                "magnitude": magnitude,
                "position": position,
                "steps": [
                    f"Load: {magnitude:.3f} kN at {position:.1f}m from fixed support",
                    f"Cantilever span (L): {L:.1f}m",
                    f"Distance from free end: {L - position:.1f}m",
                    f"",
                    "REACTION AT FIXED SUPPORT:",
                    f"  Reaction Force (R) = {magnitude:.3f} kN ↑",
                    f"  Reaction Moment (M₀) = P × (L - a) = {magnitude:.3f} × {L - position:.1f} = {magnitude * (L - position):.3f} kNm",
                    f"",
                    "SHEAR FORCE:",
                    f"  Entire beam (0 to {L:.1f}m): SF = {magnitude:.3f} kN (constant)",
                    f"",
                    "BENDING MOMENT:",
                    f"  General Formula (0 ≤ x ≤ {L:.1f}m):",
                    f"    M(x) = P × (L - x)",
                    f"    M(x) = {magnitude:.3f} × ({L:.1f} - x)",
                    f"",
                    f"  Example values along the beam:",
                    f"    At x = 0 (fixed support - maximum): M(0) = {magnitude:.3f} × {L:.1f} = {magnitude * L:.3f} kNm",
                    f"    At x = {position:.1f}m (load position): M({position:.1f}) = {magnitude:.3f} × {L - position:.1f} = {magnitude * (L - position):.3f} kNm",
                    f"    At x = {L:.1f}m (free end): M({L:.1f}) = {magnitude:.3f} × 0 = 0 kNm ✓",
                    f"",
                    f"  Note: Moment decreases linearly from fixed end to free end",
                ]
            })
            
            # Shear force (constant for cantilever with point load)
            shear = np.full_like(x, magnitude)
            total_shear += shear
            
            # Bending moment: M(x) = P × (L - x)
            moment = magnitude * (L - x)
            total_moment += moment
            
            # Deflection for cantilever with point load at position a
            # y(x) = -(P / (6*E*I)) * (3*L²*x - x³ - 3*L*a²*x + a³) for general cantilever
            # Simplified for point load at position 'a':
            # For 0 <= x <= a: y = -(P*x²/(6*E*I)) * (3*L - 3*a - x)
            # For a < x <= L: y = -(P*a/(6*E*I)) * (3*L*(x-a) - (x-a)² - a²) 
            # Actually, simpler formula:
            # For 0 <= x <= a: y = -(P/(6*E*I)) * x² * (3*(L-a) - x)
            # For a < x <= L: y = -(P/(6*E*I)) * (3*L*a*(L-x) + a³ - (L-x)³)
            
            # Using standard cantilever deflection formula
            y = np.zeros_like(x)
            for i, xi in enumerate(x):
                if xi <= position:
                    # Before the load
                    y[i] = -(magnitude * xi**2 / (6 * E * I)) * (3 * (L - position) - xi)
                else:
                    # After the load
                    y[i] = -(magnitude / (6 * E * I)) * (3 * L * position * (L - xi) + position**3 - (L - xi)**3)
            
            total_deflection += y
            
        elif load["type"] == "udl":
            start_pos = load["start_pos"]
            end_pos = load["end_pos"]
            magnitude = load["magnitude"]
            
            # For UDL over portion
            udl_length = end_pos - start_pos
            udl_total = magnitude * udl_length
            center = (start_pos + end_pos) / 2
            
            # Store calculation steps
            steps = [
                f"Load: {magnitude:.3f} kN/m from {start_pos:.1f}m to {end_pos:.1f}m",
                f"Cantilever span (L): {L:.1f}m",
                f"Length of UDL: {udl_length:.1f}m",
                f"",
                "TOTAL UDL FORCE:",
                f"  Total Force (w × length) = {magnitude:.3f} × {udl_length:.1f} = {udl_total:.3f} kN",
                f"  Acts at center of load: {center:.1f}m from fixed support",
                f"",
                "REACTION AT FIXED SUPPORT:",
                f"  Reaction Force (R) = {udl_total:.3f} kN ↑",
                f"  Reaction Moment (M₀) = w × length × (L - {center:.1f})",
                f"  M₀ = {magnitude:.3f} × {udl_length:.1f} × ({L:.1f} - {center:.1f}) = {udl_total * (L - center):.3f} kNm",
                f"",
                "SHEAR FORCE:",
                f"  Before load (0 to {start_pos:.1f}m): SF = {udl_total:.3f} kN (constant)",
                f"  In load region ({start_pos:.1f} to {end_pos:.1f}m): SF increases from {udl_total:.3f} to {udl_total + magnitude * udl_length:.3f} kN",
                f"  After load ({end_pos:.1f} to {L:.1f}m): SF = {udl_total + magnitude * udl_length:.3f} kN (constant)",
                f"",
                "BENDING MOMENT:",
            ]
            
            # Add correct formulas based on whether there's a "before load" region
            if start_pos > 0:
                steps.extend([
                    f"  General Formula - Before load (0 ≤ x ≤ {start_pos:.1f}m):",
                    f"    M(x) = w × (end_pos² - start_pos²)/2 - w × (end_pos - start_pos) × x",
                    f"    M(x) = {magnitude:.3f} × ({end_pos**2:.1f} - {start_pos**2:.1f})/2 - {magnitude:.3f} × ({end_pos - start_pos:.1f}) × x",
                    f"  Example at x = 0 (fixed support):",
                    f"    M(0) = {magnitude * (end_pos**2 - start_pos**2) / 2:.3f} kNm",
                    f"",
                ])
            
            steps.extend([
                f"  General Formula - In load region ({start_pos:.1f}m ≤ x ≤ {end_pos:.1f}m):",
                f"    M(x) = (w/2) × (end_pos - x)²",
                f"    M(x) = {magnitude/2:.3f} × ({end_pos:.1f} - x)²",
                f"  Example at x = {start_pos:.1f}m (start of UDL):",
                f"    M({start_pos:.1f}) = {magnitude/2:.3f} × ({end_pos:.1f} - {start_pos:.1f})² = {magnitude/2 * (end_pos - start_pos)**2:.3f} kNm",
                f"  Example at x = {end_pos:.1f}m (end of UDL):",
                f"    M({end_pos:.1f}) = {magnitude/2:.3f} × 0² = 0 kNm",
                f"",
                f"  Boundary values:",
                f"  At fixed support (x=0): M = {(magnitude/2) * (end_pos**2):.3f} kNm (maximum)",
                f"  At end of UDL (x={end_pos:.1f}m): M = 0 kNm",
                f"  At free end (x={L:.1f}m): M = 0 kNm",
            ])
            
            calculation_steps.append({
                "load_number": load_idx + 1,
                "load_type": "Distributed Load",
                "magnitude": magnitude,
                "start_pos": start_pos,
                "end_pos": end_pos,
                "steps": steps
            })
            
            # Shear force (piecewise for cantilever with UDL)
            shear = np.zeros_like(x)
            shear[x < start_pos] = udl_total
            shear[(x >= start_pos) & (x <= end_pos)] = udl_total + magnitude * (x[(x >= start_pos) & (x <= end_pos)] - start_pos)
            shear[x > end_pos] = udl_total + magnitude * udl_length
            total_shear += shear
            
            # Bending moment for cantilever with UDL
            # For x < start_pos: M(x) = w * [(end_pos² - start_pos²)/2 - x*(end_pos - start_pos)]
            # For start_pos <= x <= end_pos: M(x) = w/2 * (end_pos - x)²
            # For x > end_pos: M(x) = 0
            moment = np.zeros_like(x)
            
            # Before UDL
            moment[x < start_pos] = magnitude * ((end_pos**2 - start_pos**2) / 2 - x[x < start_pos] * (end_pos - start_pos))
            
            # In UDL region
            x_in_load = x[(x >= start_pos) & (x <= end_pos)]
            moment[(x >= start_pos) & (x <= end_pos)] = magnitude / 2 * (end_pos - x_in_load)**2
            
            # After UDL: moment is zero
            moment[x > end_pos] = 0
            
            total_moment += moment
    
    max_shear = float(np.max(np.abs(total_shear)))
    max_moment = float(np.max(total_moment))
    max_deflection = float(np.min(total_deflection))
    
    # Find position of max moment
    max_moment_idx = 0
    max_moment_position = 0.0
    
    # Summary calculation steps
    summary_steps = [
        "SUMMARY OF RESULTS:",
        f"Maximum Shear Force: {max_shear:.3f} kN (typically at fixed support)",
        f"Maximum Bending Moment: {max_moment:.3f} kNm (at x = {max_moment_position:.1f}m - at fixed support)",
        f"Maximum Deflection: {max_deflection:.2e}m" if max_deflection != 0 else "Maximum Deflection: Negligible",
    ]
    
    return {
        "beam_type": "cantilever_combined",
        "inputs": {"span": span, "loads": loads, "E": E, "I": I},
        "reactions": [float(total_shear[0]), float(max_moment)],  # [reaction force, reaction moment]
        "summary": {
            "max_shear": max_shear,
            "max_moment": max_moment,
            "max_deflection": max_deflection,
            "explanation": "Cantilever beam (fixed at left) with combined point loads and distributed loads.",
        },
        "diagram_data": {
            "x": x.tolist(),
            "shear": total_shear.tolist(),
            "moment": total_moment.tolist(),
            "deflection": total_deflection.tolist(),
        },
        "calculations": {
            "load_steps": calculation_steps,
            "summary_steps": summary_steps,
        }
    }
