import pytest
from app.calculations.beam import simply_supported_beam_udl, simply_supported_beam_point_load


def test_udl_reactions_sum_to_total_load():
    res = simply_supported_beam_udl(span=10, udl=5, E=200_000_000, I=8e-4)
    r1, r2 = res["reactions"]
    total = 5 * 10
    assert pytest.approx(r1 + r2, rel=1e-9) == total


def test_udl_max_moment():
    L = 10
    w = 5
    res = simply_supported_beam_udl(span=L, udl=w, E=200_000_000, I=8e-4)
    # Max moment for full UDL: wL^2/8
    assert pytest.approx(res["summary"]["max_moment"], rel=1e-2) == w * L**2 / 8


def test_point_load_max_moment():
    L = 10
    P = 20
    res = simply_supported_beam_point_load(span=L, point_load=P, E=200_000_000, I=8e-4)
    # Max moment at midspan: PL/4
    assert pytest.approx(res["summary"]["max_moment"], rel=1e-9) == P * L / 4


def test_point_load_reactions_sum_to_load():
    res = simply_supported_beam_point_load(span=10, point_load=20, E=200_000_000, I=8e-4)
    r1, r2 = res["reactions"]
    assert pytest.approx(r1 + r2, rel=1e-9) == 20