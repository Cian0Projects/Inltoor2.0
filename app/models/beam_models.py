from pydantic import BaseModel, Field
from typing import List, Union


DEFAULT_E = 210_000_000.0  # kN/m^2 (≈ 210 GPa)
DEFAULT_I = 1e-4          # m^4 (placeholder)


class BeamUDLInput(BaseModel):
    span: float = Field(..., gt=0, description="Beam span in metres")
    udl: float = Field(..., ge=0, description="Uniformly distributed load in kN/m")
    E: float = Field(DEFAULT_E, gt=0, description="Young's modulus in kN/m^2")
    I: float = Field(DEFAULT_I, gt=0, description="Second moment of area in m^4")


class BeamPointLoadInput(BaseModel):
    span: float = Field(..., gt=0, description="Beam span in metres")
    point_load: float = Field(..., ge=0, description="Point load in kN")
    E: float = Field(DEFAULT_E, gt=0, description="Young's modulus in kN/m^2")
    I: float = Field(DEFAULT_I, gt=0, description="Second moment of area in m^4")


class BeamPointLoadGenericInput(BaseModel):
    span: float = Field(..., gt=0, description="Beam span in metres")
    point_load: float = Field(..., ge=0, description="Point load in kN")
    load_position: float = Field(..., description="Load position from left support in metres")
    E: float = Field(DEFAULT_E, gt=0, description="Young's modulus in kN/m^2")
    I: float = Field(DEFAULT_I, gt=0, description="Second moment of area in m^4")

    class Config:
        json_schema_extra = {
            "example": {
                "span": 10.0,
                "point_load": 50.0,
                "load_position": 4.0,
                "E": 210_000_000.0,
                "I": 1e-4,
            }
        }


class PointLoad(BaseModel):
    type: str = Field("point", description="Load type")
    magnitude: float = Field(..., gt=0, description="Point load magnitude in kN")
    position: float = Field(..., description="Load position from left support in metres")


class UDLoad(BaseModel):
    type: str = Field("udl", description="Load type")
    magnitude: float = Field(..., gt=0, description="Distributed load in kN/m")
    start_pos: float = Field(..., description="Start position from left support in metres")
    end_pos: float = Field(..., description="End position from left support in metres")


class CombinedLoadsInput(BaseModel):
    beam_type: str = Field("simply_supported", description="Beam type: 'simply_supported' or 'cantilever'")
    span: float = Field(..., gt=0, description="Beam span in metres")
    loads: List[Union[PointLoad, UDLoad]] = Field(..., description="List of loads (point and/or UDL)")
    E: float = Field(DEFAULT_E, gt=0, description="Young's modulus in kN/m^2")
    I: float = Field(DEFAULT_I, gt=0, description="Second moment of area in m^4")

    class Config:
        json_schema_extra = {
            "example": {
                "beam_type": "simply_supported",
                "span": 10.0,
                "loads": [
                    {"type": "point", "magnitude": 50.0, "position": 3.0},
                    {"type": "udl", "magnitude": 10.0, "start_pos": 5.0, "end_pos": 8.0}
                ],
                "E": 210_000_000.0,
                "I": 1e-4,
            }
        }

