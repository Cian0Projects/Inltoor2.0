from fastapi import APIRouter
from app.models.beam_models import (
    BeamUDLInput,
    BeamPointLoadInput,
    BeamPointLoadGenericInput,
    CombinedLoadsInput,
)
from app.calculations.beam import (
    simply_supported_beam_udl,
    simply_supported_beam_point_load,
    simply_supported_beam_point_load_generic,
    simply_supported_beam_combined_loads,
    cantilever_beam_combined_loads,
)

router = APIRouter(prefix="/beam", tags=["Beam"])


@router.post("/udl")
def calculate_beam_udl(data: BeamUDLInput):
    return simply_supported_beam_udl(
        span=data.span,
        udl=data.udl,
        E=data.E,
        I=data.I,
    )


@router.post("/point-load")
def calculate_beam_point_load(data: BeamPointLoadInput):
    return simply_supported_beam_point_load(
        span=data.span,
        point_load=data.point_load,
        E=data.E,
        I=data.I,
    )


@router.post("/point-load-generic")
def calculate_beam_point_load_generic(data: BeamPointLoadGenericInput):
    return simply_supported_beam_point_load_generic(
        span=data.span,
        point_load=data.point_load,
        load_position=data.load_position,
        E=data.E,
        I=data.I,
    )


@router.post("/combined-loads")
def calculate_beam_combined_loads(data: CombinedLoadsInput):
    if data.beam_type == "cantilever":
        return cantilever_beam_combined_loads(
            span=data.span,
            loads=[load.dict() for load in data.loads],
            E=data.E,
            I=data.I,
        )
    else:  # simply_supported (default)
        return simply_supported_beam_combined_loads(
            span=data.span,
            loads=[load.dict() for load in data.loads],
            E=data.E,
            I=data.I,
        )

