from fastapi import APIRouter, HTTPException
from app.models.challenge_models import ChallengeDesignInput, CheckResult
from app.calculations.bridge_challenge import check_design
from app.constants.challenge_levels import LEVELS

router = APIRouter(prefix="/challenge", tags=["Challenge"])


@router.get("/levels")
def get_levels():
    """Return all level definitions (brief, constraints, coming_soon flag)."""
    return {"levels": LEVELS}


@router.post("/check", response_model=CheckResult)
def check_design_endpoint(data: ChallengeDesignInput):
    """Run ULS + SLS checks on a submitted timber beam design."""
    try:
        result = check_design(
            level_id=data.level_id,
            material_id=data.material_id,
            depth_mm=data.depth_mm,
            section_id=data.section_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result
