from pydantic import BaseModel, Field
from typing import Optional


class ChallengeDesignInput(BaseModel):
    level_id: int = Field(..., ge=1, le=8)
    material_id: str
    depth_mm: int = Field(0, ge=0)          # timber / RC
    section_id: str = Field("")             # steel UB


class CheckResult(BaseModel):
    level_id: int
    material_id: str
    material_name: str
    passed: bool
    stars: int
    section: dict
    uls_bending: dict
    sls_deflection: dict
    cost_estimate_gbp: float
    volume_m3: float
    educational_insight: str
    hint: str
    parameter_explanations: list
    optimal_design: Optional[dict]
    key_concept: str
