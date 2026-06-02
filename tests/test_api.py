from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_root_route():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Inltoor"}


def test_health_route():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_beam_udl_route():
    payload = {
        "span": 6,
        "udl": 10
    }

    response = client.post("/beam/udl", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["beam_type"] == "simply_supported_udl"
    assert data["inputs"]["span"] == 6
    assert data["inputs"]["udl"] == 10
    assert data["reactions"][0] == 30
    assert data["reactions"][1] == 30
    assert "summary" in data
    assert "diagram_data" in data


def test_beam_point_load_route():
    payload = {
        "span": 6,
        "point_load": 20
    }

    response = client.post("/beam/point-load", json=payload)

    assert response.status_code == 200

    data = response.json()

    assert data["beam_type"] == "simply_supported_point_load"
    assert data["inputs"]["span"] == 6
    assert data["inputs"]["point_load"] == 20
    assert data["reactions"][0] == 10
    assert data["reactions"][1] == 10
    assert data["summary"]["max_moment"] == 30.0

def test_beam_udl_invalid_span():
    payload = {
        "span": 0,
        "udl": 10
    }

    response = client.post("/beam/udl", json=payload)

    assert response.status_code == 422